// self-invoking function to avoid name collision
(() => {
  const NO_ID_YET = 'no-id-yet';
  let globals = {};

  function addNeedRoomListener() {
    renderSearchRoomBtn();
    listenToEventSave();
  }

  async function logBtnClick() {
    track(SEARCH_ROOM_BTN_CLICKED);
    await incrementSync(SEARCH_ROOM_BTN_CLICKED);
  }

  async function sanitizeFilters() {
    const roomCandidateCnt = await getRoomCandidateCnt(globals.eventFilters);
    if (roomCandidateCnt === 0) {
      alert('Your filters match no rooms \n\nUsually this is caused by incorrect regex filters (under "Advanced Filters"). \nTry to remove them and use the basic filters instead \n\nIf the problem persists, email gmate.hotline@gmail.com for help');
      return false;
    }

    return true;
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
        sanitizeFilters,
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
      async val => globals.eventFilters.posRegex = val,
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
    const userFeedback = await loadHTMLElement('template/user-feedback.html');

    return wrapUIComponents([filterUI, renderDivider(), bookRecurringCheckbox, userFeedback]);
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

  function getTitleInput() {
    try {
      return document.querySelectorAll('[aria-label="Title"]')[0];
    } catch (e) {
      throw GMateError("can't find title input", {err: e.message});
    }
  }

  function listenToEventSave() {
    const saveBtn = getSaveButton();
    saveBtn.addEventListener("click", onSave);
  }

  async function onSave() {
    const eventName = getTitleInput().value;
    if (!globals.eventIdToFulfill) {
      // no op if there's no event to fulfill
      return;
    }

    if (globals.eventIdToFulfill !== NO_ID_YET) {
      // the page already carries a valid event id, we are done
      return registerRoomToBeFulfilled(globals.eventIdToFulfill, eventName);
    }

    await tryUntilPass(isMainCalendarPage);
    sendFinishMessage(eventName);
  }

  function sendFinishMessage(eventName) {
    // todo: use meeting time as a second differentiator
    const eventIds = getEventIdByName(eventName);
    if (eventIds.length !== 1) {
      return chrome.runtime.sendMessage({
        type: ROOM_TO_BE_FULFILLED_FAILURE,
        data: {eventIds, eventName}
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
        eventFilters: globals.eventFilters.toDict(),
        bookRecurring: globals.bookRecurring,
      }
    });
  }

  function resetGlobal() {
    globals = {
      eventIdToFulfill: null,
      eventFilters: new Filters({}),
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
