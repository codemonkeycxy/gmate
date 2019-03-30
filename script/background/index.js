// todo: study this useful link and possibly fetch more matching rooms
// https://www.quora.com/How-can-you-restore-the-Google-Calendar-prompt-when-you-change-time-zones

/* ==================== Global Variables ======================= */
let toBeFulfilled, workerTabId, currentTask, taskVersion, lastActiveTs;

chrome.runtime.setUninstallURL('https://www.gmate.us/faq/common-problems#h.p_9n8u0cEo6KHr');

// refresh calendar main page on app update so that the new code can take effect
refreshCalendarMainPage();

onMessage((msg, sender, cb) => {
  if (msg.type === NOTIFY) {
    return notify(msg.data.title, msg.data.message);
  }

  if (msg.type === PROMPT_AUTH) {
    // Note: have to use a non-conventional style here due to chrome api peculiarity
    // https://developer.chrome.com/apps/runtime#property-onMessage-sendResponse
    // 1) use the raw promise and callback here instead of async/await
    // 2) return true
    promptAuth().then(token => cb(token));
    return true;
  }
});

// (async () => {
//   await promptAuth();
//   const pastMeeting = 'NjBwdjA5czh0Nzl1aW92ZmNkM3ZsOW9lcXQgeGlueWlAdWJlci5jb20';
//   const futureMeeting = 'NWg5OWtyM2U2bGgxZ2x0OXVpYzdocDUxNDUgeGlueWlAdWJlci5jb20';
//   console.log(await CalendarAPI.isPastMeetingB64(pastMeeting));
//   console.log(await CalendarAPI.isPastMeetingB64(futureMeeting));
//
//   const updated = await CalendarAPI.addRoomB64(base64Id, 'uber.com_2d3631343836363435363330@resource.calendar.google.com');
//   console.log(updated);
//
//   await sleep(3 * TEN_SEC_MS);
//   const event = await CalendarAPI.getEventB64(base64Id);
//   console.log(event);
//
//   const updated2 = await CalendarAPI.addRoomB64(base64Id, 'uber.com_383432313535383739@resource.calendar.google.com');
//   console.log(updated2);
//
//   await sleep(3 * TEN_SEC_MS);
//   const event2 = await CalendarAPI.getEventB64(base64Id);
//   console.log(event2);
// })();