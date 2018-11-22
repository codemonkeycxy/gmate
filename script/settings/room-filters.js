const SINGLE_OPTION = 'single-option';
const NUM_RANGE = 'num-range';

const COMPANY_SPECIFIC_FILTERS = {
  uber: [{
    name: 'Location',
    type: SINGLE_OPTION,
    options: [
      ANY,
      'SFO | 1455 Market',
      'SFO | 555 Market',
      'SFO | 685 Market',
      'SEA | 1191 2nd Ave',
      'PAO | 900 Arastradero A',
      'PAO | 900 Arastradero B',
    ],
    default: ANY,
    validator: (roomStr, location) => roomStr.includes(location)
  }, {
    name: 'Floor',
    type: NUM_RANGE,
    default: '',
    validator: (roomStr, floorRangeStr) => {
      const floors = parseNumbersFromString(floorRangeStr);
      if (isEmpty(floors)) {
        return true;
      }

      return floors.some(floor => {
        const ordinalNum = appendOrdinalSuffix(floor);
        const re = new RegExp(`.*-.*[^\\d][0]?${ordinalNum}.*\\(.*`);
        return !!roomStr.match(re);
      });
    }
  }, {
    name: 'Room size',
    type: NUM_RANGE,
    default: '',
    validator: (roomStr, roomSizeRangeStr) => {
      const roomSizes = parseNumbersFromString(roomSizeRangeStr);
      if (isEmpty(roomSizes)) {
        return true;
      }

      return roomSizes.some(roomSize => {
        const re = new RegExp(`.*-.*\\([^\\d]*[0]?${roomSize}[^\\d]*\\)`);
        return !!roomStr.match(re);
      });
    }
    // }, {
    //   name: 'Has VC',
    //   type: SINGLE_OPTION,
    //   options: [
    //     {[ANY]: ANY},
    //     {yes: true},
    //     {no: false}
    //   ],
    //   default: ANY,
    //   validator: (roomStr, hasVC) => {
    //     // todo: fill me up
    //   }
    // todo: add typeahead priming string to get fuller room searching results
    // use self-referring get function https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get
  }]
};

function getRoomFilterStorageKey(filterName) {
  return `room-booking-filter-${'uber'}-${filterName}`;
}

function getRoomFilterUserInput(cb) {
  const companyName = 'uber';  // hard code for now
  const filterSettings = COMPANY_SPECIFIC_FILTERS[companyName];
  const storageKeys = {};
  filterSettings.forEach(setting => storageKeys[getRoomFilterStorageKey(setting.name)] = setting.default);

  getFromStorage(storageKeys, storedInput => cb(storedInput));
}

function checkRoomEligibility(roomStr, userFilterInputs) {
  const companyName = 'uber';  // hard code for now
  const filterSettings = COMPANY_SPECIFIC_FILTERS[companyName];

  return filterSettings.every(
    filterSetting => checkRoomEligibilityByFilter(roomStr, filterSetting, userFilterInputs)
  );
}

function checkRoomEligibilityByFilter(roomStr, filterSetting, userFilterInput) {
  const storageKey = getRoomFilterStorageKey(filterSetting.name);
  const storageVal = userFilterInput[storageKey];
  if (storageVal === ANY) {
    return true;
  }

  return filterSetting.validator(roomStr, storageVal);
}