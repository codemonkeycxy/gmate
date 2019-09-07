// self-invoking function to avoid name collision
(() => {
  const NO_ID_YET = 'no-id-yet';
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

    searchRoomBtn.addEventListener("click", async () => {
      await logBtnClick();
      searchRoomBtn.showSpinner();
      const token = await promptAuth();  // block until user gives permission
      searchRoomBtn.hideSpinner();
      if (!token) {
        // if the user refuses to give auth, can't let them continue
        return;
      }

      globals.eventFilters = await getRoomFilters();
      const modal = renderModal(
        await renderModelBody(),
        'Select the filters you want to apply',
        () => {
          globals.eventIdToFulfill = getEventId() || NO_ID_YET;
          searchRoomBtn.style.backgroundColor = '#7CB342';
          searchRoomBtn.style.color = '#FFFFFF';
        }
      );
      insertBefore(modal, document.body.firstChild);
      show(modal);
    });
  }

  async function renderModelBody() {
    const filterUI = await asyncRenderRoomBookingFilters(
      val => globals.eventFilters.posRegex = val,
      val => globals.eventFilters.negRegex = val,
      val => globals.eventFilters.negTexts = val,
      (key, val) => globals.eventFilters.setFlexFilter(key, val),
    );
    const bookRecurringCheckbox = renderCheckbox(
      'apply to recurring meetings (GMate will try to maximize consistent rooms)',
      false,
      value => globals.bookRecurring = value,
      RIGHT
    );

    return wrapUIComponents([filterUI, renderDivider(), bookRecurringCheckbox]);
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

    if (globals.eventIdToFulfill !== NO_ID_YET) {
      // the page already carries a valid event id, we are done
      return registerRoomToBeFulfilled(globals.eventIdToFulfill, globals.eventName);
    }

    await tryUntilPass(isMainCalendarPage);
    sendFinishMessage();
  }

  function sendFinishMessage() {
    // todo: use meeting time as a second differentiator
    const eventIds = getEventIdByName(globals.eventName);
    if (eventIds.length !== 1) {
      return chrome.runtime.sendMessage({
        type: ROOM_TO_BE_FULFILLED_FAILURE,
        data: {
          eventIds: eventIds,
          eventName: globals.eventName
        }
      });
    }

    return registerRoomToBeFulfilled(eventIds[0], globals.eventName);
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
        eventFilters: globals.eventFilters.toDict(),
        bookRecurring: globals.bookRecurring,
      }
    });
  }

  function resetGlobal() {
    globals = {
      eventIdToFulfill: null,
      eventFilters: new Filters({}),
      eventName: '',
      bookRecurring: false,
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
