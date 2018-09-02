chrome.tabs.onUpdated.addListener(
  function (tabId, changeInfo, tab) {
    if (tab.url.startsWith('https://calendar.google.com/calendar/r/eventedit') && changeInfo.status === 'complete') {
      Object.keys(DEFAULT_FEATURE_TOGGLES).forEach(function (eventType) {
        chrome.tabs.sendMessage(tabId, {type: eventType});
      });
    }
  }
);
