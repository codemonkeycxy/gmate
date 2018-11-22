// self-invoking function to avoid name collision
(() => {
  const MAX_FAV_ROOMS = 20;

  function registerFavoriteRooms() {
    const initialRooms = getSelectedRooms();
    addSaveListener(initialRooms);
  }

  function bookFavoriteRoom(forceBookOnEdit) {
    if (!forceBookOnEdit && isEdit()) {
      // don't book on meeting edit unless forced otherwise
      return sendFinishMessage(NO_NEED_TO_BOOK);
    }

    getFromStorage(DEFAULT_ROOM_BOOKING_FILTERS, result => {
      const positiveFilter = result[ROOM_BOOKING_FILTER_POSITIVE];
      if (positiveFilter && hasMatchingRoom(positiveFilter)) {
        return sendFinishMessage(NO_NEED_TO_BOOK);
      }

      tryUntilPass(getRoomsTab, clickRoomsTab);
      // wait for room tab to activate
      tryUntilPass(() => isRoomSuggestionLoaded() && hasNoRoomFlag(), selectFromSuggestion);
    });
  }

  function hasMatchingRoom(positiveFilter) {
    const filter = new RegExp(positiveFilter);
    const selectedRooms = getSelectedRooms();

    for (let id in selectedRooms) {
      const room = selectedRooms[id];

      if (room.status !== DECLINED && room.name.match(filter)) {
        return true;
      }
    }

    return false;
  }

  function getRoomsTab() {
    return document.querySelectorAll('[aria-label="Rooms"]')[0];
  }

  function clickRoomsTab() {
    const roomsTab = getRoomsTab();
    dispatchMouseEvent(roomsTab, "click", true, true);
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

  function selectFromSuggestion() {
    if (noRoomFound()) {
      return false;
    }

    const suggestedRooms = getSuggestedRooms();
    selectRoom(suggestedRooms, favRoom => {
      if (favRoom) {
        dispatchMouseEvent(favRoom, "click", true, true);
        sendFinishMessage(ROOM_SELECTED);
      } else {
        sendFinishMessage(NO_ROOM_FOUND);
      }
      tryUntilPass(isGuestTabLoaded, clickGuestsTab); // switch back to guests tab after room booking
    });
  }

  function getSuggestedRooms() {
    const roomElements = getElementByText("div", "Updating room suggestions")
      .parentElement.nextSibling.children[0].children;

    // convert html element collection to standard array
    const roomList = [];
    for (let i = 0; i < roomElements.length; i++) {
      roomList.push(roomElements[i]);
    }

    return roomList;
  }

  function selectRoom(rooms, cb) {
    filterRooms(rooms, filteredRooms => {
      pickFavoriteRoom(filteredRooms, cb);
    });
  }

  function filterRooms(rooms, cb) {
    filterRoomByLegacyRegex(rooms, rooms =>
      getRoomFilterUserInputs(storedInput => {
        rooms = rooms.filter(room => {
          const roomName = room.getAttribute("data-name");
          return checkRoomEligibility(roomName, storedInput);
        });
        cb(rooms);
      })
    );
  }

  function filterRoomByLegacyRegex(rooms, cb) {
    getFromStorage(DEFAULT_ROOM_BOOKING_FILTERS, result => {
      const positiveFilter = result[ROOM_BOOKING_FILTER_POSITIVE];
      const negativeFilter = result[ROOM_BOOKING_FILTER_NEGATIVE];

      if (positiveFilter) {
        const posRe = new RegExp(positiveFilter);
        rooms = rooms.filter(room => {
          const roomName = room.getAttribute("data-name");
          // return if name matches with positive filter
          return roomName && roomName.match(posRe);
        });
      }

      if (negativeFilter) {
        const negRe = new RegExp(negativeFilter);
        rooms = rooms.filter(room => {
          const roomName = room.getAttribute("data-name");
          // DON'T return if name matches with negative filter
          return roomName && !roomName.match(negRe);
        });
      }

      cb(rooms);
    });
  }

  function pickFavoriteRoom(rooms, cb) {
    let favoriteRoom;
    let favorability = -1;

    getFromStorage({"favorite-rooms": {}}, result => {
      const favRooms = result["favorite-rooms"];
      rooms.forEach(candidate => {
        const candidateId = candidate.getAttribute("data-email");
        if (!favRooms[candidateId]) {
          return;
        }

        const currFav = favRooms[candidateId].count;
        if (candidateId in favRooms && currFav > favorability) {
          favoriteRoom = candidate;
          favorability = currFav;
        }
      });

      if (!favoriteRoom && rooms.length > 0) {
        // if can't find a favorite room based on historical data, randomly pick one from the list
        favoriteRoom = rooms[0];
      }
      cb(favoriteRoom);
    });
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

      selectedRooms[roomId] = {
        id: roomId,
        name: roomName.trim().replace(', Attending', '').replace(', Declined', ''),
        status: getRoomStatus(roomName)
      };
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

    saveBtn.addEventListener("click", e => {
      const finalRooms = getSelectedRooms();
      const selectedRooms = [];

      for (let id in finalRooms) {
        if (finalRooms.hasOwnProperty(id) && !initialRooms.hasOwnProperty(id)) {
          // if a room appears in the final list but not in the initial list, it is actively selected by user
          selectedRooms.push(finalRooms[id]);
        }
      }

      if (selectedRooms.length > 0) {
        updateFavorability(selectedRooms);
      }
    });
  }

  function updateFavorability(selectedRooms) {
    getFromStorage({"favorite-rooms": {}}, result => {
      const favoriteRooms = result["favorite-rooms"];
      selectedRooms.forEach(room => updateFavorabilityForOne(room, favoriteRooms));

      persist({"favorite-rooms": favoriteRooms});
    });
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

  onMessage((msg, sender, sendResponse) => {
    if (msg.type === AUTO_ROOM_BOOKING) {
      const forceBookOnEdit = msg.options && msg.options.forceBookOnEdit;
      tryUntilPass(isRoomTabLoaded, () => bookFavoriteRoom(forceBookOnEdit));
    }

    if (msg.type === REGISTER_FAVORITE_ROOMS) {
      tryUntilPass(isRoomTabLoaded, registerFavoriteRooms);
    }
  });
})();
