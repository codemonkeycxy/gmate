/* ==================== Global Variables ======================= */
let toBeFulfilled, workerTabId, currentTask, taskVersion, lastActiveTs;

chrome.runtime.setUninstallURL('https://www.gmate.us/faq/common-problems#h.p_9n8u0cEo6KHr');

// refresh calendar main page on app update so that the new code can take effect
refreshCalendarMainPage();

onMessageOfType(NOTIFY, (msg, sender, cb) => notify(msg.data.title, msg.data.message));
onMessageOfType(TRACK, (msg, sender, cb) => track(msg.data.msg, msg.data.extra));
onMessage((msg, sender, cb) => {
  if (msg.type === PROMPT_AUTH) {
    // Note: have to use a non-conventional style here due to chrome api peculiarity
    // https://developer.chrome.com/apps/runtime#property-onMessage-sendResponse

    // 1) can't register an async function (which precludes the usage of onMessageOfType helper)
    // 2) use the raw promise and callback here instead of async/await
    // 3) return true
    promptAuth().then(token => cb(token));
    return true;
  }
});

// (async () => {
//   console.log(await CalendarAPI.pickFreeRooms('2019-06-03T19:00:00-07:00', '2019-06-03T19:30:00-07:00', ['uber.com_53464f3535354d61726b657431397468536865696b685a61796564526f6164392d373538343436@resource.calendar.google.com', 'uber.com_53464f3535354d61726b657432307468426f7765727953747265657431322d363338343337@resource.calendar.google.com']));
// })();