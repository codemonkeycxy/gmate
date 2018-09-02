// Saves options to chrome.storage
function setOption(settingName, value) {
  const newSetting = {};
  newSetting[settingName] = value;
  persist(newSetting);
}

// Restores feature toggle values using the preferences stored in chrome.storage
function restoreOptions() {
  // fill out saved feature toggles. use default if nothing is found
  getFromStorage(DEFAULT_FEATURE_TOGGLES, function(settings) {
    Object.keys(DEFAULT_FEATURE_TOGGLES).forEach(function(key) {
      document.getElementById(key).checked = settings[key];
    });
  });

  // fill out saved room booking filters. use default if nothing is found
  getFromStorage(DEFAULT_ROOM_BOOKING_FILTERS, function(settings) {
    Object.keys(DEFAULT_ROOM_BOOKING_FILTERS).forEach(function(key) {
      document.getElementById(key).value = settings[key];
    });
  });
}

document.addEventListener("DOMContentLoaded", restoreOptions);

// add feature toggle click listener
Object.keys(DEFAULT_FEATURE_TOGGLES).forEach(function(key) {
  document.getElementById(key).addEventListener("click", function(e) {
    setOption(key, e.target.checked);
  });
});

// add filter input listener
Object.keys(DEFAULT_ROOM_BOOKING_FILTERS).forEach(function(key) {
  document.getElementById(key).addEventListener("input", function(e) {
    setOption(key, e.target.value);
  });
});
