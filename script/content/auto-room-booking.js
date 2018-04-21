// self-invoking function to avoid name collision
(function autoRoomBooking() {
  var MAX_FAV = 20;

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

      if (Object.keys(favoriteRooms).length >= MAX_FAV) {
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
      setTimeout(registerFavoriteRooms, 500);
    }
  });

  if (document.URL.startsWith('https://calendar.google.com/calendar/r/eventedit')) {
    setTimeout(registerFavoriteRooms, 500);
  }
}());
