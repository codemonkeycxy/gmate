const COMPANY_SPECIFIC_FILTERS = {
  uber: UBER_ROOM_FILTERS,
};

// gResource - google api resource defined here: https://developers.google.com/admin-sdk/directory/v1/reference/resources/calendars
function extractRoomCapacity(gResource) {
  if (gResource.resourceEmail && gResource.resourceEmail.includes('uber')) {
    return extractUberRoomCapacity(gResource);
  }
}