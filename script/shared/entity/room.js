class Room extends Attendee {
  constructor({email, status, name, floor, capacity, features}) {
    super({email, status});

    this.name = name;
    this.floor = floor;
    this.capacity = capacity;
    this.features = features;
  }

  // converts to key value pairs for easier serialization
  toDict() {
    return {
      email: this.email,
      name: this.name,
      floor: this.floor,
      capacity: this.capacity,
      features: this.features,
    };
  }
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
