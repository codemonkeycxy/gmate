// self-invoking function to avoid name collision
(function zeroInviteeReminder() {
  function addSaveListener() {
    var saveBtn = document.querySelectorAll('[aria-label="Save"]')[0];
    if (!saveBtn) {
      return;
    }

    saveBtn.addEventListener("click", function (e) {
      chrome.storage.sync.get(DEFAULT_FEATURE_TOGGLES, function (settings) {
        if (settings[ZERO_INVITEE_REMINDER]) {
          triggerAction(e);
        }
      });
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
    if (msg.type === 'event_edit') {
      // give page some time to load
      setTimeout(addSaveListener, 500);
    }
  });
}());
