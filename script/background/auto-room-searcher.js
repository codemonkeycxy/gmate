// ==================== global variable management ======================
(async () => await bootstrap())();

function saveGlobalVariables() {
  const snapshot = {
    toBeFulfilled: toBeFulfilled,
    workerTabId: workerTabId,
    currentTask: currentTask,
    taskVersion: taskVersion,
    lastActiveTs: lastActiveTs
  };
  console.log(`taking a snapshot of the current global variables`);
  persist({
    'background-global-variables': snapshot
  });
}

async function bootstrap() {
  const result = await getFromStorage({'background-global-variables': {}});
  const globalVars = result['background-global-variables'];
  console.log(`loaded global variables ${JSON.stringify(globalVars)}`);

  toBeFulfilled = globalVars.toBeFulfilled || [];
  workerTabId = globalVars.workerTabId || null;
  currentTask = globalVars.currentTask || null;
  taskVersion = globalVars.taskVersion || 0;
  lastActiveTs = globalVars.lastActiveTs || Date.now();

  // push the saved current task into the task queue to start afresh
  enqueue(currentTask);
  currentTask = null;

  if (workerTabId) {
    chrome.tabs.get(workerTabId, () => {
      if (chrome.runtime.lastError) {
        console.log(`worker ${workerTabId} is no longer available. resetting...`);
        workerTabId = null;
        startWorker();
      }
    });
  }
}

// ==================== worker management ======================
chrome.extension.onConnect.addListener(port =>
  port.onMessage.addListener(msg => {
    if (msg.type === START_WORKER) {
      startWorker();
    }

    if (msg.type === STOP_WORKER) {
      stopWorker();
    }
  })
);

chrome.tabs.onRemoved.addListener(tabId => {
  if (tabId === workerTabId) {
    stopWorker();
  }
});

function startWorker() {
  if (workerTabId) {
    // don't spawn if there's already one
    return;
  }

  console.log('initiating worker...');
  chrome.tabs.create({
    url: CALENDAR_PAGE_URL_PREFIX,
    active: false,
    pinned: true
  }, tab => {
    workerTabId = tab.id;
    console.log(`worker ${workerTabId} initiated`);
    nextTask();
  });
}

function stopWorker() {
  if (!workerTabId) {
    // nothing to kill
    return;
  }

  enqueue(currentTask);
  currentTask = null;
  if (getAllEventTasks().length > 0) {
    notify('Caution!', 'Room searching is paused');
  }

  console.log(`removing worker ${workerTabId}...`);
  chrome.tabs.remove(workerTabId, () => {
    console.log(`worker ${workerTabId} removed`);
    workerTabId = null;
  });
}

// todo: don't book for meetings in the past
// todo: try out google calendar api
// https://developers.google.com/calendar/quickstart/js#step_1_turn_on_the
// https://stackoverflow.com/questions/49427531/chrome-extension-integrating-with-google-calendar-api
// todo: add daily quota and anti-greedy mechanism
// todo: add google analytics on queue size and other user behaviors
// todo: allow per "i need a room" regex setting, and save past configurations for quick select
// todo: who's holding my fav room. or large room for small group
// todo: link to rating page
// todo: (in the future) donation
// todo: option to automatically pause when on battery/battery is low
// todo: consider retiring super old tasks
// todo: send crash log to google analytics for debugging
// todo: room booking notification "confirm" button doesn't work on windows
// todo: log last error to mixpanel
// todo: (maybe) wrap background scripts with self-invoking function
// use self-referring get function https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get
// todo: add prioritization function, allow room size preference and VC preference
// prioritization paper: https://pubsonline.informs.org/doi/pdf/10.1287/ited.2013.0124
// todo: bulma styling and create elements with html
// todo: check unblock youku's styling
// https://stackoverflow.com/questions/494143/creating-a-new-dom-element-from-an-html-string-using-built-in-dom-methods-or-pro
// todo: inject an identifier to the worker page and use that to either reuse/recycle worker upon app restart
// todo: record request to fulfillment time
// todo: log room booking stats by location
// todo: task removal is buggy
// todo: allow user to be opted out of tracking
// todo: log user version
// todo: list recently fulfilled events
// todo: maybe add "I need a room" button to the main calendar page
// todo: educate people about advanced features - provide a guide by the "i need a room" button
// todo: detect "too many failures"
// todo: change logo color when the worker is paused
// https://etc.usf.edu/presentations/extras/letters/varsity_letters/36/19/index.html
// https://stackoverflow.com/questions/8894461/updating-an-extension-button-dynamically-inspiration-required
// todo: share gmate in lifehack uchat room
// todo: randomly ask user for rating
// todo: consider auto open control panel upon installation
// todo: allow setting multiple room searching filters in one hit

// ==================== Task Queue Management ======================
onMessage((msg, sender, sendResponse) => {
  if (msg.type === ROOM_TO_BE_FULFILLED) {
    const eventId = msg.data.eventId;
    const eventName = msg.data.eventName;
    const eventFilters = msg.data.eventFilters;
    if (!eventId) {
      // if this happens there's a bug
      throw new Error(`received empty event id. event name: ${eventName}`);
    }

    enqueue(eventTask(eventId, eventName, eventFilters));
    track(ROOM_TO_BE_FULFILLED);
    if (!workerTabId) {
      startWorker();
    }
  }

  if (msg.type === ROOM_TO_BE_FULFILLED_FAILURE) {
    const eventName = msg.data.eventName;
    const eventIds = msg.data.eventIds;

    console.log(
      `Expecting to register 1 event to the queue but found - event name: ${
        eventName
        } event ids: ${JSON.stringify(eventIds)}`
    );
    notify(
      'Oops. We encountered a problem',
      'Please open the meeting up and click "I need a room" again'
    );
  }
});

onMessage((msg, sender, cb) => {
  if (msg.type === GET_QUEUE) {
    cb({
      type: GET_QUEUE,
      data: {
        eventTasks: getAllEventTasks(),
        workerTabId: workerTabId
      }
    });
  }

  if (msg.type === REMOVE_TASK) {
    removeTask(msg.data.taskId);
    cb({
      type: REMOVE_TASK,
      data: {
        eventTasks: getAllEventTasks(),
        workerTabId: workerTabId
      }
    });
  }
});

// ==================== heartbeat ======================
async function heartbeat() {
  console.log('heartbeat check. still alive...');
  saveGlobalVariables();

  if (workerTabId && currentTask && currentTask.type === EVENT) {
    const worker = await getTabById(workerTabId);
    // if an event no longer exists, remove on to the next task
    if (worker.url.includes('removed')) {
      console.log(`${JSON.stringify(currentTask)} no longer exists, moving on to the next task...`);
      // replace the dead url with the calendar main page url
      loadUrlOnWorker(CALENDAR_PAGE_URL_PREFIX);
      return nextTask();
    }
  }

  if (Date.now() - lastActiveTs > FIVE_MIN_MS) {
    console.log('worker idle for more than 5 min, resurrecting...');

    enqueue(currentTask);
    nextTask();
  }
}

// fire a heartbeat check every minute
setInterval(heartbeat, ONE_MIN_MS);


// ==================== state machine ======================

function nextTask() {
  console.log(`set last active timestamp to ${lastActiveTs.toString()}`);
  console.log(`current work: ${JSON.stringify(toBeFulfilled)}; task version: ${taskVersion}`);
  lastActiveTs = Date.now();
  taskVersion++;
  currentTask = null;

  if (!workerTabId) {
    return console.log('worker not available. processing paused');
  }

  if (toBeFulfilled.length === 0) {
    return console.log('no task to fulfill. waiting for new tasks to come in');
  }

  const nextAction = dequeue();
  currentTask = nextAction;
  if (nextAction.type === NAP) {
    console.log('nap for one min');
    return setTimeout(wakeUp, ONE_MIN_MS, taskVersion);
  }

  // throw in a random delay to avoid getting throttled by Google
  const randDelay = getRandomInt(TEN_SEC_MS);
  console.log(`next task will start in ${Math.round(randDelay / 1000)} sec...`);
  setTimeout(() => {
    console.log('load next event');
    loadEventPage();
  }, randDelay);
}

function wakeUp(taskVersionBeforeNap) {
  if (taskVersionBeforeNap !== taskVersion) {
    console.log(`the world has moved on when I was sleeping... my task version: ${taskVersionBeforeNap}, current task version: ${taskVersion}`);
  } else {
    nextTask();
  }
}

function loadEventPage() {
  if (!currentTask || currentTask.type !== EVENT) {
    return;
  }

  const eventId = currentTask.data.eventId;
  const urlToLoad = `${EDIT_PAGE_URL_PREFIX}/${eventId}`;

  preparePostLoad(urlToLoad);
  console.log(`load new url ${urlToLoad}`);
  loadUrlOnWorker(urlToLoad);
}

function preparePostLoad(urlToLoad) {
  function pageLoadListener(tabId, changeInfo, tab) {
    const isWorker = tabId === workerTabId;
    const isTargetUrl = tab.url === urlToLoad;
    const isLoaded = changeInfo.status === "complete";

    if (isWorker && isTargetUrl && isLoaded) {
      console.log(`${urlToLoad} loaded.`);
      // remove listener after handling the expected event to avoid double trigger
      chrome.tabs.onUpdated.removeListener(pageLoadListener);
      triggerRoomBooking();
    }
  }

  onTabUpdated(pageLoadListener, ONE_HOUR_MS);
}

function triggerRoomBooking() {
  preparePostTrigger();
  console.log('trigger room booking');
  emit(workerTabId, {
    type: AUTO_ROOM_BOOKING,
    data: {
      eventFilters: currentTask.data.eventFilters,
      forceBookOnEdit: true
    }
  });
}

function preparePostTrigger() {
  function roomSelectionListener(msg, sender, sendResponse) {
    if (!currentTask || currentTask.type !== EVENT) {
      return;
    }

    const eventId = currentTask.data.eventId;
    const eventName = currentTask.data.eventName;

    if (msg.type === ROOM_SELECTED && msg.data.eventId === eventId) {
      console.log(`room ${msg.data.roomName} selected for ${JSON.stringify(currentTask)}`);

      chrome.notifications.create(`${CONFIRM_ROOM_BOOKING_PREFIX}${eventId}`, {
        iconUrl: "icon.png",
        type: 'basic',
        title: `Room found for ${eventName}!`,
        message: '[!!IMPORTANT!!] Click "more" => "confirm"',
        buttons: [{title: 'confirm'}],
        requireInteraction: true
      }, notificationId => {
        // withdraw notification if the user hasn't take an action for 30 sec, otherwise the room hold will become stale
        setTimeout(() => chrome.notifications.clear(notificationId), 3 * TEN_SEC_MS);
      });

      // remove listener after handling the expected event to avoid double trigger
      chrome.runtime.onMessage.removeListener(roomSelectionListener);
      save();
    }

    if (msg.type === NO_NEED_TO_BOOK && msg.data.eventId === eventId) {
      console.log(`no need to book for ${JSON.stringify(currentTask)}`);
      // remove listener after handling the expected event to avoid double trigger
      chrome.runtime.onMessage.removeListener(roomSelectionListener);
      nextTask();
    }

    if (msg.type === NO_ROOM_FOUND && msg.data.eventId === eventId) {
      // enqueue the event to be searched later
      console.log(`no room found for ${JSON.stringify(currentTask)}`);

      enqueue(currentTask);
      // remove listener after handling the expected event to avoid double trigger
      chrome.runtime.onMessage.removeListener(roomSelectionListener);
      nextTask();
    }
  }

  onMessage(roomSelectionListener, ONE_HOUR_MS);
}

(function handleRoomBookingConfirmation() {
  chrome.notifications.onButtonClicked.addListener(notificationId => {
    if (!notificationId.includes(CONFIRM_ROOM_BOOKING_PREFIX)) {
      return;
    }

    chrome.tabs.update(workerTabId, {active: true});
  });
})();

(function handleRoomBookingCancellation() {
  chrome.notifications.onClosed.addListener((notificationId, byUser) => {
    if (!notificationId.includes(CONFIRM_ROOM_BOOKING_PREFIX)) {
      return;
    }

    if (!byUser) {
      // only react to user actions
      return;
    }

    const eventId = notificationId.replace(CONFIRM_ROOM_BOOKING_PREFIX, '');
    if (!currentTask || currentTask.type !== EVENT || currentTask.data.eventId !== eventId) {
      return;
    }

    console.log(`user cancelled task: ${JSON.stringify(currentTask)}. Moving on to the next...`);
    nextTask();
  });
})();

function save() {
  preparePostSave();
  console.log(`trigger save for ${JSON.stringify(currentTask)}`);
  emit(workerTabId, {type: SAVE_EDIT});
}

function preparePostSave() {

  function editSavedListener(msg, sender, sendResponse) {
    if (!currentTask || currentTask.type !== EVENT) {
      return;
    }

    const eventId = currentTask.data.eventId;

    if (msg.type === EDIT_SAVED && msg.data.eventId === eventId) {
      console.log(`room saved for ${JSON.stringify(currentTask)}`);
      track('room-saved');
      // refresh calendar main page so that it reflects the newly booked room
      refreshCalendarMainPage({excludeTabIds: [workerTabId]});
      // remove listener after handling the expected event to avoid double trigger
      chrome.runtime.onMessage.removeListener(editSavedListener);
      nextTask();
    }

    if (msg.type === SAVE_EDIT_FAILURE && msg.data.eventId === eventId) {
      console.log(`failed to save room for ${JSON.stringify(currentTask)}`);

      enqueue(currentTask);
      // remove listener after handling the expected event to avoid double trigger
      chrome.runtime.onMessage.removeListener(editSavedListener);
      nextTask();
    }
  }

  onMessage(editSavedListener, ONE_HOUR_MS);
}

// ==================== helpers ======================

function enqueue(task) {
  if (!task) {
    return console.log('nothing to enqueue, move on...');
  }

  if (task.type !== EVENT) {
    return console.log(`only need enqueue event tasks. ignoring ${JSON.stringify(task)}`);
  }

  if (isEventInQueue(task)) {
    return console.log(`${JSON.stringify(task)} is already in the queue`);
  }

  // add some buffer so that we don't retry immediately
  console.log(`enqueuing ${JSON.stringify(task)}...`);
  toBeFulfilled.push(...getNapFillers(5), task);
  saveGlobalVariables();
}

function dequeue() {
  const task = toBeFulfilled.shift();
  console.log(`dequeuing ${JSON.stringify(task)}...`);

  saveGlobalVariables();
  return task;
}

function removeTask(taskId) {
  console.log(`trying to remove task with id ${taskId}...`);

  if (currentTask && currentTask.id === taskId) {
    return console.warn(`unable to remove the current task ${currentTask} that's under lock`);
  }

  const oldLength = toBeFulfilled.length;
  toBeFulfilled = toBeFulfilled.filter(task => task.id !== taskId);
  saveGlobalVariables();
  const newLength = toBeFulfilled.length;

  if (newLength === oldLength - 1) {
    return console.log(`successfully removed task with id ${taskId}`);
  }

  console.error(`an error occurred during task removal. old task count ${oldLength}, new task count ${newLength}`);
}

function eventTask(eventId, eventName, eventFilters) {
  return {
    id: nextId(),
    type: EVENT,
    data: {
      eventId: eventId,
      eventName: eventName,
      eventFilters: eventFilters
    }
  };
}

function napTask() {
  return {
    id: nextId(),
    type: NAP
  }
}

function estimateTimeToCompletion() {
  const avgEventTaskTime = 1 / 10;  // one tenth of a minute (aka 10 tasks per minute)
  let timeToCompletion = 0;

  toBeFulfilled.forEach(task => timeToCompletion += task.type === NAP ? 1 : avgEventTaskTime);
  return Math.round(timeToCompletion);
}

function isEventInQueue(eventTask) {
  // we purposefully NOT dedup against the currentTask here
  // since we have use cases that we need to push the current task back into the queue
  return toBeFulfilled.filter(task => {
    if (task.type !== EVENT) {
      return false;
    }

    return task.data.eventId === eventTask.data.eventId && deepEqual(task.data.eventFilters, eventTask.data.eventFilters);
  }).length > 0;
}

/**
 * return all the event tasks from the task queue. Note the return value includes the currentTask as well
 */
function getAllEventTasks() {
  const toBeFulFilledEventTasks = toBeFulfilled.filter(task => task.type === EVENT);

  if (currentTask && currentTask.type === EVENT) {
    return [currentTask, ...toBeFulFilledEventTasks];
  } else {
    return toBeFulFilledEventTasks;
  }
}

function getNapFillers(napMinutes) {
  console.log(`trying to add a ${napMinutes} minutes nap to the task queue...`);

  const timeToCompletion = estimateTimeToCompletion();
  const fillers = [];
  if (timeToCompletion >= napMinutes) {
    console.log(`just kidding. it will already take ${timeToCompletion} minutes to complete the current tasks. no need to nap more`);
    return fillers;
  }

  napMinutes = napMinutes - timeToCompletion;
  console.log(`given the current tasks will take ${timeToCompletion} minutes complete, adding ${napMinutes} minutes nap to the task queue...`);
  for (let i = 0; i < napMinutes; i++) {
    fillers.push(napTask());
  }

  return fillers;
}

function loadUrlOnWorker(urlToLoad) {
  chrome.tabs.update(workerTabId, {
    url: urlToLoad,
    active: false,
    pinned: true
  });
}
