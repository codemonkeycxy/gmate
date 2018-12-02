/**
 * trigger actions on meeting edit page
 */

let tabInAction = [];  // track tabs that are current being act upon

onTabUpdated(async (tabId, changeInfo, tab) => {
  const isEventPage = tab.url.startsWith(EDIT_PAGE_URL_PREFIX);
  const leavingEventPage = changeInfo.url && !changeInfo.url.startsWith(EDIT_PAGE_URL_PREFIX);
  const isLoaded = changeInfo.status === "complete";

  if (tabId === workerTabId) {
    // mask out the worker page to avoid accidental disruption from the user
    emit(tabId, {type: ADD_OVERLAY});
    emit(tabId, {
      type: SHOW_BANNER,
      data: {
        level: WARNING,
        message: "Warning! This page is reserved for GMate auto room searching. Please leave it running by itself and avoid interrupting it"
      }
    });
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
    emit(tabId, {type: REGISTER_MEETING_TO_BOOK});

    // actions controlled by feature toggles
    const settings = await getFromStorageAsync(DEFAULT_FEATURE_TOGGLES);
    Object.keys(settings).forEach(eventType => {
      if (settings[eventType]) {
        // trigger action if the feature is turned on
        emit(tabId, {type: eventType});
      }
    });
  }
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  tabInAction = tabInAction.filter(busyTabId => busyTabId !== tabId);
});