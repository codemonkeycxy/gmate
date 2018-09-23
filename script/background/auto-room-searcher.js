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

  console.log(`removing worker ${workerTabId}...`);
  chrome.tabs.remove(workerTabId, () => {
    console.log(`worker ${workerTabId} removed`);
    workerTabId = null;
  });
}

// todo: add start and stop control on settings
// todo: don't book for meetings in the past
// todo: add a room booking case: "i need a room" for other people's meetings
// todo: try out google calendar api
// https://developers.google.com/calendar/quickstart/js#step_1_turn_on_the
// https://stackoverflow.com/questions/49427531/chrome-extension-integrating-with-google-calendar-api
// todo: (maybe) treat user triggered worker tab refresh as a resurrection signal
// todo: (maybe) auto room booking should ignore rejected rooms (think if this is Uber specific)
// todo: persist frontend thread crash log
// todo: add daily quota and anti-greedy mechanism
// todo: persist toBeFulfilled
// todo: estimate time to complete and add at least a 5min buffer for requeued items
// todo: estimate time to complete and add at and add at least 1 hour buffer after each fulfillment
// todo: add google analytics on queue size and other user behaviors
// todo: convert regex to more user-friendly settings (use google sheet condition as a reference), with !important
// todo: allow per "i need a room" regex setting
// todo: show a to-be-fulfilled list
// todo: notify on each new "i need a room"
// todo: (maybe) register "i need a room" not just when creating new meetings but also when editing existing meetings
// todo: ask users for room name examples and find commonality among them
// todo: "i need a room" should turn green after clicking
// todo: add verify booking step
// todo: who's holding my fav room. or large room for small group
// todo: link to rating page
// todo: (in the future) donation
// todo: add pause feature (manual or with setting, automatically pause when on battery/battery is low)
// todo: handle close and reopen browser

// ==================== Task Queue Management ======================
// todo: (maybe) persist toBeFulfilled
onMessage((msg, sender, sendResponse) => {
  if (msg.type === ROOM_TO_BE_FULFILLED) {
    const eventId = msg.data.eventId;
    if (!eventId) {
      // if this happens there's a bug
      throw new Error(`received empty event id. event name: ${msg.data.eventName}`);
    }

    // todo: add link to setting to show toBeFulfilled list
    // todo: include meeting name for better clarity
    notify('You are all set!', 'we will work hard to book a room for you in the background');
    if (!toBeFulfilled.includes(eventId)) {
      toBeFulfilled.push(...getNapFillers(5), eventId);
    }

    if (!workerTabId) {
      startWorker();
    }
  }

  if (msg.type === ROOM_TO_BE_FULFILLED_FAILURE) {
    // todo: differentiate error UI from regular notification
    const eventName = msg.data.eventName;
    const eventIds = msg.data.eventIds;

    console.log(
      `Expecting to register 1 event to the queue but found - event name: ${eventName} event ids: ${JSON.stringify(eventIds)}`
    );
    notify(
      'Oops. We encountered a problem',
      'we were not able to uniquely identify the meeting you just created. Please open it up and click "I need a room" again'
    );
  }
});

// ==================== heartbeat ======================

let lastActiveTs = Date.now();

function heartbeat() {
  console.log('heartbeat check. still alive...');
  if (Date.now() - lastActiveTs > FIVE_MIN_MS) {
    console.log('worker idle for more than 5 min, resurrecting...');
    nextTask();
  }
}

// fire a heartbeat check every minute
setInterval(heartbeat, ONE_MIN_MS);


// ==================== state machine ======================

// todo: add guards against race condition between heartbeat and nap
// todo: consider retiring super old tasks
function nextTask() {
  console.log(`set last active timestamp to ${lastActiveTs.toString()}`);
  lastActiveTs = Date.now();

  if (!workerTabId) {
    return console.log('worker not available. processing paused');
  }

  if (toBeFulfilled.length === 0) {
    return console.log('no task to fulfill. waiting for new tasks to come in');
  }

  const nextAction = toBeFulfilled.shift();
  if (nextAction === NAP) {
    console.log('nap for one min');
    return setTimeout(nextTask, ONE_MIN_MS);
  }

  // throw in a random delay to avoid getting throttled by Google
  const randDelay = getRandomInt(TEN_SEC_MS);
  console.log(`next task will start in ${Math.round(randDelay / 1000)} sec...`);
  setTimeout(() => {
    console.log('load next event');
    loadEventPage(nextAction);
  }, randDelay);
}

function loadEventPage(eventId) {
  const urlToLoad = `${EDIT_PAGE_URL_PREFIX}/${eventId}`;

  preparePostLoad(eventId, urlToLoad);
  console.log(`load new url ${urlToLoad}`);
  chrome.tabs.update(workerTabId, {
    url: urlToLoad,
    active: false,
    pinned: true
  });
}

function preparePostLoad(eventId, urlToLoad) {
  function pageLoadListener(tabId, changeInfo, tab) {
    const isWorker = tabId === workerTabId;
    const isTargetUrl = tab.url === urlToLoad;
    const isLoaded = changeInfo.status === "complete";

    if (isWorker && isTargetUrl && isLoaded) {
      console.log(`${urlToLoad} loaded.`);
      chrome.tabs.onUpdated.removeListener(pageLoadListener);
      triggerRoomBooking(eventId);
    }
  }

  chrome.tabs.onUpdated.addListener(pageLoadListener);
}

function triggerRoomBooking(eventId) {
  preparePostTrigger(eventId);
  console.log('trigger room booking');
  emit(workerTabId, {
    type: AUTO_ROOM_BOOKING,
    options: {
      forceBook: true
    }
  });
}

function preparePostTrigger(eventId) {
  function roomSelectionListener(msg, sender, sendResponse) {
    if (msg.type === ROOM_SELECTED && msg.data.eventId === eventId) {
      console.log(`room selected for ${eventId}`);
      chrome.runtime.onMessage.removeListener(roomSelectionListener);
      save(eventId);
    }

    if (msg.type === NO_NEED_TO_BOOK && msg.data.eventId === eventId) {
      console.log(`no need to book for ${eventId}`);
      chrome.runtime.onMessage.removeListener(roomSelectionListener);
      nextTask();
    }

    if (msg.type === NO_ROOM_FOUND && msg.data.eventId === eventId) {
      // requeue the event to be searched later
      console.log(`no room found for ${eventId}. requeuing`);

      if (!toBeFulfilled.includes(eventId)) {
        // add some buffer so that we don't retry immediately
        toBeFulfilled.push(...getNapFillers(5), eventId);
      }

      chrome.runtime.onMessage.removeListener(roomSelectionListener);
      nextTask();
    }
  }

  chrome.runtime.onMessage.addListener(roomSelectionListener);
}

function save(eventId) {
  preparePostSave(eventId);
  // todo: send extra data such as tab id + event id
  // todo: do the same for all existing actions
  console.log(`trigger save for ${eventId}`);
  emit(workerTabId, {type: SAVE_EDIT});
}

function preparePostSave(eventId) {
  function editSavedListener(msg, sender, sendResponse) {
    if (msg.type === EDIT_SAVED && msg.data.eventId === eventId) {
      // todo: (maybe) make message a clickable link
      console.log(`room saved for ${msg.data.eventName}`);
      notify('We found a room for you!', msg.data.eventName || eventId);

      chrome.runtime.onMessage.removeListener(editSavedListener);
      nextTask();
    }
  }

  onMessage(editSavedListener);
}

// ==================== helpers ======================

function estimateTimeToCompletion() {
  const avgEventTaskTime = 1/10;  // one tenth of a minute (aka 10 tasks per minute)
  let timeToCompletion = 0;

  toBeFulfilled.forEach(task => timeToCompletion += task === NAP ? 1 : avgEventTaskTime);
  return Math.round(timeToCompletion);
}

function getNapFillers(napMinutes) {
  console.log(`trying to add a ${napMinutes} minutes nap to the task queue...`);

  const timeToCompletion = estimateTimeToCompletion();
  if (timeToCompletion >= napMinutes) {
    console.log(`just kidding. it will already take ${timeToCompletion} minutes to complete the current tasks. no need to nap more`);
    return [];
  }

  napMinutes = napMinutes - timeToCompletion;
  console.log(`given the current tasks will ${timeToCompletion} minutes complete, adding ${napMinutes} minutes nap to the task queue...`);
  return Array(napMinutes).fill(NAP);
}