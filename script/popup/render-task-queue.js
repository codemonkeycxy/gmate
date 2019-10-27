// self-invoking function to avoid name collision
(() => {
  const TASK_QUEUE_UI_GROUP = "task-queue-ui-group";
  const TO_BE_FULFILLED_QUEUE = "to-be-fulfilled-queue";

  renderTaskQueueUI();
  setInterval(renderTaskQueueUI, 500);  // periodically refresh the UI

  function renderTaskQueueUI() {
    sendMessage({type: GET_QUEUE}, injectTaskQueueUI);
  }

  function removeTask(taskId) {
    sendMessage({
        type: REMOVE_TASK,
        data: {
          taskId: taskId
        }
    }, injectTaskQueueUI);
  }

  function openRoomRadar(task) {
    sendMessage({
      type: ROOM_RADAR,
      data: {
        eventId: task.data.eventId,
        eventName: task.data.eventName,
        eventFilters: task.data.eventFilters
      }
    });
  }

  function injectTaskQueueUI(payload) {
    const {currentTask, pendingTasks} = payload.data.eventTasks;
    const taskQueueUIGroup = document.getElementById(TASK_QUEUE_UI_GROUP);

    if (!currentTask && pendingTasks.length === 0) {
      return hide(taskQueueUIGroup);
    }

    show(taskQueueUIGroup);
    populateTasks(currentTask, pendingTasks);
  }

  async function logBtnClick() {
    track(ROOM_RADAR_BTN_CLICKED);
    await incrementSync(ROOM_RADAR_BTN_CLICKED);
  }

  function renderTaskRow(task, action) {
    const lockBtn = htmlToElement(`<i class="fa fa-lock"></i>`);

    const delBtn = htmlToElement(`<i class="fa fa-trash"></i>`);
    delBtn.onclick = () => removeTask(task.id);

    const handshakeBtn = htmlToElement(`<i class="fa fa-handshake-o"></i>`);
    handshakeBtn.onclick = async () => {
      await logBtnClick();
      openRoomRadar(task);
    };

    const item = document.createElement('li');
    item.appendChild(htmlToElement(`<a href="${EDIT_PAGE_URL_PREFIX}/${task.data.eventId}" target="_blank">${task.data.eventName}</a>`));
    item.appendChild(htmlToElement('&nbsp;'));
    item.appendChild(handshakeBtn);
    item.appendChild(htmlToElement('&nbsp;&nbsp;'));
    item.appendChild(action === 'lock' ? lockBtn : delBtn);

    return item;
  }

  function populateTasks(currentTask, pendingTasks) {
    const taskUI = document.getElementById(TO_BE_FULFILLED_QUEUE);

    taskUI.innerHTML = '';  // wipe out the existing UI
    if (currentTask) {
      taskUI.appendChild(renderTaskRow(currentTask, 'lock'));
    }
    taskUI.appendChild(wrapUIComponents(pendingTasks.map(task => renderTaskRow(task, 'removable'))));
  }
})();