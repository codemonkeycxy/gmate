/* ==================== Global Variables ======================= */
let toBeFulfilled, currentTask, taskVersion, lastActiveTs;

chrome.runtime.setUninstallURL('https://www.gmate.us/faq/common-problems#h.p_9n8u0cEo6KHr');

// refresh calendar main page on app update so that the new code can take effect
refreshCalendarMainPage();

onMessageOfType(NOTIFY, (msg, sender, cb) => notify(msg.data.title, msg.data.message));
onMessageOfType(TRACK, (msg, sender, cb) => track(msg.data.msg, msg.data.extra));
onMessage((msg, sender, cb) => {
  // Note: have to use a non-conventional style here due to chrome api peculiarity
  // https://developer.chrome.com/apps/runtime#property-onMessage-sendResponse

  // 1) can't register an async function (which precludes the usage of onMessageOfType helper)
  // 2) use the raw promise and callback here instead of async/await
  // 3) return true
  if (msg.type === PROMPT_AUTH) {
    promptAuth().then(token => cb(token));
    return true;
  }

  if (msg.type === GET_ROOM_CANDIDATE_CNT) {
    const filters = Filters.fromDict(msg.data.eventFilters);
    getRoomCandidateCnt(filters).then(cnt => cb(cnt));
    return true;
  }
});

// (async () => {
//   const allRooms = await CalendarAPI.getAllRoomsWithCache();
//   const filters = new Filters({
//     posRegex: '1455.*0(4|5)th',
//     negTexts: [],
//     negRegex: '(Cart|Quiet Room)',
//     flexFilters: {
//       "room-booking-filter-uber-location": "SFO | 1455 Market",
//       "room-booking-filter-uber-floor": "",
//       "room-booking-filter-uber-room_size": "",
//       "room-booking-filter-uber-need_vc": false
//     }
//   });
//   const roomCandidates = allRooms.filter(room => filters.matchRoom(room));
//   console.log(roomCandidates)
// })();