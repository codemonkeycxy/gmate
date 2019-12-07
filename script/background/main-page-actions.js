/**
 * trigger actions on main calendar page
 */
// self-invoking function to avoid name collision
(() => {
  function isMainPage(url) {
    return url.startsWith(CALENDAR_PAGE_URL_PREFIX) && !url.startsWith(EDIT_PAGE_URL_PREFIX);
  }

  onTabUpdated(async (tabId, changeInfo, tab) => {
    const leavingMainPage = changeInfo.url && !isMainPage(changeInfo.url);
    const isLoaded = changeInfo.status === "complete";

    if (isMainPage(tab.url) && !leavingMainPage && isLoaded) {
      emit(tabId, {type: ADD_GMATE_BTN_MAIN_PAGE});
    }
  });
})();