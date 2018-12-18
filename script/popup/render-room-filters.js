// self-invoking function to avoid name collision
(async () => {
  const ROOM_BOOKING_FILTERS_UI_GROUP = 'room-booking-filter-ui-group';
  const FILTER_RENDER_FUNCTIONS = {
    [SINGLE_OPTION]: renderSingleOptionFilter,
    [NUM_RANGE]: renderNumRangeFilter,
    [CHECKBOX]: renderCheckboxFilter,
  };

  const uiGroupWrapper = document.getElementById(ROOM_BOOKING_FILTERS_UI_GROUP);
  uiGroupWrapper.appendChild(renderRoomBookingFilters());

  // ----------------------- old style regex based filters --------------------------
  document.addEventListener("DOMContentLoaded", restoreOptions);

  // Restores feature toggle values using the preferences stored in chrome.storage
  async function restoreOptions() {
    // fill out saved room booking filters. use default if nothing is found
    const settings = await getFromStorage(DEFAULT_ROOM_BOOKING_FILTERS);
    Object.keys(DEFAULT_ROOM_BOOKING_FILTERS).forEach(
      key => document.getElementById(key).value = settings[key]
    );
  }

  // add filter input listener
  Object.keys(DEFAULT_ROOM_BOOKING_FILTERS).forEach(key =>
    document.getElementById(key).addEventListener("input", e => persistPair(key, e.target.value))
  );

  // ----------------------- new style human readable filters -------------------------
  document.addEventListener("DOMContentLoaded", injectFilterUI);

  async function injectFilterUI() {
    const companyName = 'uber';  // hard code for now
    const filterSettings = COMPANY_SPECIFIC_FILTERS[companyName];
    const filterUIGroup = document.getElementById('room-booking-flex-filters');

    const flexFilters = await getFlexRoomFilters();
    filterSettings.forEach(
      filterSetting => filterUIGroup.appendChild(
        renderFlexFilter(filterSetting, flexFilters)
      )
    )
  }

  function renderFlexFilter(filterSetting, storedInput) {
    const title = filterSetting.displayName;
    const storageKey = getRoomFilterStorageKey(filterSetting.key);
    const storedValue = storedInput[storageKey];

    return FILTER_RENDER_FUNCTIONS[filterSetting.type](title, storedValue, storageKey, filterSetting);
  }

  // user can pick one option from a list of dropdown values
  function renderSingleOptionFilter(title, initialVal, storageKey, filterSetting) {
    const filterOptions = filterSetting.options;

    return renderDropDownSelect(
      title,
      filterOptions,
      initialVal,
      selected => persistPair(storageKey, selected)
    );
  }

  // user can enter a numerical range in the form of a string, such as "1, 3, 5-12"
  function renderNumRangeFilter(title, initialVal, storageKey) {
    return renderStringNumberRange(
      title,
      initialVal,
      selected => persistPair(storageKey, selected)
    );
  }

  // user can toggle the value of a checkbox
  function renderCheckboxFilter(title, initialVal, storageKey) {
    return renderCheckbox(
      title,
      initialVal,
      checked => persistPair(storageKey, checked)
    );
  }
})();