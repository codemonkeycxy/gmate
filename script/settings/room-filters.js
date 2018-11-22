const SINGLE_OPTION = 'single-option';
const NUM_RANGE = 'num-range';

const COMPANY_SPECIFIC_FILTERS = {
  uber: [{
    key: 'location',  // CAUTION: updating key will invalidate user's current settings
    displayName: 'Location',
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
    key: 'floor',  // CAUTION: updating key will invalidate user's current settings
    displayName: 'Floor',
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
        return !!roomStr.match(re);  // convert to boolean
      });
    }
  }, {
    key: 'room_size',  // CAUTION: updating key will invalidate user's current settings
    displayName: 'Room size',
    type: NUM_RANGE,
    default: '',
    validator: (roomStr, roomSizeRangeStr) => {
      const roomSizes = parseNumbersFromString(roomSizeRangeStr);
      if (isEmpty(roomSizes)) {
        return true;
      }

      return roomSizes.some(roomSize => {
        const re = new RegExp(`.*-.*\\([^\\d]*[0]?${roomSize}[^\\d]*\\)`);
        return !!roomStr.match(re);  // convert to boolean
      });
    }
  }, {
    key: 'need_vc',
    displayName: 'Need VC',
    type: SINGLE_OPTION,
    options: [
      ANY,
      YES,
      NO
    ],
    default: ANY,
    validator: (roomStr, needVcStr) => {
      const re = new RegExp('.*-.*\\(.*VC.*\\)');
      const hasVC = !!roomStr.match(re);  // convert to boolean
      const needVC = needVcStr === YES;

      return needVC === hasVC;
    }
  }]
};

function getRoomFilterStorageKey(filterKey) {
  return `room-booking-filter-${'uber'}-${filterKey}`;
}

function getRoomFilterUserInputs(cb) {
  const companyName = 'uber';  // hard code for now
  const filterSettings = COMPANY_SPECIFIC_FILTERS[companyName];
  const storageKeys = {};
  filterSettings.forEach(setting => storageKeys[getRoomFilterStorageKey(setting.key)] = setting.default);

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
  const storageKey = getRoomFilterStorageKey(filterSetting.key);
  const storageVal = userFilterInput[storageKey];
  if (storageVal === ANY) {
    return true;
  }

  return filterSetting.validator(roomStr, storageVal);
}