/**
 * it's a shame that there's no good way to dynamically create elements from html file in chrome extension
 * (see a hacky way in here: https://stackoverflow.com/questions/19103183/how-to-insert-html-with-a-chrome-extension)
 *
 * the best way i can see now is to manually assembles the necessary component via code.
 * this function returns the following html

 <div>
 <div id="room-booking-flex-filters"></div>

 <!--old style filters to be deprecated-->
 <span>Name include (</span>
 <a href="https://regex101.com/" target="_blank">regex</a>
 <span>): </span>
 <input type="text" placeholder="1455.*0(4|5)th" id="room-booking-filter-positive-1">

 <br>

 <span>Name exclude (</span>
 <a href="https://regex101.com/" target="_blank">regex</a>
 <span>): </span>
 <input type="text" placeholder="(Cart|Quiet Room)" id="room-booking-filter-negative">
 <!--old style filters to be deprecated-->
 </div>

 */
const asyncRenderRoomBookingFilters = (() => {
  const FILTER_RENDER_FUNCTIONS = {
    [SINGLE_OPTION]: renderSingleOptionFilter,
    [NUM_RANGE]: renderNumRangeFilter,
    [CHECKBOX]: renderCheckboxFilter,
  };

  async function renderRoomBookingFilters() {
    const filtersWrapper = document.createElement('div');

    await injectFlexFilterUI(filtersWrapper);
    injectRegexFilterUI(filtersWrapper);

    return filtersWrapper;
  }

  function injectRegexFilterUI(filtersWrapper) {
    // <span>Name include (</span>
    const textSpan1 = document.createElement('span');
    textSpan1.innerText = 'Name include (';
    filtersWrapper.appendChild(textSpan1);

    // <a href="https://regex101.com/" target="_blank">regex</a>
    const regexLink1 = document.createElement('a');
    regexLink1.href = 'https://regex101.com/';
    regexLink1.target = '_blank';
    regexLink1.textContent = 'regex';
    filtersWrapper.appendChild(regexLink1);

    // <span>): </span>
    const textSpan2 = document.createElement('span');
    textSpan2.innerText = '): ';
    filtersWrapper.appendChild(textSpan2);

    // <input type="text" placeholder="1455.*0(4|5)th" id="room-booking-filter-positive-1">
    const posFilterInput = document.createElement('input');
    posFilterInput.type = 'text';
    posFilterInput.placeholder = '1455.*0(4|5)th';
    posFilterInput.id = ROOM_BOOKING_FILTER_POSITIVE;
    filtersWrapper.appendChild(posFilterInput);

    // <br>
    filtersWrapper.appendChild(document.createElement('br'));

    // <span>Name exclude (</span>
    const textSpan3 = document.createElement('span');
    textSpan3.innerText = 'Name exclude (';
    filtersWrapper.appendChild(textSpan3);

    // <a href="https://regex101.com/" target="_blank">regex</a>
    const regexLink2 = document.createElement('a');
    regexLink2.href = 'https://regex101.com/';
    regexLink2.target = '_blank';
    regexLink2.textContent = 'regex';
    filtersWrapper.appendChild(regexLink2);

    // <span>): </span>
    const textSpan4 = document.createElement('span');
    textSpan4.innerText = '): ';
    filtersWrapper.appendChild(textSpan4);

    //  <input type="text" placeholder="(Cart|Quiet Room)" id="room-booking-filter-negative">
    const negFilterInput = document.createElement('input');
    negFilterInput.type = 'text';
    negFilterInput.placeholder = '(Cart|Quiet Room)';
    negFilterInput.id = ROOM_BOOKING_FILTER_NEGATIVE;
    filtersWrapper.appendChild(negFilterInput);
  }

  async function injectFlexFilterUI(filtersWrapper) {
    const companyName = 'uber';  // hard code for now
    const filterSettings = COMPANY_SPECIFIC_FILTERS[companyName];

    const flexFilters = await getFlexRoomFilters();
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

  return renderRoomBookingFilters;
})();
