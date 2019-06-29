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
        const re = new RegExp(`.*-.*\\([^\\d]*[0]?${roomSize}[^\\d]*\\)`);
        return !!roomStr.match(re);  // convert to boolean
      });
    }
  }, {
    key: 'need_vc',
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
  }]
};