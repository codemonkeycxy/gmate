function newGMateBtn(eventId, eventNameFetcher) {
  async function logBtnClick() {
    track(SEARCH_ROOM_BTN_CLICKED);
    await incrementSync(SEARCH_ROOM_BTN_CLICKED);
  }

  function registerRoomToBeFulfilled(eventId, eventName, eventFilters, bookRecurring) {
    sendMessage({
      type: ROOM_TO_BE_FULFILLED,
      data: {eventId, eventName, eventFilters: eventFilters.toDict(), bookRecurring}
    });
  }

  const gmateBtn = newButton(SEARCH_ROOM_BTN_MSG);
  const registeredTasks = newTaskDisplay();
  const wrapper = wrapUIComponents([gmateBtn, registeredTasks]);

  gmateBtn.id = GMATE_BTN_ID;
  gmateBtn.style.backgroundColor = '#4285f4';
  gmateBtn.style.color = '#fff';
  gmateBtn.style.height = '32px';
  gmateBtn.style.fontSize = '12px';
  gmateBtn.style.marginTop = '7px';
  gmateBtn.style.marginBottom = '4px';
  gmateBtn.style.paddingLeft = '12px';
  gmateBtn.style.paddingRight = '12px';

  if (isEmpty(eventId)) {
    gmateBtn.style.backgroundColor = '#cccccc';
    gmateBtn.style.color = '#666666';
    gmateBtn.addEventListener("click", () => alert(
      "Looks like this event hasn't been saved yet. Save the event and try again :)"
    ));

    return wrapper;
  }

  sendMessage({type: GET_TASKS_BY_EVENT_ID, data: {eventId}}, ({data: {eventTasks}}) => {
    if (isEmpty(eventTasks)) {
      return;
    }

    gmateBtn.style.backgroundColor = '#7CB342';
    gmateBtn.style.color = '#FFFFFF';
    eventTasks.forEach(eventTask => registeredTasks.pushTask(
      Filters.fromDict(eventTask.data.eventFilters)
    ));
  });

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
      registerRoomToBeFulfilled(eventId, eventNameFetcher(), eventFilters, bookRecurring);
      registeredTasks.pushTask(eventFilters);
    });
    insertBefore(modal, gmateBtn);

    show(modal);
  });

  return wrapper;
}

async function newGMateRow(eventId, eventNameFetcher) {
  const gmateRow = await loadHTMLElement('template/gmate-row.html');
  const btnWrapper = findChildById(gmateRow, 'gmate-btn-wrapper');
  const gmateBtn = newGMateBtn(eventId, eventNameFetcher);

  btnWrapper.appendChild(gmateBtn);

  return gmateRow;
}