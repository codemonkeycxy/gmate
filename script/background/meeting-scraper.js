/**
 * listen to calendar page loaded events and store meetings into a toBeFulfilled list
 */

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