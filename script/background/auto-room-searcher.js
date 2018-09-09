// todo: search for already pinned tab, search for existing worker
chrome.tabs.create({
  url: CALENDAR_PAGE_URL_PREFIX,
  active: false,
  pinned: true
}, tab => workerTabId = tab.id);

/* ===================== Auto Room Searching Logic ====================== */
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === ROOM_SELECTED) {
    // todo: filter by event id
    searchRooms();
  }
});

function searchRooms() {
  if (toBeFulfilled.length === 0) {
    // if there's no backlog, check again in 5 min
    return setTimeout(searchRooms, 5 * 60 * 1000);
  }

  // todo: deal with deleted events
  // https://calendar.google.com/calendar/r?msg=The+requested+event+has+been+cancelled+and+removed+from+your+calendar.&msgtok=24f0c00ea165bd51063a9d36a2d76ee2fed84987
  // todo: deal with non-editable events
  // https://calendar.google.com/calendar/r/eventedit/Nm5uNWdzNGJkMTlrOTczcjg2dXBobDRsb3MgdWJlci5jb21fM3JycGtoZGRuazY2MTRycW5kbTVzMnFoMHNAZw
  // todo: deal with 403 error
  // https://calendar.google.com/calendar/r/eventedit/Nmw1cHA2YnAxNmhtbGl0cWx1OGthdmNjNWtfMjAxODEwMTFUMjIwMDAwWiB4aW55aUB1YmVyLmNvbQ
  // todo: think about network disruption
  // todo: resurrect dead cycles in an event based implementation
  chrome.tabs.update(workerTabId, {
    url: `${EDIT_PAGE_URL_PREFIX}/${toBeFulfilled.shift()}`,
    active: false,
    pinned: true
  });

  // todo: change to event based
  setTimeout(() => emit(workerTabId, {type: AUTO_ROOM_BOOKING}), 2000);
}

searchRooms();

// todo: add start and stop control on settings