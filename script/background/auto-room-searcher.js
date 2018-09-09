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

function hibernate() {
  return setTimeout(nextItem, 5 * 60 * 1000);
}

function nextItem() {
  if (toBeFulfilled.length === 0) {
    hibernate();
  } else {
    loadEvent(toBeFulfilled.shift());
  }
}

function loadEvent(eventId) {
  const urlToLoad = `${EDIT_PAGE_URL_PREFIX}/${eventId}`;

  function pageLoadListener(tabId, changeInfo, tab) {
    const isWorker = tabId === workerTabId;
    const isTargetUrl = tab.url === urlToLoad;
    const isLoaded = changeInfo.status === "complete";

    if (isWorker && isTargetUrl && isLoaded) {
      emit(workerTabId, {type: AUTO_ROOM_BOOKING});
      chrome.tabs.onUpdated.removeListener(pageLoadListener);
    }
  }
  chrome.tabs.onUpdated.addListener(pageLoadListener);

  chrome.tabs.update(workerTabId, {
    url: urlToLoad,
    active: false,
    pinned: true
  });
}

onMessage((msg, sender, sendResponse) => {
  if (msg.type === ROOM_SELECTED) {
    // todo: filter by event id
    nextItem();
  }
});

nextItem();