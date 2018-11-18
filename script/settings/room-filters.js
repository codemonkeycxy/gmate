const SINGLE_OPTION = 'single-option';
const MULTI_OPTION = 'multi-option';
const RANGE = 'range';

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
    // }, {
    //   name: 'Floor',
    //   type: MULTI_OPTION,
    //   options: [
    //     ANY,
    //     '1st',
    //     '2nd',
    //     '3rd',
    //     '4th',
    //     '5th',
    //     '6th',
    //     '7th',
    //     '8th',
    //     '9th',
    //     '10th',
    //     '11th',
    //     '12th',
    //     '13th',
    //     '14th',
    //   ],
    //   default: ANY,
    //   validator: (roomStr, floors) => floors.any(floor => roomStr.includes(floor))
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