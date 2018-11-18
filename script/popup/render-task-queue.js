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
  const workerTabId = payload.data.workerTabId;
  const taskQueueUIGroup = document.getElementById(TASK_QUEUE_UI_GROUP);

  if (eventTasks.length === 0) {
    return taskQueueUIGroup.style.display = 'none';
  }

  taskQueueUIGroup.style.display = 'block';
  populateTasks(eventTasks);
  displayWorkerController(workerTabId);
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

function displayWorkerController(workerTabId) {
  const workerActiveUIGroup = document.getElementById(WORKER_ACTIVE_UI_GROUP);
  const workerStoppedUIGroup = document.getElementById(WORKER_STOPPED_UI_GROUP);

  workerActiveUIGroup.style.display = workerTabId ? 'block' : 'none';
  workerStoppedUIGroup.style.display = !workerTabId ? 'block' : 'none';
}