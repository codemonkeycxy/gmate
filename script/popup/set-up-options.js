// Saves options to chrome.storage

// self-invoking function to avoid name collision
(() => {
  // Restores feature toggle values using the preferences stored in chrome.storage
  function restoreOptions() {
    // fill out saved feature toggles. use default if nothing is found
    getFromStorage(DEFAULT_FEATURE_TOGGLES, settings =>
      Object.keys(DEFAULT_FEATURE_TOGGLES).forEach(key => document.getElementById(key).checked = settings[key])
    );

    // fill out saved room booking filters. use default if nothing is found
    getFromStorage(DEFAULT_ROOM_BOOKING_FILTERS, settings =>
      Object.keys(DEFAULT_ROOM_BOOKING_FILTERS).forEach(key => document.getElementById(key).value = settings[key])
    );
  }

  document.addEventListener("DOMContentLoaded", restoreOptions);

  // add feature toggle click listener
  Object.keys(DEFAULT_FEATURE_TOGGLES).forEach(key =>
    document.getElementById(key).addEventListener("click", e => persistPair(key, e.target.checked))
  );

  // add filter input listener
  Object.keys(DEFAULT_ROOM_BOOKING_FILTERS).forEach(key =>
    document.getElementById(key).addEventListener("input", e => persistPair(key, e.target.value))
  );
})();