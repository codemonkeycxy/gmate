// self-invoking function to avoid name collision
(() => {
  function addSaveListener() {
    getSaveButton().addEventListener("click", e => {
      triggerAction(e);
    });
  }

  function triggerAction(e) {
    if (!hasInvitee()) {
      e.preventDefault();
      e.stopImmediatePropagation();
      alert("No guest is invited. Are you sure?");
    }
  }

  onMessage((msg, sender, sendResponse) => {
    if (msg.type === ZERO_INVITEE_REMINDER) {
      tryUntilPass(getSaveButton, addSaveListener)
    }
  });
})();
