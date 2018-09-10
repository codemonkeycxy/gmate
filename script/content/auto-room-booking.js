// self-invoking function to avoid name collision
(() => {
  const MAX_FAV_ROOMS = 20;

  function registerFavoriteRooms() {
    const initialRooms = getSelectedRooms();
    addSaveListener(initialRooms);
  }

  function bookFavoriteRoom() {
    // room book criteria
    // 1) don't book for any meeting that already has a room
    // 2) don't book for any meeting that I don't own
    // 3) don't book any meeting that I don't need a room for

    const existingRooms = getSelectedRooms();
    if (!isEmpty(existingRooms)) {
      // 1) don't book for any meeting that already has a room
      // todo: consider to differentiate action vs no action
      return sendFinishMessage(NO_ROOM_TO_SELECT);
    }

    if (isEdit()) {
      if (!isMyMeeting() || !isRoomNeeded()) {
        // 2) don't book for any meeting that I don't own
        // 3) don't book any meeting that I don't need a room for
        return sendFinishMessage(NO_ROOM_TO_SELECT);
      }
    }

    clickRoomsTab();
    // wait for room tab to activate
    setTimeout(selectFromSuggestion, 500);
  }

  function clickRoomsTab() {
    const roomsTab = document.querySelectorAll('[aria-label="Rooms"]')[0];
    dispatchMouseEvent(roomsTab, "click", true, true);
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
    if (isLoadingRooms()) {
      // room suggestion is still loading, check again later
      return setTimeout(selectFromSuggestion, 500);
    }

    if (noRoomFound()) {
      return false;
    }

    const suggestedRooms = getSuggestedRooms();
    selectRoom(suggestedRooms, favRoom => {
      if (favRoom) {
        dispatchMouseEvent(favRoom, "click", true, true);
        sendFinishMessage(ROOM_SELECTED);
      } else {
        sendFinishMessage(NO_ROOM_TO_SELECT);
      }
      clickGuestsTab(); // switch back to guests tab after room booking
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

    getFromStorage({ "favorite-rooms": {} }, result => {
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

  function isLoadingRooms() {
    const loading = getElementByText("div", "Finding rooms").parentElement;
    const updating = getElementByText("div", "Updating room suggestions")
      .parentElement;

    return isElementVisible(loading) || isElementVisible(updating);
  }

  function noRoomFound() {
    const noRoom = getElementByText("div", "No rooms found.");
    return isElementVisible(noRoom);
  }

  function getSelectedRooms() {
    const selectedRoomListUI = document.querySelectorAll(
      '[aria-label="Rooms added to this event."]'
    )[0];
    if (!selectedRoomListUI || !selectedRoomListUI.children) {
      return;
    }

    const selectedRooms = {};
    for (let i = 0; i < selectedRoomListUI.children.length; i++) {
      const selectedRoom = selectedRoomListUI.children[i];
      const roomId = selectedRoom.getAttribute("data-id");
      const roomName = selectedRoom.getAttribute("aria-label");

      selectedRooms[roomId] = { id: roomId, name: roomName.trim() };
    }

    return selectedRooms;
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
    getFromStorage({ "favorite-rooms": {} }, result => {
      const favoriteRooms = result["favorite-rooms"];

      selectedRooms.forEach(room => {
        updateFavorabilityForOne(room, favoriteRooms);
      });

      console.log(favoriteRooms);
      persist({ "favorite-rooms": favoriteRooms });
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

  onMessage((msg, sender, sendResponse) => {
    if (msg.type === AUTO_ROOM_BOOKING) {
      // give page some time to load
      setTimeout(bookFavoriteRoom, 500);
    }

    if (msg.type === REGISTER_FAVORITE_ROOMS) {
      // give page some time to load
      setTimeout(registerFavoriteRooms, 500);
    }
  });
})();
