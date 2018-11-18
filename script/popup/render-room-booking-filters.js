const ROOM_BOOKING_FILTERS_UI_GROUP = 'room-booking-filters-ui-group';
const FILTER_RENDER_FUNCTIONS = {
  [SINGLE_OPTION]: renderSingleOption,
  [MULTI_OPTION]: renderMultiOption
};

function injectFilterUI() {
  const filterUIGroup = document.getElementById(ROOM_BOOKING_FILTERS_UI_GROUP);
  const filterSettings = COMPANY_SPECIFIC_FILTERS.uber;
  insertBefore(filterSettings.map(renderFilter), filterUIGroup.firstChild);
}

function renderFilter(filterSetting) {
  return FILTER_RENDER_FUNCTIONS[filterSetting.type](filterSetting);
}

function renderSingleOption(filterSetting) {

}

function renderMultiOption(filterSetting) {

}