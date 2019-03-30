// self-invoking function to avoid name collision
(() => {
  function addSaveListener() {
    getSaveButton().addEventListener("click", triggerAction);
  }

  function triggerAction(e) {
    if (!hasInvitee()) {
      e.preventDefault();
      e.stopImmediatePropagation();
      alert("No guest is invited. Are you sure?");
    }
  }

  onMessage(async (msg, sender, sendResponse) => {
    if (msg.type === ZERO_INVITEE_REMINDER) {
      await tryUntilPass(getSaveButton);
      addSaveListener();
    }
  });
})();
