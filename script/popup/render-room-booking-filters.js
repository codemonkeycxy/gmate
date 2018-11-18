// self-invoking function to avoid name collision
(() => {
  const ROOM_BOOKING_FILTERS_UI_GROUP = 'room-booking-filters-ui-group';
  const FILTER_RENDER_FUNCTIONS = {
    [SINGLE_OPTION]: renderSingleOption
  };

  document.addEventListener("DOMContentLoaded", restoreOptions);
  injectFilterUI();

  // add filter input listener
  Object.keys(DEFAULT_ROOM_BOOKING_FILTERS).forEach(key =>
    document.getElementById(key).addEventListener("input", e => persistPair(key, e.target.value))
  );

  function injectFilterUI() {
    const filterUIGroup = document.getElementById(ROOM_BOOKING_FILTERS_UI_GROUP);
    const filterSettings = COMPANY_SPECIFIC_FILTERS.uber;

    filterSettings.forEach(filterSetting => filterUIGroup.appendChild(renderFilter(filterSetting)));
  }

  function renderFilter(filterSetting) {
    return FILTER_RENDER_FUNCTIONS[filterSetting.type](filterSetting);
  }

  function renderSingleOption(filterSetting) {
    const selectWrapper = document.createElement('div');
    const selectTitle = document.createElement('div');
    selectTitle.textContent = filterSetting.name;

    const selectList = document.createElement('select');
    // set up a default option to allow ANY
    const defaultOption = document.createElement('option');
    defaultOption.value = ANY;
    defaultOption.text = ANY;
    selectList.appendChild(defaultOption);

    // populate the option list
    filterSetting.options.forEach(option => {
      const optionUI = document.createElement('option');
      // todo: account for text:value case
      optionUI.text = option;
      optionUI.value = option;
      selectList.appendChild(optionUI);
    });

    selectWrapper.appendChild(selectTitle);
    selectWrapper.appendChild(selectList);
    return selectWrapper;
  }

  // Restores feature toggle values using the preferences stored in chrome.storage
  function restoreOptions() {
    // fill out saved room booking filters. use default if nothing is found
    getFromStorage(DEFAULT_ROOM_BOOKING_FILTERS, settings =>
      Object.keys(DEFAULT_ROOM_BOOKING_FILTERS).forEach(key => document.getElementById(key).value = settings[key])
    );
  }
})();