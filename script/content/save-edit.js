// self-invoking function to avoid name collision
(() => {
  function saveEdit() {
    let saveBtn = document.querySelectorAll('[aria-label="Save"]');
    if (saveBtn.length !== 1) {
      return sendFinishMessage(UNABLE_TO_SAVE);
    }

    saveBtn = saveBtn[0];
    dispatchMouseEvent(saveBtn, "click", true, true);
    sendFinishMessage(EDIT_SAVED);
  }

  function sendFinishMessage(eventType) {
    chrome.runtime.sendMessage({
      type: eventType,
      data: {
        eventId: getEventId()
      }
    });
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === SAVE_EDIT) {
      saveEdit();
    }
  });
})();