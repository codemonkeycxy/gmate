// self-invoking function to avoid name collision
(function generateZoomId() {
  function makeZoomMeeting() {
    chrome.storage.sync.get(DEFAULT_FEATURE_TOGGLES, function (settings) {
      if (settings[GENERATE_ZOOM_ID]) {
        triggerAction();
      }
    });
  }

  function triggerAction() {
    if (isEdit()) {
      // the user is trying to edit an existing meeting; in this case, no zoom id should be generated
      return;
    }

    var existingZoomId = document.querySelectorAll('[data-initial-value*="https://uber.zoom.us/j/"]')[0];
    if (existingZoomId) {
      // no action if the meeting is already setup over zoom
      return;
    }

    var zoomBtn = document.getElementById('zoom_schedule_button');
    if (zoomBtn) {
      dispatchMouseEvent(zoomBtn, 'click', true, true);
    }
  }

  chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (msg.type === 'event_edit') {
      // give page some time to load
      setTimeout(makeZoomMeeting, 1000);
    }
  });
}());
