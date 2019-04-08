// ==================== global variable management ======================
const GLOBAL_VARIABLE_KEY = 'background-global-variables';

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
  persistLocal({[GLOBAL_VARIABLE_KEY]: snapshot});
}

async function bootstrap() {
  // todo: remove fetching from sync storage once all users have migrated over
  const syncResult = await getFromStorageSync({[GLOBAL_VARIABLE_KEY]: {}});
  const localResult = await getFromStorageLocal({[GLOBAL_VARIABLE_KEY]: {}});

  let globalVars = {};
  if (!isEmpty(syncResult[GLOBAL_VARIABLE_KEY])) {
    console.log('reading global vars from sync');
    track('reading global vars from sync');

    globalVars = syncResult[GLOBAL_VARIABLE_KEY];
    // wipe out sync storage so we can fall on reading from local next time
    await persistPairSync(GLOBAL_VARIABLE_KEY, {});
  } else {
    console.log('reading global vars from local');
    track('reading global vars from local');

    globalVars = localResult[GLOBAL_VARIABLE_KEY];
  }

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
  }, async tab => {
    workerTabId = tab.id;
    console.log(`worker ${workerTabId} initiated`);
    unsetPauseIcon();
    await nextTask();
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
    setPauseIcon();
  }

  console.log(`removing worker ${workerTabId}...`);
  chrome.tabs.remove(workerTabId, () => {
    console.log(`worker ${workerTabId} removed`);
    workerTabId = null;
  });
}

// use chrome://identity-internals/ to control api credentials
// no room searching api. similar questioned asked: https://productforums.google.com/forum/#!msg/calendar/UViDqLtV-gA/dduccKC6CgAJ
// todo: add daily quota and anti-greedy mechanism
// todo: add google analytics on queue size and other user behaviors
// todo: who's holding my fav room. or large room for small group
// todo: link to rating page
// todo: (in the future) donation
// todo: option to automatically pause when on battery/battery is low
// todo: send crash log to google analytics for debugging
// todo: room booking notification "confirm" button doesn't work on windows
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
// todo: list recently fulfilled events, maybe with their rooms
// todo: educate people about advanced features - provide a guide by the "i need a room" button
// todo: detect "too many failures"
// todo: share gmate in lifehack uchat room
// todo: randomly ask user for rating
// todo: consider auto open control panel upon installation
// todo: allow setting multiple room searching filters in one hit
// todo: tag gmate home page so that it shows up in google search first page
// todo: add support for more advanced filters such as "3+", ">5", "<15" OR more properly support number range
// todo: update github and chrome store description https:/search.google.com/search-console?resource_id=sc-domain:gmate.us
// todo: add A/B testing framework
// todo: add beta testing token
// todo: prevent too many pending meeting to be added. use notify to tell user
// todo: add privacy policy and terms of service to google api login
// todo: log last error to mixpanel
// https://stackoverflow.com/questions/28431505/unchecked-runtime-lasterror-when-using-chrome-api
// this means 1) try catch all executions. 2) log chrome runtime last error in all chrome related invocations
// todo: make a feature voting board
// todo: handle no auth error in case user auth gets somehow revoked. send user a notification to ask for auth. see getAuthToken function
// todo: noticed a declined room triggers "no need to book", probably due to UI loading issue. Replace it with API call
// todo: tutorial "next" to "next: title"
// todo: flag for "don't always ask for filters"
// todo: book consistent rooms for recurring meetings
// todo: maybe add "I need a room" button to the main calendar page for quicker action
// todo: automatically/ask manually to send console log crash report
// todo: enable open meeting url from room booked notification
// todo: scenario, room booked via api but network went out after that so was not able to confirm
// should still add the meeting to "room fulfilled" list since most likely the room is booked successfully
// todo: attach dollar value to meeting using avg salary
// todo: also add the "no need to book" cases to the "recently booked" section regardless
// todo: generate WOW meeting/free time ratio
// todo: button disappears after 1 refresh in the meeting edit page
// todo: make checkbox text clickable
// https://stackoverflow.com/questions/6293588/how-to-create-an-html-checkbox-with-a-clickable-label
// todo: add tricks to book consistent rooms for recurring meetings to power user guide
// 1) add your favorite room and book recurring for the next 100 wks. gmate skips already booked
// 2) add your favorite room for recurring meetings 2 wks later, and use gmate to book for the coming 2 wks
// todo: before releasing v2.2.0 test the following:
// 1) revoke auth and get auth
// 2) sync storage to local storage transition
// 3) recurring room from the past, future, with already booked, deleted, and rejected rooms

// ==================== Task Queue Management ======================
onMessageOfType(ROOM_TO_BE_FULFILLED, async (msg, sender, sendResponse) => {
  const eventId = msg.data.eventId;
  const eventName = msg.data.eventName;
  const eventFilters = msg.data.eventFilters;

  if (!eventId) {
    // if this happens there's a bug
    throw gmateError('empty event id', {eventName});
  }

  // enqueue the event at hand first even if we need to enqueue other recurring meetings later
  // this way the UI is not blocked by the async bookRecurring logic
  enqueue(eventTask(eventId, eventName, eventFilters));
  track(ROOM_TO_BE_FULFILLED);
  if (!workerTabId) {
    startWorker();
  }

  // NOTE: leave the async logic towards the end in order not to block the UI
  if (msg.data.bookRecurring) {
    // the event might have just been created, wait until it can be fetched from the API before continuing
    // tryUntilPass could fail but is very unlikely. since tryUntilPass has error logging so continue here optimistically
    await tryUntilPass(async () => await CalendarAPI.getEventB64(eventId), {sleepMs: TEN_SEC_MS, countdown: 30});

    const recurringIds = await CalendarAPI.eventIdToRecurringIdsB64(eventId, msg.data.recurForWks);
    enqueueMany(recurringIds.map(idToBook => eventTask(idToBook, eventName, eventFilters)));
    track(RECURRING_ROOM_TO_BE_FULFILLED);
  }
});

onMessageOfType(ROOM_TO_BE_FULFILLED_FAILURE, (msg, sender, sendResponse) => {
  const eventName = msg.data.eventName;
  const eventIds = msg.data.eventIds;

  console.log(
    `Expecting to register 1 event to the queue but found - event name: ${
      eventName
      } event ids: ${JSON.stringify(eventIds)}`
  );
  notify(
    'Oops. We encountered a problem',
    `Please open the meeting up and click "${SEARCH_ROOM_BTN_MSG}" again`
  );
});

onMessageOfType(GET_QUEUE, (msg, sender, sendResponse) => {
  sendResponse({
    type: GET_QUEUE,
    data: {
      eventTasks: getAllEventTasks(),
      workerTabId: workerTabId
    }
  });
});

onMessageOfType(REMOVE_TASK, (msg, sender, sendResponse) => {
  removeTask(msg.data.taskId);
  sendResponse({
    type: REMOVE_TASK,
    data: {
      eventTasks: getAllEventTasks(),
      workerTabId: workerTabId
    }
  });
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
      return await nextTask();
    }
  }

  if (Date.now() - lastActiveTs > FIVE_MIN_MS) {
    console.log('worker idle for more than 5 min, resurrecting...');

    enqueue(currentTask);
    await nextTask();
  }
}

// fire a heartbeat check every minute
setInterval(heartbeat, ONE_MIN_MS);


// ==================== state machine ======================

async function nextTask() {
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

  const isPastMeeting = await CalendarAPI.isPastMeetingB64(currentTask.data.eventId);
  if (isPastMeeting) {
    console.log(`no need to book room for a past meeting: ${JSON.stringify(currentTask)}`);
    return await nextTask();
  }

  // throw in a random delay to avoid getting throttled by Google
  const randDelay = getRandomInt(TEN_SEC_MS);
  console.log(`next task will start in ${Math.round(randDelay / 1000)} sec...`);
  setTimeout(() => {
    console.log('load next event');
    loadEventPage();
  }, randDelay);
}

async function wakeUp(taskVersionBeforeNap) {
  if (taskVersionBeforeNap !== taskVersion) {
    console.log(`the world has moved on when I was sleeping... my task version: ${taskVersionBeforeNap}, current task version: ${taskVersion}`);
  } else {
    await nextTask();
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
  async function pageLoadListener(tabId, changeInfo, tab) {
    const isWorker = tabId === workerTabId;
    const isTargetUrl = tab.url === urlToLoad;
    const isLoaded = changeInfo.status === "complete";

    if (isWorker && isTargetUrl && isLoaded) {
      console.log(`${urlToLoad} loaded.`);
      // remove listener after handling the expected event to avoid double trigger
      chrome.tabs.onUpdated.removeListener(pageLoadListener);
      await triggerRoomBooking();
    }
  }

  onTabUpdated(pageLoadListener, ONE_HOUR_MS);
}

async function triggerRoomBooking() {
  preparePostTrigger();
  console.log('trigger room booking');
  emit(workerTabId, {
    type: AUTO_ROOM_BOOKING,
    data: {
      eventFilters: currentTask.data.eventFilters,
      forceBookOnEdit: true,
      suppressChanges: true
    }
  });
}

function preparePostTrigger() {
  async function roomSelectionListener(msg, sender, sendResponse) {
    if (!currentTask || currentTask.type !== EVENT) {
      return;
    }

    const eventId = currentTask.data.eventId;
    const eventName = currentTask.data.eventName;

    if (msg.type === ROOM_SELECTED && msg.data.eventId === eventId) {
      console.log(`room ${msg.data.roomName} selected for ${JSON.stringify(currentTask)}`);
      // remove listener after handling the expected event to avoid double trigger
      chrome.runtime.onMessage.removeListener(roomSelectionListener);

      await bookRoom(eventId, eventName, msg.data.roomEmail);
    }

    if (msg.type === NO_NEED_TO_BOOK && msg.data.eventId === eventId) {
      console.log(`no need to book for ${JSON.stringify(currentTask)}`);
      notify('Great News!', `"${eventName}" already has a room that meets your criteria!`);
      // remove listener after handling the expected event to avoid double trigger
      chrome.runtime.onMessage.removeListener(roomSelectionListener);
      await nextTask();
    }

    if (msg.type === NO_ROOM_FOUND && msg.data.eventId === eventId) {
      // enqueue the event to be searched later
      console.log(`no room found for ${JSON.stringify(currentTask)}`);

      enqueue(currentTask);
      // remove listener after handling the expected event to avoid double trigger
      chrome.runtime.onMessage.removeListener(roomSelectionListener);
      await nextTask();
    }
  }

  onMessage(roomSelectionListener, ONE_HOUR_MS);
}

async function bookRoom(eventId, eventName, roomEmail) {
  await CalendarAPI.addRoomB64(eventId, roomEmail);
  console.log('waiting for the newly added room to confirm...');

  const success = await tryUntilPass(
    async () => await CalendarAPI.isRoomConfirmedB64(eventId, roomEmail),
    { // wait up to 5 min
      sleepMs: TEN_SEC_MS,
      countdown: 30,
      suppressError: true
    }
  );

  if (success) {
    notify('Great News!', `Room found for "${eventName}"!`);
    await onRoomSavedSuccess();
  } else {
    return await onRoomSavedFailure();
  }
}

async function onRoomSavedSuccess() {
  console.log(`room saved for ${JSON.stringify(currentTask)}`);
  track('room-saved');
  await nextTask();
}

async function onRoomSavedFailure() {
  console.log(`failed to save room for ${JSON.stringify(currentTask)}`);
  // room save failures are not expected in the book-via-api approach. log to confirm
  track('room-save-failure');
  enqueue(currentTask);
  // remove listener after handling the expected event to avoid double trigger
  await nextTask();
}

// ==================== helpers ======================

function _enqueue(task) {
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
}

function enqueue(task) {
  _enqueue(task);
  saveGlobalVariables();
}

function enqueueMany(tasks) {
  tasks.forEach(task => _enqueue(task));
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

  if (getAllEventTasks().length === 0) {
    unsetPauseIcon();
  }

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
