// self-invoking function to avoid name collision
(() => {
  const NO_ID_YET = 'no-id-yet';
  let eventIdToFulfill = null;
  let eventFilters = {};
  let eventName = '';

  function addNeedRoomListener() {
    renderINeedARoomBtn();
    listenToEventNameChange();
    listenToEventSave();
  }

  function renderINeedARoomBtn() {
    const locationInput = getLocationInput();
    const needRoomButton = document.createElement('button');
    needRoomButton.textContent = "I need a room";
    needRoomButton.style.background = '#4285f4';
    needRoomButton.style.color = '#fff';

    insertAfter(needRoomButton, locationInput);
    needRoomButton.addEventListener("click", async () => {
      const modal = renderModal(
        await asyncRenderRoomBookingFilters(noop()),
        'Select the filters you want to apply',
        () => {
          eventIdToFulfill = getEventId() || NO_ID_YET;
          needRoomButton.style.background = '#7CB342';
          needRoomButton.style.color = '#FFFFFF';
        }
      );
      insertBefore(modal, document.body.firstChild);
      show(modal);
    });
  }

  function listenToEventNameChange() {
    const titleInput = document.querySelectorAll('[aria-label="Title"]')[0];
    eventName = titleInput.value;  // record initial title value
    titleInput.addEventListener('input', e => eventName = e.target.value);
  }

  function listenToEventSave() {
    const saveBtn = getSaveButton();
    saveBtn.addEventListener("click", onSave);
  }

  async function onSave() {
    if (!eventIdToFulfill) {
      // no op if there's no event to fulfill
      return;
    }

    if (eventIdToFulfill !== NO_ID_YET) {
      // the page already carries a valid event id, we are done
      return await registerRoomToBeFulfilled(eventIdToFulfill, eventName);
    }

    await tryUntilPass(isMainCalendarPage, sendFinishMessage);
  }

  async function sendFinishMessage() {
    // todo: use meeting time as a second differentiator
    const eventIds = getEventIdByName(eventName);
    if (eventIds.length !== 1) {
      return chrome.runtime.sendMessage({
        type: ROOM_TO_BE_FULFILLED_FAILURE,
        data: {
          eventIds: eventIds,
          eventName: eventName
        }
      });
    }

    return await registerRoomToBeFulfilled(eventIds[0], eventName);
  }

  function getLocationInput() {
    return document.querySelectorAll('[aria-label="Location"]')[0];
  }

  async function registerRoomToBeFulfilled(eventId, eventName) {
    chrome.runtime.sendMessage({
      type: ROOM_TO_BE_FULFILLED,
      data: {
        eventId: eventId,
        eventName: eventName,
        eventFilters: await getRoomFilters()
      }
    });
  }

  function resetGlobal() {
    eventIdToFulfill = null;
    eventFilters = {};
    eventName = '';
  }

  onMessage(async (msg, sender, sendResponse) => {
    if (msg.type === REGISTER_MEETING_TO_BOOK) {
      // todo: (maybe) bug: button disappears on page refresh (due to leavingEventPage logic)
      resetGlobal();
      await tryUntilPass(
        () => getLocationInput() && getSaveButton(),
        addNeedRoomListener
      )
    }
  });
})();
