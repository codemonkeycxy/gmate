// self-invoking function to avoid name collision
(() => {
  const DIALOG_ID = 'xDetDlg';
  const EVENT_NAME_ID = 'rAECCd';
  const DIALOG_CONTENT_ID = 'xDtlDlgCt';

  function isDialogAdded(mutationRecords) {
    return mutationRecords.some(record => {
      for (let i = 0; i < record.addedNodes.length; i++) {
        const addedNode = record.addedNodes[i];
        if (addedNode.className === 'aZpV8b iWO5td') {
          return true;
        }
      }

      return false;
    });
  }

  function isDialogReplaced(mutationRecords) {
    return mutationRecords.some(record => {
      let addedDialog = false;
      let removedDialog = false;

      for (let i = 0; i < record.addedNodes.length; i++) {
        const addedNode = record.addedNodes[i];
        if (addedNode.id === DIALOG_ID) {
          addedDialog = true;
        }
      }
      for (let j = 0; j < record.removedNodes.length; j++) {
        const removedNode = record.removedNodes[j];
        if (removedNode.id === DIALOG_ID) {
          removedDialog = true;
        }
      }

      return addedDialog && removedDialog;
    });
  }

  function isGMateBtnRemoved(mutationRecords) {
    return mutationRecords.some(record => {
      for (let i = 0; i < record.removedNodes.length; i++) {
        const removedNode = record.removedNodes[i];
        const innerHtml = removedNode.innerHTML;

        if (innerHtml && innerHtml.includes(GMATE_BTN_ID)) {
          return true;
        }
      }

      return false;
    });
  }

  function isMeetingEditingDialog(dialog) {
    const meetingSummary = getChildById(dialog, DIALOG_CONTENT_ID);
    return !isEmpty(meetingSummary);
  }

  function getEditEventInfoRows(dialog) {
    try {
      const meetingSummary = getChildById(dialog, DIALOG_CONTENT_ID);
      return meetingSummary.children;
    } catch (e) {
      throw GMateError("can't find edit event options", {err: e.message});
    }
  }

  async function insertGMateRow() {
    const dialog = document.getElementById(DIALOG_ID);
    if (!dialog) {
      return;
    }

    if (getChildById(dialog, GMATE_BTN_ID)) {
      return;
    }

    // if (isMeetingCreationDialog(dialog)) {
    //   const eventOptionRows = getCreateEventOptions(dialog);
    //   // insert gmate row after the last row
    //   const lastRow = eventOptionRows[eventOptionRows.length - 1];
    //   insertAfter(gmateRow, lastRow);
    //   return gmateRow;
    // }

    if (isMeetingEditingDialog(dialog)) {
      const eventNameUI = getChildById(dialog, EVENT_NAME_ID);
      const eventName = eventNameUI && eventNameUI.innerText || 'meeting';
      const eventId = dialog.getAttribute('data-eventid');
      const gmateRow = await newGMateRow(eventId, () => eventName);

      const eventInfoRows = getEditEventInfoRows(dialog);
      // insert gmate row after the first row
      const firstRow = eventInfoRows[0];
      insertAfter(gmateRow, firstRow);
    }
  }

  async function handleNodeAddition(mutationRecords) {
    try {
      if (isDialogAdded(mutationRecords) || isDialogReplaced(mutationRecords) || isGMateBtnRemoved(mutationRecords)) {
        await insertGMateRow();
      }
    } catch (e) {
      GMateError('gmate-row-err-main-page', {err: e.message});
    }
  }

  if (/calendar.google.com/g.test(window.location.host)) {
    const nodeAdditionObserver = new MutationObserver(handleNodeAddition);
    nodeAdditionObserver.observe(document, {
      attributes: false,
      childList: true,
      subtree: true
    });
  }
})();
