var ALLOW_GUEST_MODIFY_EVENT = 'allow-guest-modify-event';
var ZERO_INVITEE_REMINDER = 'zero-invitee-reminder';
var GENERATE_ZOOM_ID = 'generate-zoom-id';

var DEFAULT_SETTINGS = {};
DEFAULT_SETTINGS[ALLOW_GUEST_MODIFY_EVENT] = true;
DEFAULT_SETTINGS[ZERO_INVITEE_REMINDER] = true;
DEFAULT_SETTINGS[GENERATE_ZOOM_ID] = false;

// Saves options to chrome.storage
function setOption(settingName, value) {
  var newSetting = {};
  newSetting[settingName] = value;
  chrome.storage.sync.set(newSetting);
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restoreOptions() {
  chrome.storage.sync.get(DEFAULT_SETTINGS, function (settings) {
    document.getElementById(ALLOW_GUEST_MODIFY_EVENT).checked = settings[ALLOW_GUEST_MODIFY_EVENT];
    document.getElementById(ZERO_INVITEE_REMINDER).checked = settings[ZERO_INVITEE_REMINDER];
    document.getElementById(GENERATE_ZOOM_ID).checked = settings[GENERATE_ZOOM_ID];
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById(ALLOW_GUEST_MODIFY_EVENT).addEventListener('click', function (e) {
  setOption(ALLOW_GUEST_MODIFY_EVENT, e.target.checked);
});
document.getElementById(ZERO_INVITEE_REMINDER).addEventListener('click', function (e) {
  setOption(ZERO_INVITEE_REMINDER, e.target.checked);
});
document.getElementById(GENERATE_ZOOM_ID).addEventListener('click', function (e) {
  setOption(GENERATE_ZOOM_ID, e.target.checked);
});
