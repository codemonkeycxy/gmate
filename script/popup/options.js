const port = chrome.extension.connect({
  name: "long-lived pipe"
});

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

// Saves options to chrome.storage
function setOption(settingName, value) {
  const newSetting = {};
  newSetting[settingName] = value;
  persist(newSetting);
}

// Restores feature toggle values using the preferences stored in chrome.storage
function restoreOptions() {
  // fill out saved feature toggles. use default if nothing is found
  getFromStorage(DEFAULT_FEATURE_TOGGLES, settings =>
    Object.keys(DEFAULT_FEATURE_TOGGLES).forEach(key => document.getElementById(key).checked = settings[key])
  );

  // fill out saved room booking filters. use default if nothing is found
  getFromStorage(DEFAULT_ROOM_BOOKING_FILTERS, settings =>
    Object.keys(DEFAULT_ROOM_BOOKING_FILTERS).forEach(key => document.getElementById(key).value = settings[key])
  );
}

function startWorker() {
  port.postMessage({
    type: START_WORKER
  });
}

function stopWorker() {
  port.postMessage({
    type: STOP_WORKER
  });
}

document.addEventListener("DOMContentLoaded", restoreOptions);

// add feature toggle click listener
Object.keys(DEFAULT_FEATURE_TOGGLES).forEach(key =>
  document.getElementById(key).addEventListener("click", e => setOption(key, e.target.checked))
);

// add filter input listener
Object.keys(DEFAULT_ROOM_BOOKING_FILTERS).forEach(key =>
  document.getElementById(key).addEventListener("input", e => setOption(key, e.target.value))
);

// add worker controller buttons
document.getElementById(START_WORKER).onclick = startWorker;
document.getElementById(STOP_WORKER).onclick = stopWorker;