async function getStatefulRoomBookingModal(onConfirm) {
  const inputs = {
    eventFilters: await getRoomFilters(),
    bookRecurring: false,
  };

  async function sanitizeFilters() {
    const roomCandidateCnt = await getRoomCandidateCnt(inputs.eventFilters);
    if (roomCandidateCnt === 0) {
      alert('Your filters match no rooms \n\nUsually this is caused by incorrect regex filters (under "Advanced Filters"). \nTry to remove them and use the basic filters instead \n\nIf the problem persists, email gmate.hotline@gmail.com for help');
      return false;
    }

    return true;
  }

  async function renderModelBody() {
    const filterUI = await asyncRenderRoomBookingFilters(
      async val => inputs.eventFilters.posRegex = val,
      val => inputs.eventFilters.negRegex = val,
      val => inputs.eventFilters.negTexts = val,
      (key, val) => inputs.eventFilters.setFlexFilter(key, val),
    );
    const bookRecurringCheckbox = renderCheckbox(
      'apply to recurring meetings (GMate will try to maximize consistent rooms)',
      false,
      value => inputs.bookRecurring = value,
      RIGHT
    );
    const userFeedback = await loadHTMLElement('template/user-feedback.html');

    return wrapUIComponents([filterUI, renderDivider(), bookRecurringCheckbox, userFeedback]);
  }


  return renderModal(
    await renderModelBody(),
    'Select the filters you want to apply',
    () => sanitizeFilters(inputs.eventFilters),
    () => onConfirm(inputs.eventFilters, inputs.bookRecurring)
  );
}