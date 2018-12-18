// self-invoking function to avoid name collision
(() => {
  const NO_ID_YET = 'no-id-yet';
  let eventIdToFulfill = null;
  let eventName = '';

  async function addNeedRoomListener() {
    renderINeedARoomBtn();
    await renderRoomFilterModal();
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
    needRoomButton.addEventListener("click", () => {
      eventIdToFulfill = getEventId() || NO_ID_YET;
      needRoomButton.style.background = '#7CB342';
      needRoomButton.style.color = '#FFFFFF';
      notify('The magic shall be made!', 'Save this meeting and we will work on booking a room for you in the background');
    });
  }

  async function renderRoomFilterModal() {
    const modal = renderModal(await asyncRenderRoomBookingFilters(noop()));
    modal.style.display = "block";
    insertBefore(modal, document.body.firstChild);
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
