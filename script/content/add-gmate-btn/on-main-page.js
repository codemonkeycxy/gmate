// self-invoking function to avoid name collision
(() => {
  function isDialogAdded(mutationRecords) {
    return mutationRecords.some(record => {
      if (record.addedNodes.length === 0) {
        return false;
      }

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
      if (record.addedNodes.length === 0 || record.removedNodes.length === 0) {
        return false;
      }

      let addedDialog = false;
      let removedDialog = false;
      for (let i = 0; i < record.addedNodes.length; i++) {
        const addedNode = record.addedNodes[i];
        if (addedNode.id === 'xDetDlg') {
          addedDialog = true;
        }
      }
      for (let i = 0; i < record.removedNodes.length; i++) {
        const removedNode = record.removedNodes[i];
        if (removedNode.id === 'xDetDlg') {
          removedDialog = true;
        }
      }

      return addedDialog && removedDialog;
    });
  }

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

  async function insertGMateRow() {
    const dialog = getDialog();
    if (!dialog) {
      return;
    }

    if (getChildById(dialog, GMATE_BTN_ID)) {
      return;
    }

    const gmateRow = await newGMateRow('123', noop());
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

  async function handleNodeAddition(mutationRecords) {
    if (isDialogAdded(mutationRecords) || isDialogReplaced(mutationRecords)) {
      await insertGMateRow();
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
