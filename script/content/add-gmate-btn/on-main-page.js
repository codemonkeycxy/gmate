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
    // if (e.detail !== 1) {
    //   return;  // ignore double click
    // }

    // if (!await tryUntilPass(getDialog, {sleepMs: 20, countdown: 50, suppressError: true, immediate: false})) {
    //   return;
    // }
    //
    const dialog = getDialog();
    if (getChildById(dialog, GMATE_BTN_ID)) {
      return;
    }

    insertSearchRoomBtn(dialog);
  }

  if (/calendar.google.com/g.test(window.location.host)) {
    const callback = function (mutationsList, observer) {
      // Use traditional 'for loops' for IE 11
      for (let mutation of mutationsList) {
        const target = mutation.target;
        if (target.hasAttribute('role') && target.getAttribute('role') === 'dialog') {
          if (mutation.addedNodes.length > 0) {
            handleMeetingCreationClick();
          }
        }
      }
    };
    const observer = new MutationObserver(callback);
    observer.observe(document, {attributes: true, childList: true, subtree: true});
  }
})();
