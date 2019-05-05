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
  }, tab => {
    workerTabId = tab.id;
    console.log(`worker ${workerTabId} initiated`);
    unsetPauseIcon();
    nextTaskFireAndForget();
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
// todo: study this useful link and possibly fetch more matching rooms
// https://www.quora.com/How-can-you-restore-the-Google-Calendar-prompt-when-you-change-time-zones
// todo: use free/busy api to look for suitable rooms
// https://developers.google.com/calendar/v3/reference/freebusy/query?apix_params=%7B%22resource%22%3A%7B%22items%22%3A%5B%7B%22id%22%3A%22uber.com_53454131313931326e6441766531327468576f6f646c616e645061726b313256432d3536393539%40resource.calendar.google.com%22%7D%2C%7B%22id%22%3A%22uber.com_53656131393131326e64417665313274684175746f6d6174696f6e5465616d2d373737383632%40resource.calendar.google.com%22%7D%5D%2C%22timeMin%22%3A%222019-04-03T10%3A00%3A00Z%22%2C%22timeMax%22%3A%222019-05-03T10%3A00%3A00Z%22%7D%7D
// todo: test
// 1) is cancelled
// 2) is past
// 3) already booked
// 4) by the time of notification, the room is already confirmed

// ==================== Task Queue Management ======================
onMessageOfType(ROOM_TO_BE_FULFILLED, async (msg, sender, sendResponse) => {
  const eventId = msg.data.eventId;
  const eventName = msg.data.eventName;
  const eventFilters = msg.data.eventFilters;

  if (!eventId) {
    // if this happens there's a bug
    throw GMateError('empty event id', {eventName});
  }

  // enqueue the event at hand first even if we need to enqueue other recurring meetings later
  // this way the UI is not blocked by the async bookRecurring logic
  enqueue(EventTask(eventId, eventName, eventFilters));
  track(ROOM_TO_BE_FULFILLED);
  if (!workerTabId) {
    startWorker();
  }

  // NOTE: leave the async logic towards the end in order not to block the UI
  if (msg.data.bookRecurring) {
    // the event might have just been created, wait until it can be fetched from the API before continuing
    const success = await tryUntilPass(
      async () => await CalendarAPI.getEventB64(eventId),
      {sleepMs: 1000, countdown: 15, suppressError: true}  // wait up to 15 sec
    );
    if (!success) {
      return notify('Oops. We encountered a problem', 'Unable to enqueue recurring meetings. Please try again');
    }

    const recurringIds = await CalendarAPI.eventIdToRecurringIdsB64(eventId);
    enqueueMany(recurringIds.map(idToBook => EventTask(idToBook, eventName, eventFilters)));
    track(RECURRING_ROOM_TO_BE_FULFILLED);

    if (recurringIds.length < 2) {
      notify('Warning!', `Only found ${recurringIds.length} recurring meeting. Are you sure?`);
    } else {
      notify('Success!', `Added ${recurringIds.length} meetings to the room searching queue`);
    }
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
function heartbeat() {
  console.log('heartbeat check. still alive...');
  saveGlobalVariables();

  if (Date.now() - lastActiveTs > FIVE_MIN_MS) {
    console.log('worker idle for more than 5 min, resurrecting...');

    enqueue(currentTask);
    nextTaskFireAndForget();
  }
}

// fire a heartbeat check every minute
setInterval(heartbeat, ONE_MIN_MS);


// ==================== state machine ======================

/* don't wait for next task to return otherwise you could be blocked forever */
function nextTaskFireAndForget() {
  return nextTask();
}

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
  if (nextAction.type === TASK_TYPE.NAP) {
    console.log('nap for one min');
    return setTimeout(wakeUp, ONE_MIN_MS, taskVersion);
  }

  // throw in a random delay to avoid getting throttled by Google
  const randDelayMs = getRandomInt(TEN_SEC_MS);
  console.log(`next task will start in ${Math.round(randDelayMs / 1000)} sec...`);
  await sleep(randDelayMs);

  const event = await CalendarAPI.getEventB64(currentTask.data.eventId);
  if (!event) {
    GMateError("current task event not found", currentTask);
    return nextTaskFireAndForget();
  }

  if (event.isCancelled()) {
    console.log(`${JSON.stringify(currentTask)} no longer exists, moving on to the next task...`);
    return nextTaskFireAndForget();
  }

  if (event.isPast()) {
    console.log(`no need to book room for a past meeting: ${JSON.stringify(currentTask)}`);
    return nextTaskFireAndForget();
  }

  loadEventPage(taskVersion);
}

function wakeUp(taskVersionBeforeNap) {
  if (isTaskFresh(taskVersionBeforeNap)) {
    nextTaskFireAndForget();
  }
}

function loadEventPage(taskVersion) {
  if (!isTaskFresh(taskVersion)) {
    return;
  }

  if (!currentTask || currentTask.type !== TASK_TYPE.EVENT) {
    return;
  }

  const eventId = currentTask.data.eventId;
  const urlToLoad = `${EDIT_PAGE_URL_PREFIX}/${eventId}`;

  preparePostLoad(urlToLoad, taskVersion);
  console.log(`load new url ${urlToLoad}`);
  loadUrlOnWorker(urlToLoad);
}

function preparePostLoad(urlToLoad, taskVersion) {
  function pageLoadListener(tabId, changeInfo, tab) {
    if (!isTaskFresh(taskVersion)) {
      return;
    }

    const isWorker = tabId === workerTabId;
    const isTargetUrl = tab.url === urlToLoad;
    const isLoaded = changeInfo.status === "complete";

    if (isWorker && isTargetUrl && isLoaded) {
      console.log(`${urlToLoad} loaded.`);
      // remove listener after handling the expected event to avoid double trigger
      chrome.tabs.onUpdated.removeListener(pageLoadListener);
      triggerRoomBooking(taskVersion);
    }
  }

  onTabUpdated(pageLoadListener, ONE_HOUR_MS);
}

function triggerRoomBooking(taskVersion) {
  preparePostTrigger(taskVersion);
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

function preparePostTrigger(taskVersion) {
  async function roomSelectionListener(msg, sender, sendResponse) {
    if (!isTaskFresh(taskVersion)) {
      return;
    }

    if (!currentTask || currentTask.type !== TASK_TYPE.EVENT) {
      return;
    }

    const eventId = currentTask.data.eventId;
    const eventName = currentTask.data.eventName;

    if (msg.type === ROOM_SELECTED && msg.data.eventId === eventId) {
      console.log(`room ${msg.data.roomName} selected for ${JSON.stringify(currentTask)}`);
      // remove listener after handling the expected event to avoid double trigger
      chrome.runtime.onMessage.removeListener(roomSelectionListener);
      await bookRoom(eventId, eventName, msg.data.roomEmail, taskVersion);
    }

    if (msg.type === NO_NEED_TO_BOOK && msg.data.eventId === eventId) {
      console.log(`no need to book for ${JSON.stringify(currentTask)}`);
      notifyThrottled('Great News!', `"${eventName}" already has a room that meets your criteria!`);
      // remove listener after handling the expected event to avoid double trigger
      chrome.runtime.onMessage.removeListener(roomSelectionListener);
      nextTaskFireAndForget();
    }

    if (msg.type === NO_ROOM_FOUND && msg.data.eventId === eventId) {
      // enqueue the event to be searched later
      console.log(`no room found for ${JSON.stringify(currentTask)}`);

      enqueue(currentTask);
      // remove listener after handling the expected event to avoid double trigger
      chrome.runtime.onMessage.removeListener(roomSelectionListener);
      nextTaskFireAndForget();
    }
  }

  onMessage(roomSelectionListener, ONE_HOUR_MS);
}

async function bookRoom(eventId, eventName, roomEmail, taskVersion) {
  if (!isTaskFresh(taskVersion)) {
    return;
  }

  await CalendarAPI.addRoomB64(eventId, roomEmail);
  console.log('waiting for the newly added room to confirm...');

  const success = await tryUntilPass(
    async () => {
      const event = await CalendarAPI.getEventB64(eventId);
      return event && event.hasRoomAccepted(roomEmail);
    },
    {sleepMs: TEN_SEC_MS, countdown: 30, suppressError: true}  // wait up to 5 min
  );

  if (success) {
    // NOTE: notifyThrottled rely on the uniqueness of the message to work properly. Think carefully before
    // increasing the message's cardinality (e.g. log room name with message)
    notifyThrottled('Great News!', `Room found for "${eventName}"!`);
    onRoomSavedSuccess(taskVersion);
  } else {
    onRoomSavedFailure(taskVersion);
  }
}

function onRoomSavedSuccess(taskVersion) {
  if (!isTaskFresh(taskVersion)) {
    return;
  }

  console.log(`room saved for ${JSON.stringify(currentTask)}`);
  track('room-saved');
  nextTaskFireAndForget();
}

function onRoomSavedFailure(taskVersion) {
  if (!isTaskFresh(taskVersion)) {
    return;
  }

  console.log(`failed to save room for ${JSON.stringify(currentTask)}`);
  // room save failures are not expected in the book-via-api approach. log to confirm
  track('room-save-failure');
  enqueue(currentTask);
  // remove listener after handling the expected event to avoid double trigger
  nextTaskFireAndForget();
}

// ==================== helpers ======================

function isTaskFresh(myTaskVersion) {
  if (myTaskVersion !== taskVersion) {
    console.log(`the world has moved on when I was sleeping... my task version: ${myTaskVersion}, current task version: ${taskVersion}`);
    return false
  } else {
    return true
  }
}

function _enqueue(task) {
  if (!task) {
    return console.log('nothing to enqueue, move on...');
  }

  if (task.type !== TASK_TYPE.EVENT) {
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

function estimateTimeToCompletion() {
  const avgEventTaskTime = 1 / 10;  // one tenth of a minute (aka 10 tasks per minute)
  let timeToCompletion = 0;

  toBeFulfilled.forEach(task => timeToCompletion += task.type === TASK_TYPE.NAP ? 1 : avgEventTaskTime);
  return Math.round(timeToCompletion);
}

function isEventInQueue(eventTask) {
  // we purposefully NOT dedup against the currentTask here
  // since we have use cases that we need to push the current task back into the queue
  return toBeFulfilled.filter(task => {
    if (task.type !== TASK_TYPE.EVENT) {
      return false;
    }

    return task.data.eventId === eventTask.data.eventId && deepEqual(task.data.eventFilters, eventTask.data.eventFilters);
  }).length > 0;
}

/**
 * return all the event tasks from the task queue. Note the return value includes the currentTask as well
 */
function getAllEventTasks() {
  const toBeFulFilledEventTasks = toBeFulfilled.filter(task => task.type === TASK_TYPE.EVENT);

  if (currentTask && currentTask.type === TASK_TYPE.EVENT) {
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
    fillers.push(NapTask());
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
