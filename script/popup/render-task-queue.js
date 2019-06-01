// self-invoking function to avoid name collision
(() => {
  const TASK_QUEUE_UI_GROUP = "task-queue-ui-group";
  const TO_BE_FULFILLED_QUEUE = "to-be-fulfilled-queue";

  renderTaskQueueUI();
  setInterval(renderTaskQueueUI, 500);  // periodically refresh the UI

  function renderTaskQueueUI() {
    chrome.runtime.sendMessage(null, {type: GET_QUEUE}, null, injectTaskQueueUI);
  }

  function addTaskRemovalListener() {
    const trashes = document.getElementsByClassName('fa fa-trash');
    for (let i = 0; i < trashes.length; i++) {
      const trash = trashes[i];
      trash.addEventListener("click", () => removeTask(parseInt(trash.getAttribute('data-id'))));
    }
  }

  function removeTask(taskId) {
    chrome.runtime.sendMessage(null, {
      type: REMOVE_TASK,
      data: {
        taskId: taskId
      }
    }, null, injectTaskQueueUI);
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

  function populateTasks(eventTasks) {
    document.getElementById(TO_BE_FULFILLED_QUEUE).innerHTML = `${
      eventTasks.map(
        task => `<li><a href="${EDIT_PAGE_URL_PREFIX}/${task.data.eventId}" target="_blank">${
          task.data.eventName
          }</a>&nbsp;<i data-id=${task.id} class="fa fa-trash"></i></li>`
      ).join('')
      }`;

    addTaskRemovalListener();
  }
})();