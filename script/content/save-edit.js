// self-invoking function to avoid name collision
(() => {
  async function saveEdit() {
    const eventId = getEventId();
    const eventName = getEventName();

    const saveBtn = getSaveButton();
    dispatchMouseEvent(saveBtn, "click", true, true);
    // give some time for the confirmation screen to load
    // there are 3 possibilities:
    // 1) no confirmation page (in case of no invitees)
    // 2) confirmation to notify invitees
    // 3) confirmation for recurring meetings + confirmation to notify invitees
    const success = await tryUntilPass(
      () => confirmSaving() && isMainCalendarPage(),
      { // wait up to 30 sec
        sleepMs: 1000,
        countdown: 30,
        suppressError: true
      }
    );
    const eventType = success ? EDIT_SAVED : SAVE_EDIT_FAILURE;
    sendFinishMessage(eventType, eventId, eventName);
  }

  function confirmSaving() {
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

  onMessage(async (msg, sender, sendResponse) => {
    if (msg.type === SAVE_EDIT) {
      await tryUntilPass(getSaveButton);
      await saveEdit();
    }
  });
})();