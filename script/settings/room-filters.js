const SINGLE_OPTION = 'single-option';
const NUM_RANGE = 'num-range';
const CHECKBOX = 'checkbox';

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
      'NYC | 1400 Broadway',
      'PAO | 900 Arastradero A',
      'PAO | 900 Arastradero B',
    ],
    default: ANY,
    validate: (roomStr, location) => roomStr.includes(location)
  }, {
    key: 'floor',  // CAUTION: updating key will invalidate user's current settings
    displayName: 'Floor',
    type: NUM_RANGE,
    default: '',
    validate: (roomStr, floorRangeStr) => {
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
    validate: (roomStr, roomSizeRangeStr) => {
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
    displayName: 'Must have VC',
    type: CHECKBOX,
    default: false,
    validate: (roomStr, mustHaveVC) => {
      if (!mustHaveVC) {
        return true;
      }

      const re = new RegExp('.*-.*\\(.*VC.*\\)');
      return !!roomStr.match(re);  // convert to boolean
    }
  }]
};

function getRoomFilterStorageKey(filterKey) {
  return `room-booking-filter-${'uber'}-${filterKey}`;
}

/**
 * Flex filters are room filters that are flexibly defined on a per company basis.
 * See examples from the COMPANY_SPECIFIC_FILTERS on the above
 */
async function getFlexRoomFilters() {
  const companyName = 'uber';  // hard code for now
  const filterSettings = COMPANY_SPECIFIC_FILTERS[companyName];
  const storageKeys = {};
  filterSettings.forEach(setting => storageKeys[getRoomFilterStorageKey(setting.key)] = setting.default);

  return await getFromStorage(storageKeys);
}

/**
 * Returns both the old style regex based filters and the new style company specific flex filters
 * @returns {Promise<{posFilter: *, negFilter: *, flexFilters: *}>}
 */
async function getRoomFilters() {
  const result = await getFromStorage(DEFAULT_ROOM_BOOKING_FILTERS);

  return {
    posFilter: result[ROOM_BOOKING_FILTER_POSITIVE],
    negFilter: result[ROOM_BOOKING_FILTER_NEGATIVE],
    flexFilters: await getFlexRoomFilters()
  }
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

  return filterSetting.validate(roomStr, storageVal);
}