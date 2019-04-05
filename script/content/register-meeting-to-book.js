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
    const eventDetails = getEventDetails();

    // insert gmate row after the location row
    const locationRow = eventDetails.children[0];
    // to keep the style consistent, copy the location row as a template for the gmate row
    const gmateRow = locationRow.cloneNode(true);
    insertAfter(gmateRow, locationRow);

    // reset the row icon
    const oldIcon = gmateRow.children[0].getElementsByTagName('span')[0];
    const icon = newIcon("fa fa-group");
    icon.style.webkitTextFillColor = 'slategray';
    icon.style.paddingLeft = '2px';
    oldIcon.parentElement.replaceChild(icon, oldIcon);

    // reset the row content
    const needRoomButton = newButton();
    needRoomButton.setText("Find a room with GMate");
    needRoomButton.style.backgroundColor = 'rgb(45, 140, 255)';
    needRoomButton.style.color = '#fff';
    needRoomButton.style.height = '32px';
    needRoomButton.style.fontSize = '12px';
    needRoomButton.style.marginTop = '7px';
    needRoomButton.style.marginBottom = '4px';
    needRoomButton.style.paddingLeft = '12px';
    needRoomButton.style.paddingRight = '12px';
    gmateRow.replaceChild(needRoomButton, gmateRow.children[1]);

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
          needRoomButton.style.backgroundColor = '#7CB342';
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

  function getEventDetails() {
    return document.querySelectorAll('[id="tabEventDetails"]')[0];
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
      await tryUntilPass(() => getEventDetails() && getSaveButton());
      addNeedRoomListener();
    }
  });
})();
