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

function startWorker() {
  if (workerTabId) {
    // don't spawn if there's already one
    return;
  }

  chrome.tabs.create({
    url: CALENDAR_PAGE_URL_PREFIX,
    active: false,
    pinned: true
  }, tab => {
    workerTabId = tab.id;
    tryUntilPass(() => toBeFulfilled.length > 0, nextItem, 1000, 20);
  });
}

function stopWorker() {
  if (!workerTabId) {
    // nothing to kill
    return;
  }

  chrome.tabs.remove(workerTabId);
  workerTabId = null;
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

let lastActiveTs = Date.now();

function heartbeat() {
  console.log('heartbeat check. still alive...');
  if (Date.now() - lastActiveTs > FIVE_MIN_MS) {
    console.log('worker idle for more than 5 min, resurrecting...');
    nextItem();
  }
}

function getNapFillers(napMinutes) {
  return Array(napMinutes).fill(NAP);
}

// fire a heartbeat check every minute
setInterval(heartbeat, ONE_MIN_MS);

function nextItem() {
  console.log(`set last active timestamp to ${lastActiveTs.toString()}`);
  lastActiveTs = Date.now();

  if (!workerTabId) {
    return console.log('worker not available');
  }

  if (toBeFulfilled.length === 0) {
    return console.log('no event to fulfill');
  }

  const nextAction = toBeFulfilled.shift();
  if (nextAction === NAP) {
    console.log('nap for one min');
    return setTimeout(nextItem, ONE_MIN_MS);
  }

  setTimeout(() => {
    console.log('load next event');
    loadEventPage(nextAction);
  }, getRandomInt(TEN_SEC_MS));  // throw in a random delay to avoid getting throttled by Google
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
  emit(workerTabId, {type: AUTO_ROOM_BOOKING});
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
      nextItem();
    }

    if (msg.type === NO_ROOM_FOUND && msg.data.eventId === eventId) {
      // requeue the event to be searched later
      console.log(`no room found for ${eventId}. requeuing`);

      if (!toBeFulfilled.includes(eventId)) {
        // add some buffer so that we don't retry immediately
        toBeFulfilled.push(...getNapFillers(5), eventId);
      }

      chrome.runtime.onMessage.removeListener(roomSelectionListener);
      nextItem();
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
      // add some buffer so we don't turn this into an arms race
      toBeFulfilled.unshift(...getNapFillers(60));

      nextItem();
    }

    if (msg.type === UNABLE_TO_SAVE && msg.data.eventId === eventId) {
      console.log(`unable to save for ${msg.data.eventName}`);
      chrome.runtime.onMessage.removeListener(editSavedListener);
      nextItem();
    }
  }

  chrome.runtime.onMessage.addListener(editSavedListener);
}
