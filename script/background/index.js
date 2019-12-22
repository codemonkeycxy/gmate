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

(async () => {
  // await CalendarAPI.removeRoomB64('NDl0Z2tqYjJtYnNiMGpnN2VtZm81bXQ5djAgeGlueWlAdWJlci5jb20', 'uber.com_53454131313931326e6441766531327468313444656e6e79426c61696e652d363837313137@resource.calendar.google.com');
  // await CalendarAPI.removeRoomB64('NDl0Z2tqYjJtYnNiMGpnN2VtZm81bXQ5djAgeGlueWlAdWJlci5jb20', 'uber.com_2d3831323932363335333634@resource.calendar.google.com');
})();