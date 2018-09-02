chrome.tabs.onUpdated.addListener(
  function (tabId, changeInfo, tab) {
    if (tab.url.startsWith('https://calendar.google.com/calendar/r/eventedit') && changeInfo.status === 'complete') {
      // actions that always happen
      emit(tabId, {type: REGISTER_FAVORITE_ROOMS});

      // actions controlled by feature toggles
      getFromStorage(DEFAULT_FEATURE_TOGGLES, function (settings) {
        Object.keys(settings).forEach(function (eventType) {
          if (settings[eventType]) {
            emit(tabId, {type: eventType});
          }
        });
      });
    }
  }
);
