// todo: study this useful link and possibly fetch more matching rooms
// https://www.quora.com/How-can-you-restore-the-Google-Calendar-prompt-when-you-change-time-zones

/* ==================== Global Variables ======================= */
let toBeFulfilled, workerTabId, currentTask, taskVersion, lastActiveTs;

onMessage((msg, sender, cb) => {
  if (msg.type === NOTIFY) {
    notify(msg.data.title, msg.data.message);
  }
});