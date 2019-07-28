const COMPANY_SPECIFIC_FILTERS = {
  uber: UBER_ROOM_FILTERS,
};

// gResource - google api resource defined here: https://developers.google.com/admin-sdk/directory/v1/reference/resources/calendars
function extractRoomCapacity(gResource) {
  if (isUberRoom(gResource)) {
    return extractUberRoomCapacity(gResource);
  }
}

// gResource - google api resource defined here: https://developers.google.com/admin-sdk/directory/v1/reference/resources/calendars
function extractRoomFeatures(gResource) {
  if (isUberRoom(gResource)) {
    return extractUberRoomFeatures(gResource);
  }
}