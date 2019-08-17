const UBER_VC = 'VC';
const UBER_CART = 'Cart';

const UBER_ROOM_FILTERS = [{
  key: 'location',  // CAUTION: updating key will invalidate user's current settings
  displayName: 'Location',
  type: SINGLE_OPTION,
  options: UBER_OFFICE_LOCATIONS,
  default: ANY,
  match: (room, location) => room.name.includes(location),
  validateInput: input => {
    if (!input || !input.trim() || input === ANY) {
      return {
        valid: false,
        errMsg: "Please select. Email gmate.hotline@gmail.com if your location is not listed"
      }
    }

    if (!UBER_OFFICE_LOCATIONS.includes(input)) {
      return {
        valid: false,
        errMsg: "Invalid input. Email gmate.hotline@gmail.com if your location is not listed"
      }
    }

    return {
      valid: true,
      errMsg: null
    };
  }
}, {
  key: 'floor',  // CAUTION: updating key will invalidate user's current settings
  displayName: 'Floor',
  type: NUM_RANGE,
  default: '',
  match: (room, floorRangeStr) => {
    const floors = parseNumbersFromString(floorRangeStr);
    if (isEmpty(floors)) {
      return true;
    }

    return floors.some(floor => room.floor && room.floor === floor);
  }
}, {
  key: 'room_size',  // CAUTION: updating key will invalidate user's current settings
  displayName: 'Room size',
  type: NUM_RANGE,
  default: '',
  match: (room, roomSizeRangeStr) => {
    const roomSizes = parseNumbersFromString(roomSizeRangeStr);
    if (isEmpty(roomSizes)) {
      return true;
    }

    return roomSizes.some(roomSize => room.capacity && room.capacity === roomSize);
  }
}, {
  key: 'need_vc',  // CAUTION: updating key will invalidate user's current settings
  displayName: 'Must have VC',
  type: CHECKBOX,
  default: false,
  match: (room, mustHaveVC) => {
    if (!mustHaveVC) {
      return true;
    }

    return !isEmpty(room.features) && room.features.some(feature => feature === UBER_VC);
  }
}];

// gResource - google api resource defined here: https://developers.google.com/admin-sdk/directory/v1/reference/resources/calendars
function isUberRoom(gResource) {
  return gResource.resourceEmail && gResource.resourceEmail.includes('uber');
}

// gResource - google api resource defined here: https://developers.google.com/admin-sdk/directory/v1/reference/resources/calendars
function extractUberRoomFloor(gResource) {
  const fromDesc = () => {
    try {
      const uberSetting = JSON.parse(gResource.resourceDescription).recon;
      const version = JSON.parse(gResource.resourceDescription).version;

      if (version === '1.0') {
        if (!isEmpty(uberSetting.room_floor) && !isNaN(uberSetting.room_floor)) {
          return uberSetting.room_floor;
        }
      } else if (!isEmpty(version)) {
        GMateError('uber room version updated', {
          v: version,
          desc: gResource.resourceDescription,
          name: gResource.generatedResourceName
        });
      }
    } catch (e) {
      // intentionally left blank
    }
  };
  const fromFloorName = () => gResource.floorName && Number(gResource.floorName.toLowerCase().trim().replace(/(st|nd|rd|th)/));
  const fromRoomName = () => {
    const re = new RegExp(`.*[-–][^\\d]*[0]?(\\d+)(st|nd|rd|th)`);
    const matches = gResource.generatedResourceName.match(re);
    if (matches && matches.length >= 2 && matches[1]) {
      return Number(matches[1]);
    }
  };

  return fromDesc() || fromFloorName() || fromRoomName();
}

// gResource - google api resource defined here: https://developers.google.com/admin-sdk/directory/v1/reference/resources/calendars
function extractUberRoomCapacity(gResource) {
  const fromDesc = () => {
    try {
      const uberSetting = JSON.parse(gResource.resourceDescription).recon;
      const version = JSON.parse(gResource.resourceDescription).version;

      if (version === '1.0') {
        if (!isEmpty(uberSetting.room_capacity) && !isNaN(uberSetting.room_capacity)) {
          return uberSetting.room_capacity;
        }
      } else if (!isEmpty(version)) {
        GMateError('uber room version updated', {
          v: version,
          desc: gResource.resourceDescription,
          name: gResource.generatedResourceName
        });
      }
    } catch (e) {
      // intentionally left blank
    }
  };
  const fromRoomName = () => {
    const re = new RegExp(`.*[-–].*\\([^\\d]*[0]?(\\d+)[^\\d]*\\)`);
    const matches = gResource.generatedResourceName.match(re);
    if (matches && matches.length >= 2 && matches[1]) {
      return Number(matches[1]);
    }
  };

  return fromDesc() || fromRoomName();
}

// gResource - google api resource defined here: https://developers.google.com/admin-sdk/directory/v1/reference/resources/calendars
function extractUberRoomFeatures(gResource) {
  const results = [];

  if (_uberRoomHasVC(gResource)) {
    results.push(UBER_VC);
  }

  if (_uberRoomIsCart(gResource)) {
    results.push(UBER_CART);
  }

  return results;
}

// gResource - google api resource defined here: https://developers.google.com/admin-sdk/directory/v1/reference/resources/calendars
function _uberRoomHasVC(gResource) {
  // prefer extraction from gResource feature
  const gRoomFeatures = gResource.featureInstances;
  if (!isEmpty(gRoomFeatures)) {
    const vcKeywords = ['vc', 'zoom'];  // make sure to use lower case
    if (gRoomFeatures.some(gFeature => gFeature.feature.name && vcKeywords.some(vc => gFeature.feature.name.trim().toLowerCase() === vc))) {
      return true;
    }
  }

  // fallback on extraction from gResource name
  const re = new RegExp('.*[-–].*\\(.*VC.*\\)');
  const roomName = gResource.generatedResourceName;
  const blacklistNames = ['no vc', 'tv broken'];  // make sure to use lower case
  return roomName.match(re) && !blacklistNames.some(blacklist => roomName.toLowerCase().includes(blacklist)) && !_uberRoomIsCart(gResource);
}

// gResource - google api resource defined here: https://developers.google.com/admin-sdk/directory/v1/reference/resources/calendars
function _uberRoomIsCart(gResource) {
  const re = new RegExp('\\b(Cart|cart)\\b');
  return gResource.generatedResourceName.match(re);
}
