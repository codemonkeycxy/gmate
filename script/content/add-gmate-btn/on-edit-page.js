// self-invoking function to avoid name collision
(() => {
  function addNeedRoomListener() {
    renderSearchRoomBtn();
  }

  async function logBtnClick() {
    track(SEARCH_ROOM_BTN_CLICKED);
    await incrementSync(SEARCH_ROOM_BTN_CLICKED);
  }

  function renderSearchRoomBtn() {
    const {gmateBtn, registeredTasks} = insertSearchRoomBtn();
    if (isEmpty(getEventId())) {
      gmateBtn.style.backgroundColor = '#cccccc';
      gmateBtn.style.color = '#666666';
      gmateBtn.addEventListener("click", () => alert(
        "Looks like this event hasn't been saved yet. Save the event and try again :)"
      ));
      return;
    }

    gmateBtn.addEventListener("click", async () => {
      await logBtnClick();
      gmateBtn.showSpinner();
      const token = await promptAuth();  // block until user gives permission
      gmateBtn.hideSpinner();
      if (!token) {
        // if the user refuses to give auth, can't let them continue
        return;
      }

      const modal = await getStatefulRoomBookingModal((eventFilters, bookRecurring) => {
        registerRoomToBeFulfilled(getEventId(), getEventName(), eventFilters, bookRecurring);
        registeredTasks.pushTask(eventFilters);
      });
      insertBefore(modal, document.body.firstChild);

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
    const gmateBtn = newButton(SEARCH_ROOM_BTN_MSG);
    gmateBtn.style.backgroundColor = '#4285f4';
    gmateBtn.style.color = '#fff';
    gmateBtn.style.height = '32px';
    gmateBtn.style.fontSize = '12px';
    gmateBtn.style.marginTop = '7px';
    gmateBtn.style.marginBottom = '4px';
    gmateBtn.style.paddingLeft = '12px';
    gmateBtn.style.paddingRight = '12px';

    const registeredTasks = newTaskDisplay();
    gmateRow.replaceChild(wrapUIComponents([gmateBtn, registeredTasks]), gmateRow.children[1]);

    return {gmateBtn, registeredTasks};
  }

  function getEventName() {
    try {
      return document.querySelectorAll('[aria-label="Title"]')[0].value;
    } catch (e) {
      throw GMateError("can't find title input", {err: e.message});
    }
  }

  function getEventDetails() {
    return document.querySelectorAll('[id="tabEventDetails"]')[0];
  }

  function registerRoomToBeFulfilled(eventId, eventName, eventFilters, bookRecurring) {
    chrome.runtime.sendMessage({
      type: ROOM_TO_BE_FULFILLED,
      data: {eventId, eventName, eventFilters: eventFilters.toDict(), bookRecurring}
    });
  }

  onMessage(async (msg, sender, sendResponse) => {
    if (msg.type === REGISTER_MEETING_TO_BOOK) {
      // todo: bug: button disappears on page refresh (due to leavingEventPage logic)
      await tryUntilPass(() => getEventDetails());
      addNeedRoomListener();
    }
  });
})();
