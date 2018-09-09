// todo: study this useful link and possibly fetch more matching rooms
// https://www.quora.com/How-can-you-restore-the-Google-Calendar-prompt-when-you-change-time-zones

let tabInAction = [];  // track tabs that are current being act upon
// todo: maybe persist this into chrome store
const toBeFulfilled = [];
let workerTabId = null;
// todo: search for already pinned tab, search for existing worker
chrome.tabs.create({
  url: CALENDAR_PAGE_URL_PREFIX,
  active: false,
  pinned: true
}, tab => workerTabId = tab.id);

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  const isEventPage = tab.url.startsWith(EDIT_PAGE_URL_PREFIX);
  const leavingEventPage = changeInfo.url && !changeInfo.url.startsWith(EDIT_PAGE_URL_PREFIX);
  const isLoaded = changeInfo.status === "complete";

  if (tabId === workerTabId) {
    // don't trigger any event for automated room searching
    return;
  }

  if (leavingEventPage) {
    // if is leaving the event page, remove the current tab from the action list
    tabInAction = tabInAction.filter(busyTabId => busyTabId !== tabId);
    return;
  }

  if (tabInAction.includes(tabId)) {
    // the current tab is already being act upon, don't double trigger
    return;
  }

  if (isEventPage && isLoaded) {
    tabInAction.push(tabId);  // register the current tab for action

    // actions that always happen
    emit(tabId, {type: REGISTER_FAVORITE_ROOMS});

    // actions controlled by feature toggles
    getFromStorage(DEFAULT_FEATURE_TOGGLES, settings => {
      Object.keys(settings).forEach(eventType => {
        if (settings[eventType]) {
          // trigger action if the feature is turned on
          emit(tabId, {type: eventType});
        }
      });
    });
  }
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  tabInAction = tabInAction.filter(busyTabId => busyTabId !== tabId);
});


/* ===================== Auto Room Searching Logic ====================== */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  const isCalendarPage = tab.url.startsWith(CALENDAR_PAGE_URL_PREFIX);
  const isEventPage = tab.url.startsWith(EDIT_PAGE_URL_PREFIX);
  const isLoaded = changeInfo.status === "complete";

  if (isCalendarPage && !isEventPage && isLoaded) {
    chrome.tabs.sendMessage(tabId, {type: GET_ALL_MEETINGS}, null, meetingIds =>
      meetingIds.forEach(id => {
        if (!toBeFulfilled.includes(id)) {
          toBeFulfilled.push(id);
        }
      })
    );
  }
});

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
