// self-invoking function to avoid name collision
(() => {
  const MAX_FAV_ROOMS = 20;

  function registerFavoriteRooms() {
    const initialRooms = getSelectedRooms();
    addSaveListener(initialRooms);
  }

  async function bookFavoriteRoom(filters) {
    if (isEdit()) {
      // only auto book for new events
      return;
    }

    const selectedRooms = Object.values(getSelectedRooms());
    const matchingRooms = await filterRooms(selectedRooms, filters);
    if (!isEmpty(matchingRooms)) {
      // a qualified room is already booked
      return;
    }

    let countdown = 20;
    while (countdown > 0) {
      if (noRoomFound()) {
        return;  // no room to select, early return
      }

      let {roomList, roomIdToElement} = getRoomOptions();
      const filteredRooms = await filterRooms(roomList, filters);
      const selectedRoomEmail = await pickRoomBasedOnHistory(filteredRooms.map(room => room.id));

      if (selectedRoomEmail) {
        return dispatchMouseEvent(roomIdToElement[selectedRoomEmail], "click", true, true);
      }

      // can't find a room, sleep a little bit and look again because more rooms might have been loaded by then
      await sleep(500);
      countdown--;
    }
  }

  function isRoomTabLoaded() {
    return !!getElementByText('span', 'Rooms');
  }

  function getNoRoomFlag() {
    return getElementByText("div", "No rooms found.");
  }

  function hasNoRoomFlag() {
    // I occasionally run into situations that getNoRoomFlag returns me a result but it doesn't have the "style"
    // attribute, which further checks rely on down the line. So I'm forced to create this function as a prerequisite
    const flag = getNoRoomFlag();
    return flag && flag.hasAttribute('style');
  }

  function noRoomFound() {
    const noRoom = getNoRoomFlag();
    return hasNoRoomFlag() && isElementVisible(noRoom);
  }

  function getRoomOptions() {
    const roomElements = getSuggestedRooms();
    // convert html element collection to standard array
    const roomList = [];
    const roomIdToElement = {};
    roomElements.forEach(roomElement => {
      const roomId = roomElement.getAttribute("data-email");
      const roomName = roomElement.getAttribute("data-name");
      if (!roomId || !roomName) {
        return;
      }

      roomList.push(buildRoom(roomId, roomName));
      roomIdToElement[roomId] = roomElement;
    });

    return {
      roomList: roomList,
      roomIdToElement: roomIdToElement
    };
  }

  function getSuggestedRooms() {
    let rooms = [];
    const result = [];

    // in case room suggestion UI is not loaded
    try {
      rooms = getElementByText("div", "Updating room suggestions").parentElement.nextSibling.children[0].children;
    } catch (e) {
      return result;
    }

    // convert nodelist, htmlcollection, etc into generic array
    // https://stackoverflow.com/questions/15763358/difference-between-htmlcollection-nodelists-and-arrays-of-objects
    for (let i = 0; i < rooms.length; i++) {
      result.push(rooms[i]);
    }

    return result;
  }

  async function filterRooms(rooms, filters) {
    const roomDicts = rooms.filter(room => room.status !== DECLINED);
    const allRooms = await getAllRoomsFromCache();
    if (isEmpty(allRooms)) {
      // this happens when a user first installs GMate and the full room list hasn't been populated yet
      return [];
    }

    return roomDicts.filter(dict => {
      const roomEntity = allRooms.find(room => room.email === dict.id);
      if (!roomEntity) {
        GMateError("room email not found", {email: dict.id, name: dict.name});
        return false;
      }

      return filters.matchRoom(roomEntity);
    });
  }

  function getSelectedRooms() {
    const selectedRoomListUI = document.querySelectorAll(
      '[aria-label="Rooms added to this event."]'
    )[0];
    if (!selectedRoomListUI || !selectedRoomListUI.children) {
      return {};
    }

    const selectedRooms = {};
    for (let i = 0; i < selectedRoomListUI.children.length; i++) {
      const selectedRoom = selectedRoomListUI.children[i];
      const roomId = selectedRoom.getAttribute("data-id");
      const roomName = selectedRoom.getAttribute("aria-label");
      if (!roomId || !roomName) {
        continue;
      }

      selectedRooms[roomId] = buildRoom(
        roomId,
        roomName.trim().replace(', Attending', '').replace(', Declined', ''),
        getRoomStatus(roomName)
      );
    }

    return selectedRooms;
  }

  function getRoomStatus(roomName) {
    if (roomName.includes('Attending')) {
      return ACCEPTED;
    }

    if (roomName.includes('Declined')) {
      return DECLINED;
    }

    return UNKNOWN;
  }

  function addSaveListener(initialRooms) {
    const saveBtn = document.querySelectorAll('[aria-label="Save"]')[0];
    if (!saveBtn) {
      return;
    }

    saveBtn.addEventListener("click", async e => {
      const finalRooms = getSelectedRooms();
      const selectedRooms = [];

      for (let id in finalRooms) {
        if (finalRooms.hasOwnProperty(id) && !initialRooms.hasOwnProperty(id)) {
          // if a room appears in the final list but not in the initial list, it is actively selected by user
          selectedRooms.push(finalRooms[id]);
        }
      }

      if (selectedRooms.length > 0) {
        await updateFavorability(selectedRooms);
      }
    });
  }

  async function updateFavorability(selectedRooms) {
    const favoriteRooms = await getKeyFromSync(FAVORITE_ROOMS, {});
    selectedRooms.forEach(room => updateFavorabilityForOne(room, favoriteRooms));

    await persistPairSync(FAVORITE_ROOMS, favoriteRooms);
  }

  function updateFavorabilityForOne(newRoom, favoriteRooms) {
    const newRoomId = newRoom.id;

    if (favoriteRooms.hasOwnProperty(newRoomId)) {
      favoriteRooms[newRoomId].count += 1;
      favoriteRooms[newRoomId].updatedAt = Date.now();
    } else {
      favoriteRooms[newRoomId] = {
        id: newRoom.id,
        name: newRoom.name,
        count: 1,
        updatedAt: Date.now()
      };

      if (Object.keys(favoriteRooms).length >= MAX_FAV_ROOMS) {
        // too many records, evict the least recently updated entry
        const LRUKey = findTheMostKey(favoriteRooms, (
          oldestItemSoFar,
          currItem
        ) => oldestItemSoFar.updatedAt < currItem.updatedAt);

        delete favoriteRooms[LRUKey];
      }
    }
  }

  function buildRoom(id, name, status) {
    return {
      id: id,
      name: name,
      status: status ? status : UNKNOWN
    }
  }

  onMessage(async (msg, sender, sendResponse) => {
    if (msg.type === AUTO_ROOM_BOOKING) {
      await tryUntilPass(isRoomTabLoaded);
      await bookFavoriteRoom(await getRoomFilters());
    }

    if (msg.type === REGISTER_FAVORITE_ROOMS) {
      await tryUntilPass(isRoomTabLoaded);
      registerFavoriteRooms();
    }
  });
})();
