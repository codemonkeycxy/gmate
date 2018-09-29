chrome.runtime.sendMessage(null, {type: GET_QUEUE}, null, resp => {
  if (resp.length === 0) {
    return;
  }

  document.getElementById(
    TO_BE_FULFILLED_QUEUE
  ).innerHTML = `<div>We are currently searching rooms for the following event(s):</div>${
    resp.map(
      task => `<li><a href="${EDIT_PAGE_URL_PREFIX}/${task.data.eventId}" target="_blank">${
        task.data.eventName
        }</a></li>`
    ).join('')
  }`;
});

// Saves options to chrome.storage
function setOption(settingName, value) {
  const newSetting = {};
  newSetting[settingName] = value;
  persist(newSetting);
}

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
  document.getElementById(key).addEventListener("click", e => setOption(key, e.target.checked))
);

// add filter input listener
Object.keys(DEFAULT_ROOM_BOOKING_FILTERS).forEach(key =>
  document.getElementById(key).addEventListener("input", e => setOption(key, e.target.value))
);
