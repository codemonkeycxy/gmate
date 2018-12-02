// Saves options to chrome.storage

// self-invoking function to avoid name collision
(() => {
  // Restores feature toggle values using the preferences stored in chrome.storage
  async function restoreOptions() {
    // fill out saved feature toggles. use default if nothing is found
    const settings = await getFromStorage(DEFAULT_FEATURE_TOGGLES);
    Object.keys(DEFAULT_FEATURE_TOGGLES).forEach(key => document.getElementById(key).checked = settings[key])
  }

  document.addEventListener("DOMContentLoaded", restoreOptions);

  // add feature toggle click listener
  Object.keys(DEFAULT_FEATURE_TOGGLES).forEach(key =>
    document.getElementById(key).addEventListener("click", e => persistPair(key, e.target.checked))
  );
})();