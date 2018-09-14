// todo: search for already pinned tab, search for existing worker
chrome.tabs.create({
  url: CALENDAR_PAGE_URL_PREFIX,
  active: false,
  pinned: true
}, tab => workerTabId = tab.id);

// todo: add start and stop control on settings
// todo: deal with deleted events
// https://calendar.google.com/calendar/r?msg=The+requested+event+has+been+cancelled+and+removed+from+your+calendar.&msgtok=24f0c00ea165bd51063a9d36a2d76ee2fed84987
// todo: deal with non-editable events
// https://calendar.google.com/calendar/r/eventedit/Nm5uNWdzNGJkMTlrOTczcjg2dXBobDRsb3MgdWJlci5jb21fM3JycGtoZGRuazY2MTRycW5kbTVzMnFoMHNAZw
// todo: deal with 403 error
// https://calendar.google.com/calendar/r/eventedit/Nmw1cHA2YnAxNmhtbGl0cWx1OGthdmNjNWtfMjAxODEwMTFUMjIwMDAwWiB4aW55aUB1YmVyLmNvbQ
// todo: think about network disruption
// todo: resurrect dead cycles in an event based implementation
// todo: don't book for meetings in the past
// todo: add a room booking case: "i need a room" for other people's meetings
// todo: try out google calendar api
// https://developers.google.com/calendar/quickstart/js#step_1_turn_on_the
// https://stackoverflow.com/questions/49427531/chrome-extension-integrating-with-google-calendar-api
// todo: (maybe) treat user triggered worker tab refresh as a resurrection signal
// todo: (maybe) auto room booking should ignore rejected rooms (think if this is Uber specific)
// todo: make sure get_all_meetings is triggered after a new event is created
// todo: persist frontend thread crash log

let lastActiveTs = Date.now();

function heartbeat() {
  console.log('heartbeat check. still alive...');
  if (Date.now() - lastActiveTs > FIVE_MIN_MS) {
    console.log('worker idle for more than 5 min, resurrecting...');
    nextItem();
  }
}

// fire a heartbeat check every minute
setInterval(heartbeat, ONE_MIN_MS);

function nextItem() {
  setTimeout(() => {
    console.log(`set last active timestamp to ${lastActiveTs.toString()}`);
    lastActiveTs = Date.now();

    if (toBeFulfilled.length === 0) {
      return console.log('no event to fulfill');
    }

    console.log('load next event');
    loadEventPage(toBeFulfilled.shift());
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
      // todo: this will make toBeFulfilled loop endlessly until a room is booked
      // todo: don't requeue if the event is already in
      console.log(`no room found for ${eventId}. requeuing`);
      toBeFulfilled.push(eventId);
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
      // todo: throttle notifications by aggregating nearby messages
      console.log(`room saved for ${msg.data.eventName}`);
      notify('We found a room for you!', msg.data.eventName || eventId);
      chrome.runtime.onMessage.removeListener(editSavedListener);
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

tryUntilPass(() => toBeFulfilled.length > 0, nextItem, 1000, 20);
