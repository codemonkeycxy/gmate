class Filters {
  constructor({posFilter, negFilter, flexFilters}) {
    this.posFilter = posFilter;
    this.negFilter = negFilter;
    this.flexFilter = flexFilters;
  }
}

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