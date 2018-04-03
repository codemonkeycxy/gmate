// ref 1: https://stackoverflow.com/questions/4158847/is-there-a-way-to-simulate-key-presses-or-a-click-with-javascript
// ref 2: https://stackoverflow.com/questions/19758028/chrome-extension-get-dom-content

// self-invoking function to avoid name collision
(function allowGuestModifyEvent() {
  function allowModifyEvent() {
    chrome.storage.sync.get(['allow-guest-modify-event'], function (settings) {
      if (settings['allow-guest-modify-event']) {
        triggerAction();
      }
    });
  }

  function triggerAction() {
    var modifyEventCheckbox = document.querySelectorAll('[aria-label="Let guests modify the event"]')[0];
    if (modifyEventCheckbox && modifyEventCheckbox.getAttribute('aria-checked') === 'false') {
      dispatchMouseEvent(modifyEventCheckbox, 'click', true, true);
    }
  }

  chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (msg.text === 'event_edit') {
      // give page some time to load
      setTimeout(allowModifyEvent, 500);
    }
  });

  if (document.URL.startsWith('https://calendar.google.com/calendar/r/eventedit')) {
    setTimeout(allowModifyEvent, 500);
  }
}());
