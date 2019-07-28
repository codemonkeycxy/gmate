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

async function refreshFullRoomList() {
  console.log('refreshing full room list...');
  const rooms = await CalendarAPI.getAllRooms();
  if (isEmpty(rooms)) {
    throw GMateError("received empty full room list from API");
  }

  console.log(`saving ${rooms.length} rooms to local storage...`);
  await persistPairLocal(FULL_ROOM_LIST_KEY, rooms);

  return rooms;
}

async function getFullRoomList() {
  const rooms = await getKeyFromLocal(FULL_ROOM_LIST_KEY, []);
  if (!isEmpty(rooms)) {
    return rooms;
  }

  return await refreshFullRoomList();
}

// (async () => {
//   console.log(await CalendarAPI.getEventB64('M2tmdWliMGFkZmlzY2JhaDZ0aTBtc2RtNDAgeGlueWlAdWJlci5jb20'));
// })();