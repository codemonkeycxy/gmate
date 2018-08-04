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
    Object.keys(DEFAULT_SETTINGS).forEach(function (key) {
      document.getElementById(key).checked = settings[key];
    });
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
Object.keys(DEFAULT_SETTINGS).forEach(function (key) {
  document.getElementById(key).addEventListener('click', function (e) {
    setOption(key, e.target.checked);
  });
});
