chrome.tabs.onUpdated.addListener(
  function (tabId, changeInfo, tab) {
    if (tab.url.startsWith('https://calendar.google.com/calendar/r/eventedit') && changeInfo.status === 'complete') {
      chrome.tabs.sendMessage(tabId, {type: 'event_edit'});
    }
  }
);
