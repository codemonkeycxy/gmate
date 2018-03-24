// ref 1: https://stackoverflow.com/questions/4158847/is-there-a-way-to-simulate-key-presses-or-a-click-with-javascript
// ref 2: https://stackoverflow.com/questions/19758028/chrome-extension-get-dom-content
function allowModifyEvent() {
  var dispatchMouseEvent = function (target, var_args) {
    var e = document.createEvent("MouseEvents");
    // If you need clientX, clientY, etc., you can call
    // initMouseEvent instead of initEvent
    e.initEvent.apply(e, Array.prototype.slice.call(arguments, 1));
    target.dispatchEvent(e);
  };

  var modifyEventCheckbox = document.querySelectorAll('[aria-label="Let guests modify the event"]')[0];
  if (modifyEventCheckbox && modifyEventCheckbox.getAttribute('aria-checked') === 'false') {
    dispatchMouseEvent(modifyEventCheckbox, 'click', true, true);
  }
}

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (msg.text === 'event_edit') {
    allowModifyEvent();
  }
});

if (document.URL.startsWith('https://calendar.google.com/calendar/r/eventedit')) {
  allowModifyEvent();
}