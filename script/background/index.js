chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  const isEventPage = tab.url.startsWith(
    "https://calendar.google.com/calendar/r/eventedit"
  );
  const isLoaded = changeInfo.status === "complete";

  if (isEventPage && isLoaded) {
    // actions that always happen
    emit(tabId, { type: REGISTER_FAVORITE_ROOMS });

    // actions controlled by feature toggles
    getFromStorage(DEFAULT_FEATURE_TOGGLES, settings => {
      Object.keys(settings).forEach(eventType => {
        if (settings[eventType]) {
          // trigger action if the feature is turned on
          emit(tabId, { type: eventType });
        }
      });
    });
  }
});
