// self-invoking function to avoid name collision
(function autoRoomBooking() {
  var MAX_FAV_ROOMS = 20;
  var MIN_FAV_SCORE = 1;

  function main() {
    registerFavoriteRooms();
    chrome.storage.sync.get(DEFAULT_SETTINGS, function (settings) {
      if (settings[AUTO_ROOM_BOOKING]) {
        triggerAction();
      }
    });
  }

  function triggerAction() {
    var existingRooms = getSelectedRooms();
    if (hasInvitee() || !isEmpty(existingRooms)) {
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

    var suggestedRooms = getElementByText(
      'div', 'Updating room suggestions'
    ).parentElement.nextSibling.children[0].children;
    pickFavoriteRoom(suggestedRooms);
  }

  function pickFavoriteRoom(roomElements) {
    var favoriteRoom;
    var favorability = -1;

    chrome.storage.sync.get({'favorite-rooms': {}}, function (result) {
      var rooms = result['favorite-rooms'];
      for (var i = 0; i < roomElements.length; i++) {
        var candidate = roomElements[i];
        var candidateId = candidate.getAttribute('data-email');
        if (!rooms[candidateId]) {
          continue;
        }

        var currFav = rooms[candidateId].count;
        if (candidateId in rooms && currFav > MIN_FAV_SCORE && currFav > favorability) {
          favoriteRoom = candidate;
          favorability = currFav;
        }
      }

      if (favoriteRoom) {
        dispatchMouseEvent(favoriteRoom, 'click', true, true);
        clickGuestsTab();  // switch back to guests tab after room booking
      }
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

      console.log(favoriteRooms);
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
    if (msg.text === 'event_edit') {
      // give page some time to load
      setTimeout(main, 500);
    }
  });

  if (document.URL.startsWith('https://calendar.google.com/calendar/r/eventedit')) {
    setTimeout(main, 500);
  }
}());
