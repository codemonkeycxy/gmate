const COMPANY_SPECIFIC_FILTERS = {
  uber: UBER_ROOM_FILTERS,
};

// gResource - google api resource defined here: https://developers.google.com/admin-sdk/directory/v1/reference/resources/calendars
function extractRoomFloor(gResource) {
  try {
    if (isUberRoom(gResource)) {
      return extractUberRoomFloor(gResource);
    }
  } catch (e) {
    GMateError('extract room floor error', {
      err: e.message,
      desc: gResource.resourceDescription,
      name: gResource.generatedResourceName
    })
  }
}

// gResource - google api resource defined here: https://developers.google.com/admin-sdk/directory/v1/reference/resources/calendars
function extractRoomCapacity(gResource) {
  try {
    if (isUberRoom(gResource)) {
      return extractUberRoomCapacity(gResource);
    }
  } catch (e) {
    GMateError('extract room capacity error', {
      err: e.message,
      desc: gResource.resourceDescription,
      name: gResource.generatedResourceName
    })
  }
}

// gResource - google api resource defined here: https://developers.google.com/admin-sdk/directory/v1/reference/resources/calendars
function extractRoomFeatures(gResource) {
  try {
    if (isUberRoom(gResource)) {
      return extractUberRoomFeatures(gResource);
    }
  } catch (e) {
    GMateError('extract room features error', {
      err: e.message,
      desc: gResource.resourceDescription,
      name: gResource.generatedResourceName
    })
  }
}

function toFilterSummary(flexFilters) {
  if (Object.keys(flexFilters).some(filterKey => filterKey.includes('uber'))) {
    return toUberFilterSummary(flexFilters);
  }

  return '';
}