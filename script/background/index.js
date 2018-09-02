chrome.tabs.onUpdated.addListener(
  function (tabId, changeInfo, tab) {
    var isEventPage = tab.url.startsWith('https://calendar.google.com/calendar/r/eventedit');
    var isLoaded = changeInfo.status === 'complete';

    if (isEventPage && isLoaded) {
      // actions that always happen
      emit(tabId, {type: REGISTER_FAVORITE_ROOMS});

      // actions controlled by feature toggles
      getFromStorage(DEFAULT_FEATURE_TOGGLES, function (settings) {
        Object.keys(settings).forEach(function (eventType) {
          if (settings[eventType]) {
            // trigger action if the feature is turned on
            emit(tabId, {type: eventType});
          }
        });
      });
    }
  }
);
