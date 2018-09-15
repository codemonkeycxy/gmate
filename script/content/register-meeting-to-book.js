// self-invoking function to avoid name collision
(() => {
  let eventToFulfill = null;

  function addNeedRoomListener() {
    const locationInput = getLocationInput();
    const needRoomButton = document.createElement('button');

    needRoomButton.textContent = "I need a room";
    insertAfter(needRoomButton, locationInput);
    needRoomButton.addEventListener("click", () => eventToFulfill = getEventId() || 'no id yet');
  }

  function getLocationInput() {
    return document.querySelectorAll('[aria-label="Location"]')[0];
  }

  function registerRoomToBeFulfilled() {
    chrome.runtime.sendMessage({
      type: ROOM_TO_BE_FULFILLED,
      data: {
        eventId: getEventId(),
        eventName: getEventName()
      }
    });
  }

  onMessage((msg, sender, sendResponse) => {
    if (msg.type === REGISTER_MEETING_TO_BOOK) {
      // todo: (maybe) bug: button disappears on page refresh (due to leavingEventPage logic)
      tryUntilPass(getLocationInput, addNeedRoomListener)
    }
  });
})();
