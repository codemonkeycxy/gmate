// self-invoking function to avoid name collision
(() => {
  function getLocationRow() {
    const eventDetails = getEventDetails();

    for (let i = 0; i < eventDetails.children.length; i++) {
      const row = eventDetails.children[i];

      if (!isEmpty(row.querySelectorAll('[aria-label="Location"]'))) {
        return row;
      }
    }

    return eventDetails.children[0];
  }

  async function renderSearchRoomBtn() {
    const locationRow = getLocationRow();
    const gmateRow = await newGMateRow(getEventId(), getEventName);

    // insert gmate row after the location row
    insertAfter(gmateRow, locationRow);
  }

  function getEventDetails() {
    return document.querySelectorAll('[id="tabEventDetails"]')[0];
  }

  function getEventName() {
    try {
      return document.querySelectorAll('[aria-label="Title"]')[0].value;
    } catch (e) {
      throw GMateError("can't find title input", {err: e.message});
    }
  }

  onMessage(async (msg, sender, sendResponse) => {
    if (msg.type === ADD_GMATE_BTN_EDIT_PAGE) {
      // todo: bug: button disappears on page refresh (due to leavingEventPage logic)
      await tryUntilPass(() => getEventDetails());
      await renderSearchRoomBtn();
    }
  });
})();
