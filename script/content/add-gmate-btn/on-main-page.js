// self-invoking function to avoid name collision
(() => {
  function getDialog() {
    return getElementByAttr('div', 'role', 'dialog');
  }

  function isMeetingEditingDialog(dialog) {
    const meetingSummary = getChildById(dialog, 'xDtlDlgCt');
    return !isEmpty(meetingSummary);
  }

  function getEditEventInfoRows(dialog) {
    try {
      const meetingSummary = getChildById(dialog, 'xDtlDlgCt');
      return meetingSummary.children;
    } catch (e) {
      throw GMateError("can't find edit event options", {err: e.message});
    }
  }

  function insertSearchRoomBtn(dialog) {
    const gmateRow = newGMateBtn('123');

    // if (isMeetingCreationDialog(dialog)) {
    //   const eventOptionRows = getCreateEventOptions(dialog);
    //   // insert gmate row after the last row
    //   const lastRow = eventOptionRows[eventOptionRows.length - 1];
    //   insertAfter(gmateRow, lastRow);
    //   return gmateRow;
    // }

    if (isMeetingEditingDialog(dialog)) {
      const eventInfoRows = getEditEventInfoRows(dialog);
      // insert gmate row after the first row
      const firstRow = eventInfoRows[0];
      insertAfter(gmateRow, firstRow);
      return gmateRow;
    }
  }

  function handleMeetingCreationClick() {
    const dialog = getDialog();
    if (!dialog) {
      return;
    }

    if (getChildById(dialog, GMATE_BTN_ID)) {
      return;
    }

    insertSearchRoomBtn(dialog);
  }

  if (/calendar.google.com/g.test(window.location.host)) {
    const observer = new MutationObserver(handleMeetingCreationClick);
    observer.observe(document, {
      attributes: true,
      childList: true,
      subtree: true
    });
  }
})();
