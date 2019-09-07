async function asyncRenderRoomBookingFilters(
  onPosRegexFilterChange,
  onNegRegexFilterChange,
  onNegTextFilterChange,
  onFlexFilterChange
) {
  const FILTER_RENDER_FUNCTIONS = {
    [AUTO_COMPLETE]: renderAutoCompleteFilter,
    [DROPDOWN]: renderDropdownFilter,
    [NUM_RANGE]: renderNumRangeFilter,
    [CHECKBOX]: renderCheckboxFilter,
  };

  async function injectRegexFiltersUI(filtersWrapper, posRegex, negRegex, negText) {
    const regexFilters = await loadHTMLElement('template/room-filters.html');
    filtersWrapper.appendChild(regexFilters);

    const posRegexInput = findChildById(regexFilters, 'room-booking-filter-positive-regex');
    posRegexInput.value = posRegex;
    posRegexInput.addEventListener("input", e => onPosRegexFilterChange(e.target.value));

    const negRegexInput = findChildById(regexFilters, 'room-booking-filter-negative-regex');
    negRegexInput.value = negRegex;
    negRegexInput.addEventListener("input", e => onNegRegexFilterChange(e.target.value));

    const negTextInput = findChildById(regexFilters, 'room-booking-filter-negative-text');
    negTextInput.value = negText;
    negTextInput.addEventListener("input", e => onNegTextFilterChange(e.target.value));
  }

  function injectFlexFiltersUI(filtersWrapper, flexFilters) {
    const companyName = 'uber';  // hard code for now
    const filterSettings = COMPANY_SPECIFIC_FILTERS[companyName];

    filterSettings.forEach(
      filterSetting => filtersWrapper.appendChild(
        renderFlexFilter(filterSetting, flexFilters)
      )
    );
  }

  function renderFlexFilter(filterSetting, storedInput) {
    const title = filterSetting.displayName;
    const storageKey = getRoomFilterStorageKey(filterSetting.key);
    const storedValue = storedInput[storageKey];

    return FILTER_RENDER_FUNCTIONS[filterSetting.type](title, storedValue, storageKey, filterSetting);
  }

  // user can pick one option from a list of dropdown values
  function renderDropdownFilter(title, initialVal, storageKey, filterSetting) {
    return renderDropdown(
      title,
      filterSetting.options,
      initialVal,
      selected => onFlexFilterChange(storageKey, selected),
      filterSetting.validateInput
    );
  }

  // user can type and search
  function renderAutoCompleteFilter(title, initialVal, storageKey, filterSetting) {
    return renderAutoComplete(
      title,
      filterSetting.options,
      initialVal,
      selected => onFlexFilterChange(storageKey, selected),
      filterSetting.validateInput
    );
  }

  // user can enter a numerical range in the form of a string, such as "1, 3, 5-12"
  function renderNumRangeFilter(title, initialVal, storageKey) {
    return renderStringNumberRange(
      title,
      initialVal,
      selected => onFlexFilterChange(storageKey, selected)
    );
  }

  // user can toggle the value of a checkbox
  function renderCheckboxFilter(title, initialVal, storageKey) {
    return renderCheckbox(
      title,
      initialVal,
      checked => onFlexFilterChange(storageKey, checked)
    );
  }

  const filtersWrapper = document.createElement('div');

  const filters = await getRoomFilters();
  injectFlexFiltersUI(filtersWrapper, filters.flexFilters);
  await injectRegexFiltersUI(filtersWrapper, filters.posRegex, filters.negRegex, filters.negText);

  return filtersWrapper;
}
