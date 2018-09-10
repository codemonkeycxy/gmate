// self-invoking function to avoid name collision
(() => {
  function saveEdit() {
    let saveBtn = document.querySelectorAll('[aria-label="Save"]');
    if (saveBtn.length !== 1) {
      return sendFinishMessage(UNABLE_TO_SAVE);
    }

    saveBtn = saveBtn[0];
    dispatchMouseEvent(saveBtn, "click", true, true);
    setTimeout(confirmSaving, 1000);  // give some time for the confirmation screen to load
  }

  function confirmSaving() {
    // todo: set update message to advertise for gmate. don't forget to click "send" instead
    const okBtn = getElementByText('div', "OK");
    const dontSendBtn = getElementByText('div', "Don't send");
    if (okBtn) {
      dispatchMouseEvent(okBtn, "click", true, true);
      return setTimeout(confirmSaving, 1000);
    }

    if (dontSendBtn) {
      dispatchMouseEvent(dontSendBtn, "click", true, true);
      return confirmSaving();
    }

    sendFinishMessage(EDIT_SAVED);
  }

  function sendFinishMessage(eventType) {
    chrome.runtime.sendMessage({
      type: eventType,
      data: {
        eventId: getEventId(),
        eventName: getEventName()
      }
    });
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === SAVE_EDIT) {
      saveEdit();
    }
  });
})();