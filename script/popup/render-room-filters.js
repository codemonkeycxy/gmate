// self-invoking function to avoid name collision
(async () => {
  const ROOM_BOOKING_FILTERS_UI_GROUP = 'room-booking-filters-ui-group';
  const FILTER_RENDER_FUNCTIONS = {
    [SINGLE_OPTION]: renderSingleOptionFilter,
    [NUM_RANGE]: renderNumRangeFilter,
    [CHECKBOX]: renderCheckboxFilter,
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
  await injectFilterUI();
  // add filter input listener
  Object.keys(DEFAULT_ROOM_BOOKING_FILTERS).forEach(key =>
    document.getElementById(key).addEventListener("input", e => persistPair(key, e.target.value))
  );

  async function injectFilterUI() {
    const companyName = 'uber';  // hard code for now
    const filterSettings = COMPANY_SPECIFIC_FILTERS[companyName];
    const filterUIGroup = document.getElementById(ROOM_BOOKING_FILTERS_UI_GROUP);

    const storedInput = await getRoomFilterUserInputs();
    filterSettings.forEach(
      filterSetting => filterUIGroup.appendChild(
        renderFilter(filterSetting, storedInput)
      )
    )
  }

  function renderFilter(filterSetting, storedInput) {
    const title = filterSetting.displayName;
    const storageKey = getRoomFilterStorageKey(filterSetting.key);
    const storedValue = storedInput[storageKey];

    return FILTER_RENDER_FUNCTIONS[filterSetting.type](title, storedValue, storageKey, filterSetting);
  }

  function renderSingleOptionFilter(title, initialVal, storageKey, filterSetting) {
    const filterOptions = filterSetting.options;

    return renderDropDownSelect(
      title,
      filterOptions,
      initialVal,
      selected => persistPair(storageKey, selected)
    );
  }

  function renderNumRangeFilter(title, initialVal, storageKey) {
    return renderStringNumberRange(
      title,
      initialVal,
      selected => persistPair(storageKey, selected)
    );
  }

  function renderCheckboxFilter(title, initialVal, storageKey) {
    return renderCheckbox(
      title,
      initialVal,
      checked => persistPair(storageKey, checked)
    );
  }
})();