// todo: study this useful link and possibly fetch more matching rooms
// https://www.quora.com/How-can-you-restore-the-Google-Calendar-prompt-when-you-change-time-zones

/* ==================== Global Variables ======================= */
let toBeFulfilled, workerTabId, currentTask, taskVersion, lastActiveTs;
loadGlobalVariables();

function saveGlobalVariables() {
  const snapshot = {
    toBeFulfilled: toBeFulfilled,
    workerTabId: workerTabId,
    currentTask: currentTask,
    taskVersion: taskVersion,
    lastActiveTs: lastActiveTs
  };
  console.log(`taking a snapshot of the current global variables ${JSON.stringify(snapshot)}`);
  persist({
    'background-global-variables': snapshot
  });
}

function loadGlobalVariables() {
  getFromStorage({'background-global-variables': {}}, result => {
    const globalVars = result['background-global-variables'];
    console.log(`loaded global variables ${JSON.stringify(globalVars)}`);

    toBeFulfilled = globalVars.toBeFulfilled || [];
    workerTabId = globalVars.workerTabId || null;
    currentTask = globalVars.currentTask || null;
    taskVersion = globalVars.taskVersion || 0;
    lastActiveTs = globalVars.lastActiveTs || Date.now();

    if (workerTabId) {
      chrome.tabs.get(workerTabId, () => {
        if (chrome.runtime.lastError) {
          console.log(`worker ${workerTabId} is no longer available. resetting...`);
          workerTabId = null;
          startWorker();
        }
      });
    }
  });
}

onMessage((msg, sender, cb) => {
  if (msg.type === NOTIFY) {
    notify(msg.data.title, msg.data.message);
  }
});