/* ==================== Global Variables ======================= */
let toBeFulfilled, currentTask, taskVersion, lastActiveTs;

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

(async () => {
  const rooms = await CalendarAPI.refreshAllRoomsCache();
  let offices = {};
  rooms.forEach(room => {
    const dashIndex = room.name.indexOf('-');
    const office = room.name.substring(0, dashIndex).trim();
    if (office && !office.toLowerCase().includes('test')) {
      if (offices[office]) {
        offices[office]++;
      } else {
        offices[office] = 1;
      }
    }
  });

  let toInclude = [];
  Object.keys(offices).map(office => {
    if (offices[office] > 5) {
      toInclude.push(office);
    }
  });

  toInclude = toInclude.sort();
  console.log(toInclude);
  await persistPairLocal('temp', toInclude);
})();