// self-invoking function to avoid name collision
(function autoRoomBooking() {
  var MAX_FAV_ROOMS = 20;

  function main() {
    registerFavoriteRooms();
    chrome.storage.sync.get(DEFAULT_FEATURE_TOGGLES, function (settings) {
      if (settings[AUTO_ROOM_BOOKING]) {
        triggerAction();
      }
    });
  }

  function triggerAction() {
    var existingRooms = getSelectedRooms();
    if (isEdit() || !isEmpty(existingRooms)) {
      // the user is trying to edit an existing meeting; don't auto book room in this case
      return;
    }

    clickRoomsTab();
    // wait for room tab to activate
    setTimeout(selectFromSuggestion, 500);
  }

  function clickRoomsTab() {
    var roomsTab = document.querySelectorAll('[aria-label="Rooms"]')[0];
    dispatchMouseEvent(roomsTab, 'click', true, true);
  }

  function clickGuestsTab() {
    var roomsTab = document.querySelectorAll('[aria-label="Guests"]')[0];
    dispatchMouseEvent(roomsTab, 'click', true, true);
  }

  function selectFromSuggestion() {
    if (isLoadingRooms()) {
      // room suggestion is still loading, check again later
      return setTimeout(selectFromSuggestion, 500);
    }

    if (noRoomFound()) {
      return false;
    }

    var suggestedRooms = getSuggestedRooms();
    selectRoom(suggestedRooms, function (favRoom) {
      if (favRoom) {
        dispatchMouseEvent(favRoom, 'click', true, true);
      }
      clickGuestsTab();  // switch back to guests tab after room booking
    });
  }

  function getSuggestedRooms() {
    var roomElements = getElementByText(
      'div', 'Updating room suggestions'
    ).parentElement.nextSibling.children[0].children;

    // convert html element collection to standard array
    var roomList = [];
    for (var i = 0; i < roomElements.length; i++) {
      roomList.push(roomElements[i]);
    }

    return roomList;
  }

  function selectRoom(rooms, cb) {
    filterRooms(rooms, function (filteredRooms) {
      pickFavoriteRoom(filteredRooms, cb);
    });
  }

  function filterRooms(rooms, cb) {
    chrome.storage.sync.get(DEFAULT_ROOM_BOOKING_FILTERS, function (result) {
      var positiveFilter = result[ROOM_BOOKING_FILTER_POSITIVE];
      var negativeFilter = result[ROOM_BOOKING_FILTER_NEGATIVE];

      if (positiveFilter) {
        var posRe = new RegExp(positiveFilter);
        rooms = rooms.filter(function (room) {
          var roomName = room.getAttribute('data-name');
          // return if name matches with positive filter
          return roomName && roomName.match(posRe);
        });
      }

      if (negativeFilter) {
        var negRe = new RegExp(negativeFilter);
        rooms = rooms.filter(function (room) {
          var roomName = room.getAttribute('data-name');
          // DON'T return if name matches with negative filter
          return roomName && !roomName.match(negRe);
        });
      }

      cb(rooms);
    });
  }

  function pickFavoriteRoom(rooms, cb) {
    var favoriteRoom;
    var favorability = -1;

    chrome.storage.sync.get({'favorite-rooms': {}}, function (result) {
      var favRooms = result['favorite-rooms'];
      rooms.forEach(function (candidate) {
        var candidateId = candidate.getAttribute('data-email');
        if (!favRooms[candidateId]) {
          return;
        }

        var currFav = favRooms[candidateId].count;
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
    var loading = getElementByText('div', 'Finding rooms').parentElement;
    var updating = getElementByText('div', 'Updating room suggestions').parentElement;

    return isElementVisible(loading) || isElementVisible(updating);
  }

  function noRoomFound() {
    var noRoom = getElementByText('div', 'No rooms found.');
    return isElementVisible(noRoom);
  }

  function registerFavoriteRooms() {
    var initialRooms = getSelectedRooms();
    addSaveListener(initialRooms);
  }

  function getSelectedRooms() {
    var selectedRoomListUI = document.querySelectorAll('[aria-label="Rooms added to this event."]')[0];
    if (!selectedRoomListUI || !selectedRoomListUI.children) {
      return;
    }

    var selectedRooms = {};
    for (var i = 0; i < selectedRoomListUI.children.length; i++) {
      var selectedRoom = selectedRoomListUI.children[i];
      var roomId = selectedRoom.getAttribute('data-id');
      var roomName = selectedRoom.getAttribute('aria-label');

      selectedRooms[roomId] = {id: roomId, name: roomName.trim()};
    }

    return selectedRooms;
  }

  function addSaveListener(initialRooms) {
    var saveBtn = document.querySelectorAll('[aria-label="Save"]')[0];
    if (!saveBtn) {
      return;
    }

    saveBtn.addEventListener("click", function (e) {
      var finalRooms = getSelectedRooms();
      var selectedRooms = [];

      for (var id in finalRooms) {
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
    chrome.storage.sync.get({'favorite-rooms': {}}, function (result) {
      var favoriteRooms = result['favorite-rooms'];

      selectedRooms.forEach(function (room) {
        updateFavorabilityForOne(room, favoriteRooms);
      });

      chrome.storage.sync.set({'favorite-rooms': favoriteRooms});
    });
  }

  function updateFavorabilityForOne(newRoom, favoriteRooms) {
    var newRoomId = newRoom.id;

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
        var LRUKey = findTheMostKey(favoriteRooms, function (oldestItemSoFar, currItem) {
          return oldestItemSoFar.updatedAt < currItem.updatedAt;
        });

        delete favoriteRooms[LRUKey];
      }
    }
  }

  chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (msg.type === 'event_edit') {
      // give page some time to load
      setTimeout(main, 500);
    }
  });

  if (document.URL.startsWith('https://calendar.google.com/calendar/r/eventedit')) {
    setTimeout(main, 500);
  }
}());
