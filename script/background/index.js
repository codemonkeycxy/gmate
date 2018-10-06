// todo: study this useful link and possibly fetch more matching rooms
// https://www.quora.com/How-can-you-restore-the-Google-Calendar-prompt-when-you-change-time-zones

/* ==================== Global Variables ======================= */
const toBeFulfilled = [];
let workerTabId = null;
let currentTask = null;
let taskVersion = 0;
let lastActiveTs = Date.now();

chrome.runtime.onMessage.addListener((msg, sender, cb) => {
  if (msg.type === GET_QUEUE) {
    cb(getAllEventTasks());
  }
});
