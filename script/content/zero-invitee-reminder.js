// self-invoking function to avoid name collision
(function zeroInviteeReminder() {
  function addSaveListener() {
    var saveBtn = document.querySelectorAll('[aria-label="Save"]')[0];
    if (!saveBtn) {
      return;
    }

    saveBtn.addEventListener("click", function (e) {
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

  chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (msg.type === ZERO_INVITEE_REMINDER) {
      // give page some time to load
      setTimeout(addSaveListener, 500);
    }
  });
}());
