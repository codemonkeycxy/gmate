// self-invoking function to avoid name collision
(() => {
  const TASK_QUEUE_UI_GROUP = "task-queue-ui-group";
  const TO_BE_FULFILLED_QUEUE = "to-be-fulfilled-queue";

  renderTaskQueueUI();
  setInterval(renderTaskQueueUI, 500);  // periodically refresh the UI

  function renderTaskQueueUI() {
    chrome.runtime.sendMessage(null, {type: GET_QUEUE}, null, injectTaskQueueUI);
  }

  function removeTask(taskId) {
    chrome.runtime.sendMessage(null, {
      type: REMOVE_TASK,
      data: {
        taskId: taskId
      }
    }, null, injectTaskQueueUI);
  }

  function openRoomRadar(task) {
    chrome.runtime.sendMessage(null, {
      type: ROOM_RADAR,
      data: {
        eventId: task.data.eventId,
        eventName: task.data.eventName,
        eventFilters: task.data.eventFilters
      }
    });
  }

  function injectTaskQueueUI(payload) {
    const eventTasks = payload.data.eventTasks;
    const taskQueueUIGroup = document.getElementById(TASK_QUEUE_UI_GROUP);

    if (eventTasks.length === 0) {
      return hide(taskQueueUIGroup);
    }

    show(taskQueueUIGroup);
    populateTasks(eventTasks);
  }

  async function logBtnClick() {
    track(ROOM_RADAR_BTN_CLICKED);
    await incrementSync(ROOM_RADAR_BTN_CLICKED);
  }

  function populateTasks(eventTasks) {
    const taskUI = document.getElementById(TO_BE_FULFILLED_QUEUE);

    taskUI.innerHTML = '';  // wipe out the existing UI
    taskUI.appendChild(wrapUIComponents(eventTasks.map(task => {
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
      item.appendChild(delBtn);

      return item;
    })));
  }
})();