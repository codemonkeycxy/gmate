// self-invoking function to avoid name collision
(() => {
  const ROOM_BOOKING_FILTERS_UI_GROUP = 'room-booking-filters-ui-group';
  const FILTER_RENDER_FUNCTIONS = {
    [SINGLE_OPTION]: renderSingleOption
  };

  // ----------------------- old style regex based filters --------------------------
  document.addEventListener("DOMContentLoaded", restoreOptions);
  // Restores feature toggle values using the preferences stored in chrome.storage
  function restoreOptions() {
    // fill out saved room booking filters. use default if nothing is found
    getFromStorage(DEFAULT_ROOM_BOOKING_FILTERS, settings =>
      Object.keys(DEFAULT_ROOM_BOOKING_FILTERS).forEach(key => document.getElementById(key).value = settings[key])
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
    const storageKeys = {};
    filterSettings.forEach(setting => storageKeys[getStorageKey(setting.name)] = setting.default);

    getFromStorage(storageKeys, storedInput => {
      const filterUIGroup = document.getElementById(ROOM_BOOKING_FILTERS_UI_GROUP);
      filterSettings.forEach(filterSetting => filterUIGroup.appendChild(renderFilter(filterSetting, storedInput)));
    });
  }

  function getStorageKey(filterName) {
    return `room-booking-filter-${'uber'}-${filterName}`;
  }

  function renderFilter(filterSetting, storedInput) {
    return FILTER_RENDER_FUNCTIONS[filterSetting.type](filterSetting, storedInput);
  }

  function renderSingleOption(filterSetting, storedInput) {
    const filterName = filterSetting.name;
    const filterOptions = filterSetting.options;
    const storageKey = getStorageKey(filterName);

    return renderDropDownSelect(
      filterName,
      filterOptions,
      storedInput[storageKey],
      e => persistPair(storageKey, e.target.value)
    );
  }
})();