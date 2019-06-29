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
  const eventFilters = {
    flexFilters: {
      'room-booking-filter-negative': "",
      'room-booking-filter-positive-1': "",
      'room-booking-filter-uber-floor': "4,5",
      'room-booking-filter-uber-location': "SFO | 1455 Market",
      'room-booking-filter-uber-need_vc': true,
      'room-booking-filter-uber-room_size': "3-15",
    },
    negFilter: "",
    posFilter: "",
  };
  const {posFilter, negFilter, flexFilters} = eventFilters;

  const event = await CalendarAPI.getEventB64('N2owYXM2ZzdxN3N1aDlzdTVpaGM5YmhwYXYgeGlueWlAdWJlci5jb20');
  const allRooms = await getFullRoomList();
  const roomCandidates = allRooms.filter(room => matchRoom(room.name, posFilter, negFilter, flexFilters));

  const busyRooms = await CalendarAPI.pickBusyRooms(event.startStr, event.endStr, roomCandidates.map(room => room.email));
  console.log(busyRooms);
  // todo: add sane limit for busy rooms
  const events = await CalendarAPI.getEventsForRooms(event.startStr, event.endStr, busyRooms);
  console.log(events);
  console.log(events.filter(event => event.name && event.name.includes('1:1')));
})();