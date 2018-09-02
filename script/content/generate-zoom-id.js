// self-invoking function to avoid name collision
(function generateZoomId() {
  function makeZoomMeeting() {
    if (isEdit()) {
      // the user is trying to edit an existing meeting; in this case, no zoom id should be generated
      return;
    }

    const existingZoomId = document.querySelectorAll('[data-initial-value*="https://uber.zoom.us/j/"]')[0];
    if (existingZoomId) {
      // no action if the meeting is already setup over zoom
      return;
    }

    const zoomBtn = document.getElementById('zoom_schedule_button');
    if (zoomBtn) {
      dispatchMouseEvent(zoomBtn, 'click', true, true);
    }
  }

  onMessage(function (msg, sender, sendResponse) {
    if (msg.type === GENERATE_ZOOM_ID) {
      // give page some time to load
      setTimeout(makeZoomMeeting, 1000);
    }
  });
}());
