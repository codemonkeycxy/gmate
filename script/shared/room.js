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

  return await getFromSync(storageKeys);
}

/**
 * Returns both the old style regex based filters and the new style company specific flex filters
 * @returns {Promise<{posFilter: *, negFilter: *, flexFilters: *}>}
 */
async function getRoomFilters() {
  const result = await getFromSync(DEFAULT_ROOM_BOOKING_FILTERS);

  return {
    posFilter: result[ROOM_BOOKING_FILTER_POSITIVE],
    negFilter: result[ROOM_BOOKING_FILTER_NEGATIVE],
    flexFilters: await getFlexRoomFilters()
  }
}

function matchRoom(room, posFilter, negFilter, flexFilters) {
  const roomStr = room.name;
  let matchPosFilter = true;
  let matchNegFilter = false;
  let matchFlexFilter = true;

  if (posFilter) {
    const posRe = new RegExp(posFilter);
    // return if name matches with positive filter
    matchPosFilter = roomStr.match(posRe);
  }

  if (negFilter) {
    const negRe = new RegExp(negFilter);
    matchNegFilter = roomStr.match(negRe);
  }

  if (flexFilters) {
    matchFlexFilter = matchRoomByFlexFilters(room, flexFilters);
  }

  return matchPosFilter && !matchNegFilter && matchFlexFilter;
}

function matchRoomByFlexFilters(room, flexFilters) {
  const companyName = 'uber';  // hard code for now
  const filterSettings = COMPANY_SPECIFIC_FILTERS[companyName];

  return filterSettings.every(
    filterSetting => matchRoomByFlexFilterOne(room, filterSetting, flexFilters)
  );
}

function matchRoomByFlexFilterOne(room, filterSetting, flexFilters) {
  const storageKey = getRoomFilterStorageKey(filterSetting.key);
  const storageVal = flexFilters[storageKey];
  if (storageVal === ANY) {
    return true;
  }

  return filterSetting.match(room, storageVal);
}

async function pickRoomBasedOnHistory(roomEmails) {
  if (isEmpty(roomEmails)) {
    return null;
  }

  const favRooms = await getKeyFromSync(FAVORITE_ROOMS, {});
  let favoriteRoom = roomEmails[0];  // default to pick the first item from the list
  let favorability = -1;

  roomEmails.forEach(roomEmail => {
    if (!favRooms[roomEmail]) {
      return;
    }

    const currFav = favRooms[roomEmail].count;
    if (roomEmail in favRooms && currFav > favorability) {
      favoriteRoom = roomEmail;
      favorability = currFav;
    }
  });

  return favoriteRoom;
}

async function pickRoomEmailByPreference(freeRoomEmails, roomEmailsByPreference = []) {
  for (let i = 0; i < roomEmailsByPreference.length; i++) {
    const preferredRoom = roomEmailsByPreference[i];
    if (freeRoomEmails.includes(preferredRoom)) {
      return preferredRoom;
    }
  }

  // fall back onto user's historical room selection
  return await pickRoomBasedOnHistory(freeRoomEmails);
}

async function getAllRoomsFromCache() {
  const roomDicts = await getKeyFromLocal(FULL_ROOM_LIST_KEY, []);
  return roomDicts.map(dict => new Room({...dict}));
}

async function putAllRoomsIntoCache(rooms) {
  // converts room entity to key value pairs for easier serialization
  const roomDicts = rooms.map(room => room.toDict());
  return await persistPairLocal(FULL_ROOM_LIST_KEY, roomDicts);
}
