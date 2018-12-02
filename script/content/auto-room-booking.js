// self-invoking function to avoid name collision
(() => {
  const MAX_FAV_ROOMS = 20;

  function registerFavoriteRooms() {
    const initialRooms = getSelectedRooms();
    addSaveListener(initialRooms);
  }

  async function bookFavoriteRoom(forceBookOnEdit) {
    if (!forceBookOnEdit && isEdit()) {
      // don't book on meeting edit unless forced otherwise
      return sendFinishMessage(NO_NEED_TO_BOOK);
    }

    const selectedRooms = Object.values(getSelectedRooms());
    const matchingRooms = await filterRooms(selectedRooms);

    if (!isEmpty(matchingRooms)) {
      return sendFinishMessage(NO_NEED_TO_BOOK);
    }

    await tryUntilPass(getRoomsTab, clickRoomsTab);
    // tryUntilPass(getSearchInput, enterPrimingString);
    // wait for room tab to activate
    await tryUntilPass(
      () => isRoomSuggestionLoaded() && hasNoRoomFlag(),
      async () => await selectFromSuggestion()
    );
  }

  function getRoomsTab() {
    return document.querySelectorAll('[aria-label="Rooms"]')[0];
  }

  function clickRoomsTab() {
    const roomsTab = getRoomsTab();
    dispatchMouseEvent(roomsTab, "click", true, true);
  }

  function getSearchInput() {
    return document.querySelectorAll('[aria-label="Filter rooms and resources by name"]')[0];
  }

  function enterPrimingString() {
    const input = getSearchInput();
    dispatchTextEvent(input, '1455');
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
    return isElementVisible(noRoom);
  }

  function isGuestTabLoaded() {
    return !!document.querySelectorAll('[aria-label="Guests"]')[0];
  }

  function clickGuestsTab() {
    const guestTab = document.querySelectorAll('[aria-label="Guests"]')[0];
    dispatchMouseEvent(guestTab, "click", true, true);
  }

  function sendFinishMessage(eventType) {
    chrome.runtime.sendMessage({
      type: eventType,
      data: {
        eventId: getEventId()
      }
    });
  }

  async function selectFromSuggestion() {
    if (noRoomFound()) {
      return false;
    }

    const {roomList, roomIdToElement} = getSuggestedRooms();
    const filteredRooms = await filterRooms(roomList);
    const selectedRoom = await pickFavoriteRoom(filteredRooms);

    if (selectedRoom) {
      dispatchMouseEvent(roomIdToElement[selectedRoom.id], "click", true, true);
      sendFinishMessage(ROOM_SELECTED);
    } else {
      sendFinishMessage(NO_ROOM_FOUND);
    }
    await tryUntilPass(isGuestTabLoaded, clickGuestsTab); // switch back to guests tab after room booking
  }

  function getSuggestedRooms() {
    const roomElements = getElementByText(
      "div", "Updating room suggestions"
    ).parentElement.nextSibling.children[0].children;

    // convert html element collection to standard array
    const roomList = [];
    const roomIdToElement = {};
    for (let i = 0; i < roomElements.length; i++) {
      const roomElement = roomElements[i];
      const roomId = roomElement.getAttribute("data-email");
      const roomName = roomElement.getAttribute("data-name");

      roomList.push(buildRoom(roomId, roomName));
      roomIdToElement[roomId] = roomElement;
    }

    return {
      roomList: roomList,
      roomIdToElement: roomIdToElement
    };
  }

  async function filterRooms(rooms) {
    const result = await getFromStorage(DEFAULT_ROOM_BOOKING_FILTERS);
    const posFilter = result[ROOM_BOOKING_FILTER_POSITIVE];
    const negFilter = result[ROOM_BOOKING_FILTER_NEGATIVE];
    const flexFilters = await getRoomFilterUserInputs();

    rooms = rooms.filter(room => room.status !== DECLINED);

    if (posFilter) {
      const posRe = new RegExp(posFilter);
      // return if name matches with positive filter
      rooms = rooms.filter(room => room.name && room.name.match(posRe));
    }

    if (negFilter) {
      const negRe = new RegExp(negFilter);
      // DON'T return if name matches with negative filter
      rooms = rooms.filter(room => room.name && !room.name.match(negRe));
    }

    if (flexFilters) {
      rooms = rooms.filter(room => checkRoomEligibility(room.name, flexFilters));
    }

    return rooms;
  }

  async function pickFavoriteRoom(rooms) {
    const result = await getFromStorage({"favorite-rooms": {}});
    const favRooms = result["favorite-rooms"];
    let favoriteRoom;
    let favorability = -1;

    rooms.forEach(candidate => {
      if (!favRooms[candidate.id]) {
        return;
      }

      const currFav = favRooms[candidate.id].count;
      if (candidate.id in favRooms && currFav > favorability) {
        favoriteRoom = candidate;
        favorability = currFav;
      }
    });

    if (!favoriteRoom && rooms.length > 0) {
      // if can't find a favorite room based on historical data, randomly pick one from the list
      favoriteRoom = rooms[0];
    }

    return favoriteRoom;
  }

  function isRoomSuggestionLoaded() {
    try {
      const loading = getElementByText("div", "Finding rooms").parentElement;
      const updating = getElementByText("div", "Updating room suggestions").parentElement;
      return !isElementVisible(loading) && !isElementVisible(updating);
    } catch (e) {
      // in case elements are not found
      return false;
    }
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
    const result = await getFromStorage({"favorite-rooms": {}});
    const favoriteRooms = result["favorite-rooms"];
    selectedRooms.forEach(room => updateFavorabilityForOne(room, favoriteRooms));

    persist({"favorite-rooms": favoriteRooms});
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

  function isRoomTabLoaded() {
    return !!getElementByText('span', 'Rooms');
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
      const forceBookOnEdit = msg.options && msg.options.forceBookOnEdit;
      await tryUntilPass(isRoomTabLoaded, async () => await bookFavoriteRoom(forceBookOnEdit));
    }

    if (msg.type === REGISTER_FAVORITE_ROOMS) {
      await tryUntilPass(isRoomTabLoaded, registerFavoriteRooms);
    }
  });
})();
