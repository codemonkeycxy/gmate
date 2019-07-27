const COMPANY_SPECIFIC_FILTERS = {
  uber: UBER_ROOM_FILTERS,
};

function extractRoomCapacity(roomName, roomEmail) {
  if (roomEmail && roomEmail.includes('uber')) {
    return extractUberRoomCapacity(roomName);
  }
}