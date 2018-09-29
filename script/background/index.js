// todo: study this useful link and possibly fetch more matching rooms
// https://www.quora.com/How-can-you-restore-the-Google-Calendar-prompt-when-you-change-time-zones

// todo: maybe persist this into chrome store

/* ==================== Global Variables ======================= */
const toBeFulfilled = [];
let workerTabId = null;
let currentWork = null;

chrome.runtime.onMessage.addListener((msg, sender, cb) => {
  if (msg.type === GET_QUEUE) {
    cb(toBeFulfilled.filter(task => task.type !== NAP));
  }
});
