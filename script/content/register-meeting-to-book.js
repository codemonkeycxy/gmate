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
    const needRoomButton = newButton();
    needRoomButton.setText("I need a room");
    needRoomButton.setBackgroundColor('#4285f4');
    needRoomButton.setTextColor('#fff');
    insertAfter(needRoomButton, locationInput);

    needRoomButton.addEventListener("click", async () => {
      needRoomButton.showSpinner();
      const token = await promptAuth();  // block until user gives permission
      needRoomButton.hideSpinner();
      if (!token) {
        // if the user refuses to give auth, can't let them continue
        return;
      }
      const {posFilter, negFilter, flexFilters} = await getRoomFilters();
      eventFilters = {
        [ROOM_BOOKING_FILTER_POSITIVE]: posFilter,
        [ROOM_BOOKING_FILTER_NEGATIVE]: negFilter,
        ...flexFilters
      };

      const modal = renderModal(
        await asyncRenderRoomBookingFilters((key, val) => (eventFilters[key] = val)),
        'Select the filters you want to apply',
        () => {
          eventIdToFulfill = getEventId() || NO_ID_YET;
          needRoomButton.setBackgroundColor('#7CB342');
          needRoomButton.setTextColor('#FFFFFF');
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

    await tryUntilPass(isMainCalendarPage);
    sendFinishMessage();
  }

  function sendFinishMessage() {
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

    return registerRoomToBeFulfilled(eventIds[0], eventName);
  }

  function getLocationInput() {
    return document.querySelectorAll('[aria-label="Location"]')[0];
  }

  function registerRoomToBeFulfilled(eventId, eventName) {
    chrome.runtime.sendMessage({
      type: ROOM_TO_BE_FULFILLED,
      data: {
        eventId: eventId,
        eventName: eventName,
        eventFilters: {
          posFilter: eventFilters[ROOM_BOOKING_FILTER_POSITIVE],
          negFilter: eventFilters[ROOM_BOOKING_FILTER_NEGATIVE],
          flexFilters: eventFilters
        },
        bookRecurring: false
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
      await tryUntilPass(() => getLocationInput() && getSaveButton());
      addNeedRoomListener();
    }
  });
})();
