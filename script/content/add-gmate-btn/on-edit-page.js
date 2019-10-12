// self-invoking function to avoid name collision
(() => {
  let globals = {};

  function addNeedRoomListener() {
    renderSearchRoomBtn();
    listenToEventNameChange();
    listenToEventSave();
  }

  async function logBtnClick() {
    track(SEARCH_ROOM_BTN_CLICKED);
    await incrementSync(SEARCH_ROOM_BTN_CLICKED);
  }

  function renderSearchRoomBtn() {
    const searchRoomBtn = insertSearchRoomBtn();
    if (isEmpty(getEventId())) {
      searchRoomBtn.style.backgroundColor = '#cccccc';
      searchRoomBtn.style.color = '#666666';
      searchRoomBtn.addEventListener("click", () => alert(
        "Looks like this event hasn't been saved yet. Save the event and try again :)"
      ));
      return;
    }

    searchRoomBtn.addEventListener("click", async () => {
      await logBtnClick();
      searchRoomBtn.showSpinner();
      const token = await promptAuth();  // block until user gives permission
      searchRoomBtn.hideSpinner();
      if (!token) {
        // if the user refuses to give auth, can't let them continue
        return;
      }

      const modal = await getStatefulRoomBookingModal(() => {
        globals.eventIdToFulfill = getEventId();
        searchRoomBtn.style.backgroundColor = '#7CB342';
        searchRoomBtn.style.color = '#FFFFFF';
      });
      insertBefore(modal, document.body.firstChild);
      globals.modal = modal;

      show(modal);
    });
  }

  function insertSearchRoomBtn() {
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
    const needRoomButton = newButton(SEARCH_ROOM_BTN_MSG);
    needRoomButton.style.backgroundColor = '#4285f4';
    needRoomButton.style.color = '#fff';
    needRoomButton.style.height = '32px';
    needRoomButton.style.fontSize = '12px';
    needRoomButton.style.marginTop = '7px';
    needRoomButton.style.marginBottom = '4px';
    needRoomButton.style.paddingLeft = '12px';
    needRoomButton.style.paddingRight = '12px';
    gmateRow.replaceChild(needRoomButton, gmateRow.children[1]);

    return needRoomButton;
  }

  function listenToEventNameChange() {
    const titleInput = document.querySelectorAll('[aria-label="Title"]')[0];
    globals.eventName = titleInput.value;  // record initial title value
    titleInput.addEventListener('input', e => globals.eventName = e.target.value);
  }

  function listenToEventSave() {
    const saveBtn = getSaveButton();
    saveBtn.addEventListener("click", onSave);
  }

  async function onSave() {
    if (!globals.eventIdToFulfill) {
      // no op if there's no event to fulfill
      return;
    }

    return registerRoomToBeFulfilled(globals.eventIdToFulfill, globals.eventName);
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
        eventFilters: globals.modal.getInputs().eventFilters.toDict(),
        bookRecurring: globals.modal.getInputs().bookRecurring,
      }
    });
  }

  function resetGlobal() {
    globals = {
      eventIdToFulfill: null,
      eventName: '',
      modal: null,
    };
  }

  onMessage(async (msg, sender, sendResponse) => {
    if (msg.type === REGISTER_MEETING_TO_BOOK) {
      // todo: bug: button disappears on page refresh (due to leavingEventPage logic)
      resetGlobal();
      await tryUntilPass(() => getEventDetails() && getSaveButton());
      addNeedRoomListener();
    }
  });
})();
