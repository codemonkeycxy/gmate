// ==================== worker management ======================
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

  if (getNapFillers().length > 0) {
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
// todo: convert regex to more user-friendly settings (use google sheet condition as a reference), with !important
// todo: allow per "i need a room" regex setting, and save past configurations for quick select
// todo: ask users for room name examples and find commonality among them
// todo: who's holding my fav room. or large room for small group
// todo: link to rating page
// todo: (in the future) donation
// todo: add pause feature (manual or with setting, automatically pause when on battery/battery is low)
// todo: handle close and reopen browser
// todo: remove a meeting from the queue from popup list
// todo: consider retiring super old tasks
// todo: send crash log to google analytics for debugging
// todo: room booking notification "confirm" button doesn't work on windows
// todo: don't look for a room if there's already one that fulfills the filter - stop overbooking (be careful about rooms that are registered but rejected)
// todo: the ability to remove a meeting from the control panel (settings)

// ==================== Task Queue Management ======================
// todo: (maybe) persist toBeFulfilled
onMessage((msg, sender, sendResponse) => {
  if (msg.type === ROOM_TO_BE_FULFILLED) {
    const eventId = msg.data.eventId;
    const eventName = msg.data.eventName;
    if (!eventId) {
      // if this happens there's a bug
      throw new Error(`received empty event id. event name: ${eventName}`);
    }

    enqueue(eventTask(eventId, eventName));
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

// ==================== heartbeat ======================
function heartbeat() {
  console.log('heartbeat check. still alive...');

  if (Date.now() - lastActiveTs > FIVE_MIN_MS) {
    console.log('worker idle for more than 5 min, resurrecting...');

    enqueue(currentTask);
    taskVersion++;

    console.log(`current work: ${JSON.stringify(toBeFulfilled)}; task version: ${taskVersion}`);
    nextTask();
  }
}

// fire a heartbeat check every minute
setInterval(heartbeat, ONE_MIN_MS);


// ==================== state machine ======================

function nextTask() {
  console.log(`set last active timestamp to ${lastActiveTs.toString()}`);
  lastActiveTs = Date.now();

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
  const eventId = currentTask.data.eventId;
  const urlToLoad = `${EDIT_PAGE_URL_PREFIX}/${eventId}`;

  preparePostLoad(urlToLoad);
  console.log(`load new url ${urlToLoad}`);
  chrome.tabs.update(workerTabId, {
    url: urlToLoad,
    active: false,
    pinned: true
  });
}

function preparePostLoad(urlToLoad) {
  function pageLoadListener(tabId, changeInfo, tab) {
    const isWorker = tabId === workerTabId;
    const isTargetUrl = tab.url === urlToLoad;
    const isLoaded = changeInfo.status === "complete";

    if (isWorker && isTargetUrl && isLoaded) {
      console.log(`${urlToLoad} loaded.`);
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
    options: {
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
      console.log(`room selected for ${JSON.stringify(currentTask)}`);

      // todo: event name is cut off
      chrome.notifications.create(`${CONFIRM_ROOM_BOOKING_PREFIX}${eventId}`, {
        iconUrl: "icon.png",
        type: 'basic',
        title: `We found a room for ${eventName}!`,
        message: '[!!IMPORTANT!!] Click "more" => "confirm"',
        buttons: [{title: 'confirm'}],
        requireInteraction: true
      }, notificationId => {
        // withdraw notification if the user doesn't take an action in 30 sec, otherwise the room hold will become stale
        setTimeout(() => chrome.notifications.clear(notificationId), 3 * TEN_SEC_MS);
      });

      chrome.runtime.onMessage.removeListener(roomSelectionListener);
      save();
    }

    if (msg.type === NO_NEED_TO_BOOK && msg.data.eventId === eventId) {
      console.log(`no need to book for ${JSON.stringify(currentTask)}`);
      chrome.runtime.onMessage.removeListener(roomSelectionListener);
      nextTask();
    }

    if (msg.type === NO_ROOM_FOUND && msg.data.eventId === eventId) {
      // enqueue the event to be searched later
      console.log(`no room found for ${JSON.stringify(currentTask)}`);

      enqueue(currentTask);
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

      chrome.runtime.onMessage.removeListener(editSavedListener);
      nextTask();
    }

    if (msg.type === SAVE_EDIT_FAILURE && msg.data.eventId === eventId) {
      console.log(`failed to save room for ${JSON.stringify(currentTask)}`);

      enqueue(currentTask);
      chrome.runtime.onMessage.removeListener(editSavedListener);
      nextTask();
    }
  }

  onMessage(editSavedListener, ONE_HOUR_MS);
}

// ==================== helpers ======================

function enqueue(task) {
  if (!task) {
    console.log('nothing to enqueue, move on...');
    return;
  }

  if (task.type !== EVENT) {
    console.log(`only need enqueue event tasks. ignoring ${JSON.stringify(task)}`);
    return;
  }

  if (isEventInQueue(task)) {
    return console.log(`${JSON.stringify(task)} is already in the queue`);
  }

  // add some buffer so that we don't retry immediately
  console.log(`enqueuing ${JSON.stringify(task)}...`);
  toBeFulfilled.push(...getNapFillers(5), task);
}

function dequeue() {
  const task = toBeFulfilled.shift();
  console.log(`dequeuing ${JSON.stringify(task)}...`);

  return task;
}

function eventTask(eventId, eventName) {
  return {
    type: EVENT,
    data: {
      eventId: eventId,
      eventName: eventName
    }
  };
}

function napTask() {
  return {type: NAP}
}

function estimateTimeToCompletion() {
  const avgEventTaskTime = 1/10;  // one tenth of a minute (aka 10 tasks per minute)
  let timeToCompletion = 0;

  toBeFulfilled.forEach(task => timeToCompletion += task.type === NAP ? 1 : avgEventTaskTime);
  return Math.round(timeToCompletion);
}

function isEventInQueue(eventTask) {
  return toBeFulfilled.filter(task => {
    if (task.type !== EVENT) {
      return false;
    }

    return task.data.eventId === eventTask.data.eventId;
  }).length > 0;
}

function getAllEventTasks() {
  return toBeFulfilled.filter(task => task.type !== NAP);
}

function getNapFillers(napMinutes) {
  console.log(`trying to add a ${napMinutes} minutes nap to the task queue...`);

  const timeToCompletion = estimateTimeToCompletion();
  if (timeToCompletion >= napMinutes) {
    console.log(`just kidding. it will already take ${timeToCompletion} minutes to complete the current tasks. no need to nap more`);
    return [];
  }

  napMinutes = napMinutes - timeToCompletion;
  console.log(`given the current tasks will take ${timeToCompletion} minutes complete, adding ${napMinutes} minutes nap to the task queue...`);
  return Array(napMinutes).fill(napTask());
}
