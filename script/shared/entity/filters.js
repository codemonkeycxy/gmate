const ROOM_BOOKING_FILTER_POSITIVE = "room-booking-filter-positive-1";
const ROOM_BOOKING_FILTER_NEGATIVE = "room-booking-filter-negative";

const DEFAULT_ROOM_BOOKING_FILTERS = {};
DEFAULT_ROOM_BOOKING_FILTERS[ROOM_BOOKING_FILTER_POSITIVE] = "";
DEFAULT_ROOM_BOOKING_FILTERS[ROOM_BOOKING_FILTER_NEGATIVE] = "";

class Filters {
  constructor({posFilter, negFilter, flexFilters}) {
    this.posFilter = posFilter;
    this.negFilter = negFilter;
    this.flexFilters = flexFilters;
  }

  // converts key value pairs for easier serialization
  toDict() {
    return {
      posFilter: this.posFilter,
      negFilter: this.negFilter,
      flexFilters: this.flexFilters,
    };
  }
}

function getRoomFilterStorageKey(filterKey) {
  return `room-booking-filter-${'uber'}-${filterKey}`;
}

/**
 * Flex filters are room filters that are flexibly defined on a per company basis.
 * See examples from the COMPANY_SPECIFIC_FILTERS
 */
async function getFlexRoomFilters() {
  const companyName = 'uber';  // hard code for now
  const filterSettings = COMPANY_SPECIFIC_FILTERS[companyName];
  const storageKeys = {};
  filterSettings.forEach(setting => storageKeys[getRoomFilterStorageKey(setting.key)] = setting.default);

  return await getFromSync(storageKeys);
}

async function getRoomFilters() {
  const result = await getFromSync(DEFAULT_ROOM_BOOKING_FILTERS);

  return new Filters({
    posFilter: result[ROOM_BOOKING_FILTER_POSITIVE],
    negFilter: result[ROOM_BOOKING_FILTER_NEGATIVE],
    flexFilters: await getFlexRoomFilters()
  }).toDict();
}

async function persistPosFilter(posFilter) {
  await persistPairSync(ROOM_BOOKING_FILTER_POSITIVE, posFilter);
}

async function persistNegFilter(negFilter) {
  await persistPairSync(ROOM_BOOKING_FILTER_NEGATIVE, negFilter);
}

async function persistFlexFilter(key, val) {
  await persistPairSync(key, val);
}