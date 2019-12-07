// self-invoking function to avoid name collision
(() => {
  function getDialog() {
    return getElementByAttr('div', 'role', 'dialog');
  }

  function isMeetingEditingDialog(dialog) {
    const meetingSummary = getElementById(dialog, 'xDtlDlgCt');
    return !isEmpty(meetingSummary);
  }

  function getEditEventInfoRows(dialog) {
    try {
      const meetingSummary = getElementById(dialog, 'xDtlDlgCt');
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
    // if (document.getElementById(GMATE_BTN_ID)) {
    //   return;
    // }

    insertSearchRoomBtn(dialog);
  }

  onMessage(async (msg, sender, sendResponse) => {
    if (msg.type === ADD_GMATE_BTN_MAIN_PAGE) {
      const callback = function(mutationsList, observer) {
        // Use traditional 'for loops' for IE 11
        for(let mutation of mutationsList) {
          const target = mutation.target;
          if (target.hasAttribute('role') && target.getAttribute('role') === 'dialog') {
            console.log(target);
          }
        }
      };
      const observer = new MutationObserver(callback);
      observer.observe(document, {attributes: true, childList: true, subtree: true});
    }
  });
})();
