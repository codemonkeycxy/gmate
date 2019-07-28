const UBER_ROOM_FILTERS = [{
  key: 'location',  // CAUTION: updating key will invalidate user's current settings
  displayName: 'Location',
  type: SINGLE_OPTION,
  options: [
    ANY,
    'SFO | 1455 Market',
    'ATL | 1201 Peachtree',
    'MEX | Río Lerma 232',
    'MEX | Torre Mayor',
    'NYC | 636 W. 28th',
    'NYC | 1400 Broadway',
    'PAO | 900 Arastradero A',
    'PAO | 900 Arastradero B',
    'SEA | 1191 2nd Ave',
    'SFO | 555 Market',
    'SFO | 685 Market',
  ],
  default: ANY,
  match: (roomStr, location) => roomStr.includes(location),
  validateInput: input => {
    if (input !== ANY) {
      return {
        valid: true,
        errMsg: null
      }
    }

    return {
      valid: false,
      errMsg: "Please select. Email gmate.hotline@gmail.com if your location is not listed"
    }
  }
}, {
  key: 'floor',  // CAUTION: updating key will invalidate user's current settings
  displayName: 'Floor',
  type: NUM_RANGE,
  default: '',
  match: (roomStr, floorRangeStr) => {
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
  match: (roomStr, roomSizeRangeStr) => {
    const roomSizes = parseNumbersFromString(roomSizeRangeStr);
    if (isEmpty(roomSizes)) {
      return true;
    }

    return roomSizes.some(roomSize => {
      const re = new RegExp(`.*[-|–].*\\([^\\d]*[0]?${roomSize}[^\\d]*\\)`);
      return !!roomStr.match(re);  // convert to boolean
    });
  }
}, {
  key: 'need_vc',  // CAUTION: updating key will invalidate user's current settings
  displayName: 'Must have VC',
  type: CHECKBOX,
  default: false,
  match: (roomStr, mustHaveVC) => {
    if (!mustHaveVC) {
      return true;
    }

    const re = new RegExp('.*-.*\\(.*VC.*\\)');
    return !!roomStr.match(re);  // convert to boolean
  }
}, {
  key: 'exclude_cart',  // CAUTION: updating key will invalidate user's current settings
  displayName: 'Exclude Cart',
  type: CHECKBOX,
  default: true,
  match: (roomStr, excludeCart) => {
    if (!excludeCart) {
      return true;
    }

    const re = new RegExp('\\b(Cart|cart)\\b');
    return !roomStr.match(re);  // name contains "cart" => no match
  }
}];

// gResource - google api resource defined here: https://developers.google.com/admin-sdk/directory/v1/reference/resources/calendars
function extractUberRoomCapacity(gResource) {
  try {
    return JSON.parse(gResource.resourceDescription).recon.room_capacity;
  } catch (e) {
    const re = new RegExp(`.*[-|–].*\\([^\\d]*[0]?(\\d+)[^\\d]*\\)`);
    const matches = gResource.generatedResourceName.match(re);
    if (matches && matches.length >= 2 && matches[1]) {
      return Number(matches[1]);
    }
  }
}
