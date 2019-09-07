const ROOM_BOOKING_FILTER_POS_REGEX = "room-booking-filter-positive-1";
const ROOM_BOOKING_FILTER_NEG_REGEX = "room-booking-filter-negative";
const ROOM_BOOKING_FILTER_NEG_TEXT = "room-booking-filter-negative-text";

const DEFAULT_ROOM_BOOKING_FILTERS = {};
DEFAULT_ROOM_BOOKING_FILTERS[ROOM_BOOKING_FILTER_POS_REGEX] = '';
DEFAULT_ROOM_BOOKING_FILTERS[ROOM_BOOKING_FILTER_NEG_REGEX] = '';
DEFAULT_ROOM_BOOKING_FILTERS[ROOM_BOOKING_FILTER_NEG_TEXT] = '';


class Filters {
  constructor({posRegex, negRegex, negText, flexFilters}) {
    this.posRegex = posRegex || '';
    this.negRegex = negRegex || '';
    this.negText = negText || '';
    this.flexFilters = flexFilters || {};
  }

  setFlexFilter(key, val) {
    this.flexFilters[key] = val;
  }

  matchRoom(room) {
    const roomStr = room.name;
    let matchPosRegex = true;
    let matchNegRegex = false;
    let matchFlexFilter = true;

    if (this.posRegex) {
      const posRe = new RegExp(this.posRegex);
      // return if name matches with positive filter
      matchPosRegex = roomStr.match(posRe);
    }

    if (this.negRegex) {
      const negRe = new RegExp(this.negRegex);
      matchNegRegex = roomStr.match(negRe);
    }

    // todo: add negtext logic

    if (this.flexFilters) {
      matchFlexFilter = this._matchRoomByFlexFilters(room);
    }

    return matchPosRegex && !matchNegRegex && matchFlexFilter;
  }

  _matchRoomByFlexFilters(room) {
    const companyName = 'uber';  // hard code for now
    const filterSettings = COMPANY_SPECIFIC_FILTERS[companyName];

    return filterSettings.every(
      filterSetting => this._matchRoomByFlexFilterOne(room, filterSetting)
    );
  }

  _matchRoomByFlexFilterOne(room, filterSetting) {
    const storageKey = getRoomFilterStorageKey(filterSetting.key);
    const storageVal = this.flexFilters[storageKey];
    if (storageVal === ANY) {
      return true;
    }

    return filterSetting.match(room, storageVal);
  }

  // converts to key value pairs for easier serialization
  toDict() {
    return {
      posFilter: this.posRegex,
      negFilter: this.negRegex,
      negText: this.negText,
      flexFilters: this.flexFilters
    };
  }
}

Filters.fromDict = ({posFilter, negFilter, negText, flexFilters}) => {
  return new Filters({posRegex: posFilter, negRegex: negFilter, negText, flexFilters});
};

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
    posRegex: result[ROOM_BOOKING_FILTER_POS_REGEX],
    negRegex: result[ROOM_BOOKING_FILTER_NEG_REGEX],
    negText: result[ROOM_BOOKING_FILTER_NEG_TEXT],
    flexFilters: await getFlexRoomFilters()
  });
}

async function persistPosRegexFilter(posRegex) {
  await persistPairSync(ROOM_BOOKING_FILTER_POS_REGEX, posRegex);
}

async function persistNegRegexFilter(negRegex) {
  await persistPairSync(ROOM_BOOKING_FILTER_NEG_REGEX, negRegex);
}

async function persistNegTextFilter(negText) {
  await persistPairSync(ROOM_BOOKING_FILTER_NEG_TEXT, negText);
}

async function persistFlexFilter(key, val) {
  await persistPairSync(key, val);
}