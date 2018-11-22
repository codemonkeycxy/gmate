// self-invoking function to avoid name collision
(() => {
  const ROOM_BOOKING_FILTERS_UI_GROUP = 'room-booking-filters-ui-group';
  const FILTER_RENDER_FUNCTIONS = {
    [SINGLE_OPTION]: renderSingleOption,
    [NUM_RANGE]: renderNumRange
  };

  // ----------------------- old style regex based filters --------------------------
  document.addEventListener("DOMContentLoaded", restoreOptions);

  // Restores feature toggle values using the preferences stored in chrome.storage
  function restoreOptions() {
    // fill out saved room booking filters. use default if nothing is found
    getFromStorage(DEFAULT_ROOM_BOOKING_FILTERS, settings =>
      Object.keys(DEFAULT_ROOM_BOOKING_FILTERS).forEach(
        key => document.getElementById(key).value = settings[key]
      )
    );
  }

  // ----------------------- new style human readable filters -------------------------
  injectFilterUI();
  // add filter input listener
  Object.keys(DEFAULT_ROOM_BOOKING_FILTERS).forEach(key =>
    document.getElementById(key).addEventListener("input", e => persistPair(key, e.target.value))
  );

  function injectFilterUI() {
    const companyName = 'uber';  // hard code for now
    const filterSettings = COMPANY_SPECIFIC_FILTERS[companyName];
    const filterUIGroup = document.getElementById(ROOM_BOOKING_FILTERS_UI_GROUP);

    getRoomFilterUserInput(storedInput =>
      filterSettings.forEach(
        filterSetting => filterUIGroup.appendChild(
          renderFilter(filterSetting, storedInput)
        )
      )
    );
  }

  function renderFilter(filterSetting, storedInput) {
    const filterName = filterSetting.displayName;
    const storageKey = getRoomFilterStorageKey(filterSetting.key);
    const storedValue = storedInput[storageKey];

    return FILTER_RENDER_FUNCTIONS[filterSetting.type](filterName, storedValue, storageKey, filterSetting);
  }

  function renderSingleOption(title, initialVal, storageKey, filterSetting) {
    const filterOptions = filterSetting.options;

    return renderDropDownSelect(
      title,
      filterOptions,
      initialVal,
      selected => persistPair(storageKey, selected)
    );
  }

  function renderNumRange(title, initialVal, storageKey) {
    return renderStringNumberRange(
      title,
      initialVal,
      selected => persistPair(storageKey, selected)
    );
  }
})();