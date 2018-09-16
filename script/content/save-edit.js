// self-invoking function to avoid name collision
(() => {
  function saveEdit() {
    const eventId = getEventId();
    const eventName = getEventName();

    const saveBtn = getSaveButton();
    dispatchMouseEvent(saveBtn, "click", true, true);
    // give some time for the confirmation screen to load
    // there are 3 possibilities:
    // 1) no confirmation page (in case of no invitees)
    // 2) confirmation to notify invitees
    // 3) confirmation for recurring meetings + confirmation to notify invitees
    tryUntilPass(
      () => confirmSaving() && isMainCalendarPage(),
      () => sendFinishMessage(EDIT_SAVED, eventId, eventName)
    )
  }

  function confirmSaving() {
    // todo: set update message to advertise for gmate. don't forget to click "send" instead
    const okBtn = getElementByText('div', "OK");
    if (okBtn) {
      dispatchMouseEvent(okBtn, "click", true, true);
    }

    const dontSendBtn = getElementByText('div', "Don't send");
    if (dontSendBtn) {
      dispatchMouseEvent(dontSendBtn, "click", true, true);
    }

    return true;
  }

  function sendFinishMessage(eventType, eventId, eventName) {
    chrome.runtime.sendMessage({
      type: eventType,
      data: {
        eventId: eventId,
        eventName: eventName
      }
    });
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === SAVE_EDIT) {
      tryUntilPass(getSaveButton, saveEdit);
    }
  });
})();