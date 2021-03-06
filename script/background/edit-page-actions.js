/**
 * trigger actions on meeting edit page
 */

let tabInAction = [];  // track tabs that are current being act upon

onTabUpdated(async (tabId, changeInfo, tab) => {
  const isEventPage = tab.url.startsWith(EDIT_PAGE_URL_PREFIX);
  const leavingEventPage = changeInfo.url && !changeInfo.url.startsWith(EDIT_PAGE_URL_PREFIX);
  const isLoaded = changeInfo.status === "complete";

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
    emit(tabId, {type: ADD_GMATE_BTN_EDIT_PAGE});

    // actions controlled by feature toggles
    const settings = await getFromSync(DEFAULT_FEATURE_TOGGLES);
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