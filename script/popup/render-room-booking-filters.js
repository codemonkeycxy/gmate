// self-invoking function to avoid name collision
(() => {
  const ROOM_BOOKING_FILTERS_UI_GROUP = 'room-booking-filters-ui-group';
  const FILTER_RENDER_FUNCTIONS = {
    [SINGLE_OPTION]: renderSingleOption,
    [MULTI_OPTION]: renderMultiOption
  };

  injectFilterUI();

  function injectFilterUI() {
    const filterUIGroup = document.getElementById(ROOM_BOOKING_FILTERS_UI_GROUP);
    const filterSettings = COMPANY_SPECIFIC_FILTERS.uber;

    const filterWrapper = document.createElement('div');
    filterSettings.forEach(filterSetting => filterWrapper.appendChild(renderFilter(filterSetting)));
    insertBefore(filterWrapper, filterUIGroup.firstChild);
  }

  function renderFilter(filterSetting) {
    return FILTER_RENDER_FUNCTIONS[filterSetting.type](filterSetting);
  }

  function renderSingleOption(filterSetting) {
    const selectList = document.createElement('select');
    selectList.name = filterSetting.name;

    filterSetting.options.forEach(option => {
      const optionUI = document.createElement('option');
      optionUI.value = option;
      optionUI.text = option;
      selectList.appendChild(optionUI);
    });

    return selectList;
  }

  function renderMultiOption(filterSetting) {
    return renderSingleOption(filterSetting);
  }
})();