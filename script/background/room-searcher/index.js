async function refreshFullRoomList() {
  console.log('refreshing full room list...');
  const rooms = await CalendarAPI.getAllRooms();
  if (isEmpty(rooms)) {
    throw GMateError("received empty full room list from API");
  }

  console.log(`saving ${rooms.length} rooms to local storage...`);
  await persistPairLocal(FULL_ROOM_LIST_KEY, rooms);

  return rooms;
}

async function getFullRoomList() {
  const rooms = await getKeyFromLocal(FULL_ROOM_LIST_KEY, []);
  if (!isEmpty(rooms)) {
    return rooms;
  }

  return await refreshFullRoomList();
}