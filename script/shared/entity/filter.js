const ROOM_BOOKING_FILTER_POS_REGEX = "room-booking-filter-positive-1";
const ROOM_BOOKING_FILTER_NEG_REGEX = "room-booking-filter-negative";

const DEFAULT_ROOM_BOOKING_FILTERS = {};
DEFAULT_ROOM_BOOKING_FILTERS[ROOM_BOOKING_FILTER_POS_REGEX] = "";
DEFAULT_ROOM_BOOKING_FILTERS[ROOM_BOOKING_FILTER_NEG_REGEX] = "";

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

  return {
    posFilter: result[ROOM_BOOKING_FILTER_POS_REGEX],
    negFilter: result[ROOM_BOOKING_FILTER_NEG_REGEX],
    flexFilters: await getFlexRoomFilters()
  };
}

async function persistPosRegexFilter(posRegex) {
  await persistPairSync(ROOM_BOOKING_FILTER_POS_REGEX, posRegex);
}

async function persistNegRegexFilter(negRegex) {
  await persistPairSync(ROOM_BOOKING_FILTER_NEG_REGEX, negRegex);
}

async function persistFlexFilter(key, val) {
  await persistPairSync(key, val);
}