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

  function renderSearchRoomBtn(eventId) {
    // insert gmate row after the location row
    const locationRow = getLocationRow();
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
    gmateRow.replaceChild(newGMateBtn(eventId), gmateRow.children[1]);
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

  onMessage(async (msg, sender, sendResponse) => {
    if (msg.type === REGISTER_MEETING_TO_BOOK) {
      // todo: bug: button disappears on page refresh (due to leavingEventPage logic)
      await tryUntilPass(() => getEventDetails());
      renderSearchRoomBtn(getEventId());
    }
  });
})();
