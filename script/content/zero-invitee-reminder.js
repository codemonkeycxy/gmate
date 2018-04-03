// self-invoking function to avoid name collision
(function zeroInviteeReminder() {
  function addSaveListener() {
    var saveBtn = document.querySelectorAll('[aria-label="Save"]')[0];
    if (!saveBtn) {
      return;
    }

    saveBtn.addEventListener("click", function (e) {
      chrome.storage.sync.get(['zero-invitee-reminder'], function (settings) {
        if (settings['zero-invitee-reminder']) {
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
    if (msg.text === 'event_edit') {
      // give page some time to load
      setTimeout(addSaveListener, 500);
    }
  });

  if (document.URL.startsWith('https://calendar.google.com/calendar/r/eventedit')) {
    setTimeout(addSaveListener, 500);
  }
}());
