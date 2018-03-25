function hasInvitee() {
  var divTags = document.getElementsByTagName('div');

  for (var i = 0; i < divTags.length; i++) {
    var key = divTags[i].getAttribute('key');
    var dataEmail = divTags[i].getAttribute('data-email');
    if (key && dataEmail && key === dataEmail) {
      return true;
    }
  }

  return false;
}

function addSaveListener() {
  var saveBtn = document.querySelectorAll('[aria-label="Save"]')[0];
  saveBtn.addEventListener("click", function(e){
    if (!hasInvitee()) {
      e.preventDefault();
      e.stopImmediatePropagation();
      alert("No guest is invited. Are you sure?");
    }
  });
}

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (msg.text === 'event_edit') {
    addSaveListener();
  }
});

if (document.URL.startsWith('https://calendar.google.com/calendar/r/eventedit')) {
  addSaveListener();
}