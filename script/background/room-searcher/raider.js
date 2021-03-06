/**
 * Room Raider searches for available rooms that matches with the searching criteria and snatch them
 */

// ==================== global variable management ======================
const GLOBAL_VARIABLE_KEY = 'background-global-variables';

(async () => await bootstrap())();

async function bootstrap() {
  const globalVars = await getKeyFromLocal(GLOBAL_VARIABLE_KEY, {});
  console.log(`loaded global variables ${JSON.stringify(globalVars)}`);

  toBeFulfilled = globalVars.toBeFulfilled || [];
  currentTask = globalVars.currentTask || null;
  taskVersion = globalVars.taskVersion || 0;
  lastActiveTs = globalVars.lastActiveTs || Date.now();

  // push the saved current task into the task queue to start afresh
  enqueue(currentTask);
  currentTask = null;
}

// use chrome://identity-internals/ to control api credentials
// no room searching api. similar questioned asked: https://productforums.google.com/forum/#!msg/calendar/UViDqLtV-gA/dduccKC6CgAJ
// todo: add daily quota and anti-greedy mechanism
// todo: add google analytics on queue size and other user behaviors
// todo: who's holding my fav room. or large room for small group
// todo: link to rating page
// todo: (in the future) donation
// todo: option to automatically pause when on battery/battery is low
// todo: send crash log to google analytics for debugging
// todo: room booking notification "confirm" button doesn't work on windows
// todo: (maybe) wrap background scripts with self-invoking function
// use self-referring get function https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get
// todo: add prioritization function, allow room size preference and VC preference
// prioritization paper: https://pubsonline.informs.org/doi/pdf/10.1287/ited.2013.0124
// todo: bulma styling and create elements with html
// todo: check unblock youku's styling
// https://stackoverflow.com/questions/494143/creating-a-new-dom-element-from-an-html-string-using-built-in-dom-methods-or-pro
// todo: inject an identifier to the worker page and use that to either reuse/recycle worker upon app restart
// todo: record request to fulfillment time
// todo: log room booking stats by location
// todo: task removal is buggy
// todo: allow user to be opted out of tracking
// todo: log user version
// todo: list recently fulfilled events, maybe with their rooms
// todo: educate people about advanced features - provide a guide by the "i need a room" button
// todo: detect "too many failures"
// todo: share gmate in lifehack uchat room
// todo: randomly ask user for rating
// todo: consider auto open control panel upon installation
// todo: allow setting multiple room searching filters in one hit
// todo: tag gmate home page so that it shows up in google search first page
// todo: add support for more advanced filters such as "3+", ">5", "<15" OR more properly support number range
// todo: update github and chrome store description https:/search.google.com/search-console?resource_id=sc-domain:gmate.us
// todo: add A/B testing framework
// todo: add beta testing token
// todo: prevent too many pending meeting to be added. use notify to tell user
// todo: log last error to mixpanel
// https://stackoverflow.com/questions/28431505/unchecked-runtime-lasterror-when-using-chrome-api
// this means 1) try catch all executions. 2) log chrome runtime last error in all chrome related invocations
// todo: handle no auth error in case user auth gets somehow revoked. send user a notification to ask for auth. see getAuthToken function
// todo: tutorial "next" to "next: title"
// todo: flag for "don't always ask for filters"
// todo: maybe add "I need a room" button to the main calendar page for quicker action
// todo: automatically/ask manually to send console log crash report
// todo: enable open meeting url from room booked notification
// todo: scenario, room booked via api but network went out after that so was not able to confirm
// should still add the meeting to "room fulfilled" list since most likely the room is booked successfully
// todo: attach dollar value to meeting using avg salary
// todo: also add the "no need to book" cases to the "recently booked" section regardless
// todo: generate WOW meeting/free time ratio
// todo: button disappears after 1 refresh in the meeting edit page
// todo: study this useful link and possibly fetch more matching rooms
// https://www.quora.com/How-can-you-restore-the-Google-Calendar-prompt-when-you-change-time-zones
// todo: consider using js getter https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get
// todo: increased error in https://mixpanel.com/report/1836777/live#chosen_columns:!('$browser','$city',mp_country_code,distinct_id,'$referring_domain'),column_widths:!(200,100,223,153,217,257,170),search:error
// todo: show warning to user if the filter matches with 0 rooms
// todo: pick a room with capacity closer to the event human invitees
// todo: set reload warning for unsaved room filters
// todo: event gets dropped if they are booked for a different calendar
// todo: race condition still observed, need to apply isTaskFresh more aggressively
// todo: use docs retro as a way to debug recurring event booking (exclude deleted?)
// todo: allow user to choose whether to notify participants
// todo: potentially replace code based UI with html template https://stackoverflow.com/questions/16334054/inject-html-into-a-page-from-a-content-script
// todo: replace code generated UI with html template (see radar.js example)
// todo: measure room utilization impact (e.g. large room with small invitees, room hold, etc.) and send out monthly newsletter
// todo: when someone books for recurring meetings for the event owner, the owner gets bombarded with notifications
// ^ tested when the owners books recurring meetings for self, no notifications
// todo: detect rooms that keep on rejecting a user and auto exclude them (https://github.com/codemonkeycxy/gmate/issues/2)
// todo: (maybe) create team dot page
// todo: migrate room list into an online key value store for faster configuration
// todo: for some people, the control panel UI doesn't update until they click somewhere else (change only happens onExit)
// todo: build a community with redit
// todo: put room radar and raider button on calendar main page
// todo: exclude cart and other non-meeting rooms
// todo: (maybe) when possible, book room with capacity closer to the number of invitees
// todo: detect the user company and save as a global variable and use that to drive UI
// https://developer.chrome.com/extensions/identity#method-getProfileUserInfo and need "identity.email" permission
// todo: address todos in room radar. e.g. safeguard the search with sane limits
// todo: (maybe) support email subscription - need "identity.email" permission
// todo: add an onboarding walkthrough on install to set up default filters
// todo: auto detect recurring meetings and prompt the user
// todo: maybe option to exclude open rooms
// todo: show prompt for "zero-room-found", likely a misconfig
// todo: handle "Driver Onboard Cart [Mobile Cart, Zoom]"
// todo: consider creating gmate stickers
// todo: prettify html with fiverr hires
// todo: test gmate on chromium (try windows) and see why search room button doesn't respond
// todo: maybe ask someone to create a reddit community. or start with a reddit thread? hmm... this might spread the app idea too early and invite competitions
// todo: add total room booked count to logo
// todo: suggest to people, do you need a room? (use case: got invited to a meeting without realizing a room is missing for your office)
// todo: marketing idea boba/donut + flyer + sticker
// todo: put back "all guest edit" and open up the announcement page
// todo: gmate row randomly disappears for special event on main page after initial page load. only happens when the dialog has a title image (e.g. lunch sync)
// hacky solution to ^, regenerate gmate row when mutation records length > 10
// todo: add gmate button to main page create dialog

// ==================== task queue management ======================
onMessageOfType(ROOM_TO_BE_FULFILLED, async (msg, sender, sendResponse) => {
  const eventId = msg.data.eventId;
  const eventName = msg.data.eventName;
  const eventFilters = Filters.fromDict(msg.data.eventFilters);

  if (!eventId) {
    // if this happens there's a bug
    throw GMateError('empty event id', {eventName});
  }

  track(ROOM_TO_BE_FULFILLED);

  // NOTE: leave the async logic towards the end in order not to block the UI
  if (msg.data.bookRecurring) {
    await enqueueRecurringTasks(eventId, eventName, eventFilters);
  } else {
    enqueue(EventTask({eventId, eventName, eventFilters}));
  }

  await CalendarAPI.refreshAllRoomsCache();
});

async function enqueueRecurringTasks(eventId, eventName, eventFilters) {
  // the event might have just been created, wait until it can be fetched from the API before continuing
  const success = await tryUntilPass(
    async () => await CalendarAPI.getEventB64(eventId),
    {sleepMs: 1000, countdown: 15, suppressError: true}  // wait up to 15 sec
  );
  if (!success) {
    return notify('Oops. We encountered a problem', 'Unable to enqueue recurring meetings. Please try again');
  }

  const recurringIds = await CalendarAPI.eventIdToRecurringIdsB64(eventId);
  const preferredRooms = await getPreferredRoomsForRecurringEvents(recurringIds, eventFilters);
  enqueueMany(recurringIds.map(idToBook => EventTask({
    eventId: idToBook,
    eventName,
    eventFilters,
    preferredRooms,
  })));
  track(RECURRING_ROOM_TO_BE_FULFILLED);

  if (recurringIds.length < 2) {
    notify('Warning!', `Only found ${recurringIds.length} recurring meeting. Are you sure?`);
  } else {
    notify('Success!', `Added ${recurringIds.length} meetings to the room searching queue`);
  }
}

async function getPreferredRoomsForRecurringEvents(recurringIds, filters) {
  if (recurringIds.length < 1) {
    return [];
  }

  // randomly select 5 event ids to search for the most common free rooms
  const randomNIds = shuffleInPlace([...recurringIds]).slice(recurringIds.length - 5, recurringIds.length);
  const roomEmailCount = {};
  await parallel(randomNIds.map(eventId =>
    async () => {
      const event = await CalendarAPI.getEventB64(eventId);
      const freeRooms = await getFreeRoomsForEvent(event, filters);
      freeRooms.forEach(roomEmail => {
        if (roomEmailCount[roomEmail]) {
          roomEmailCount[roomEmail]++;
        } else {
          roomEmailCount[roomEmail] = 1;
        }
      });
    }), 0
  );

  // pick the top 3 common free rooms as room book preference
  return sortRoomEmailByCount(roomEmailCount).slice(0, 3);
}

onMessageOfType(GET_QUEUE, (msg, sender, sendResponse) =>
  sendResponse({
    type: GET_QUEUE,
    data: {
      eventTasks: getAllEventTasks(),
    }
  })
);

onMessageOfType(GET_TASKS_BY_EVENT_ID, (msg, sender, sendResponse) =>
  sendResponse({
    type: GET_TASKS_BY_EVENT_ID,
    data: {
      eventTasks: getTasksByEventId(msg.data.eventId),
    }
  })
);

onMessageOfType(REMOVE_TASK, (msg, sender, sendResponse) => {
  removeTask(msg.data.taskId);
  sendResponse({
    type: REMOVE_TASK,
    data: {
      eventTasks: getAllEventTasks(),
    }
  });
});

// ==================== scheduled jobs ======================
function heartbeat() {
  console.log('heartbeat check. still alive...');
  saveGlobalVarNoBlock();

  if (Date.now() - lastActiveTs > FIVE_MIN_MS) {
    console.log('worker idle for more than 5 min, resurrecting...');

    enqueue(currentTask);
    nextTaskFireAndForget();
  }
}

// fire a heartbeat check every minute
setInterval(heartbeat, ONE_MIN_MS);

// ==================== task fulfillment logic ======================

/* don't wait for next task to return otherwise you could be blocked forever */
function nextTaskFireAndForget() {
  nextTask();
}

async function nextTask() {
  console.log(`set last active timestamp to ${lastActiveTs.toString()}`);
  console.log(`current work: ${JSON.stringify(toBeFulfilled)}; task version: ${taskVersion}`);
  lastActiveTs = Date.now();
  taskVersion++;
  currentTask = null;

  if (toBeFulfilled.length === 0) {
    return console.log('no task to fulfill. waiting for new tasks to come in');
  }

  const nextAction = dequeue();
  currentTask = nextAction;
  saveGlobalVarNoBlock();

  if (nextAction.type === TASK_TYPE.NAP) {
    console.log('nap for one min');
    return setTimeout(wakeUp, ONE_MIN_MS, taskVersion);
  }

  const eventIdB64 = currentTask.data.eventId;
  const event = await CalendarAPI.getEventB64(eventIdB64);
  if (!event) {
    GMateError("current task event not found", currentTask);
    // sometimes an event can't be fetched due to obscure reasons (Calendar API outage), reinsert the task to try again later
    // retrying won't solve the client errors (e.g. wrong params passed in, missing auth), but we have error logging and monitoring for those
    enqueue(currentTask);
    return nextTaskFireAndForget();
  }

  if (event.isCancelled()) {
    console.log(`${JSON.stringify(currentTask)} no longer exists, moving on to the next task...`);
    return nextTaskFireAndForget();
  }

  if (event.isInPast()) {
    console.log(`no need to book room for a past meeting: ${JSON.stringify(currentTask)}`);
    return nextTaskFireAndForget();
  }

  const filters = Filters.fromDict(currentTask.data.eventFilters);
  if (!isEmpty(event.matchingRooms(filters))) {
    console.log(`no need to book for ${JSON.stringify(currentTask)}`);
    notifyThrottled('Great News!', `"${event.name}" already has a room that meets your criteria!`);
    return nextTaskFireAndForget();
  }

  // todo: pick a room with capacity closer to the event human invitees
  const roomEmailToBook = await pickRoomEmailByPreference(
    await getFreeRoomsForEvent(event, filters),
    currentTask.data.preferredRooms || [],
    currentTask.data.excludedRooms || []
  );
  if (isEmpty(roomEmailToBook)) {
    console.log('no bookable room is found. try again later...');
    enqueue(currentTask);
    return nextTaskFireAndForget();
  }

  const success = await bookRoom(eventIdB64, roomEmailToBook);
  if (success) {
    console.log(`room saved for ${JSON.stringify(currentTask)}`);
    // NOTE: notifyThrottled rely on the uniqueness of the message to work properly. Think carefully before
    // increasing the message's cardinality (e.g. log room name with message)
    notifyThrottled('Great News!', `Room found for "${event.name}"!`);
    track('room-saved');
    nextTaskFireAndForget();
  } else {
    console.log(`failed to save room for ${JSON.stringify(currentTask)}`);
    // room save failures are not expected in the book-via-api approach. log to confirm
    track('room-save-failure');

    // this line can be removed once all old data is drained
    currentTask.data.excludedRooms = currentTask.data.excludedRooms || [];
    currentTask.data.excludedRooms.push(roomEmailToBook);
    await CalendarAPI.removeRoomB64(roomEmailToBook);
    enqueue(currentTask);
    // remove listener after handling the expected event to avoid double trigger
    nextTaskFireAndForget();
  }
}

function wakeUp(taskVersionBeforeNap) {
  if (isTaskFresh(taskVersionBeforeNap)) {
    nextTaskFireAndForget();
  }
}

async function bookRoom(eventIdB64, roomEmail) {
  await CalendarAPI.addRoomB64(eventIdB64, roomEmail);
  console.log('waiting for the newly added room to confirm...');

  return await tryUntilPass(
    async () => {
      const event = await CalendarAPI.getEventB64(eventIdB64);
      return event && event.hasRoomAccepted(roomEmail);
    },
    {sleepMs: TEN_SEC_MS, countdown: 6, suppressError: true}  // wait up to 1 min
  );
}

// ==================== helpers ======================

function isTaskFresh(myTaskVersion) {
  if (myTaskVersion !== taskVersion) {
    console.log(`the world has moved on when I was sleeping... my task version: ${myTaskVersion}, current task version: ${taskVersion}`);
    return false
  } else {
    return true
  }
}

/**
 * data write can take long, this function doesn't block for a return
 */
function saveGlobalVarNoBlock() {
  const snapshot = {
    toBeFulfilled: toBeFulfilled,
    currentTask: currentTask,
    taskVersion: taskVersion,
    lastActiveTs: lastActiveTs
  };
  console.log(`taking a snapshot of the current global variables`);
  // purposefully no await here in order not to block
  persistPairLocal(GLOBAL_VARIABLE_KEY, snapshot);
}

function _enqueue(task) {
  if (!task) {
    return console.log('nothing to enqueue, move on...');
  }

  if (task.type !== TASK_TYPE.EVENT) {
    return console.log(`only need enqueue event tasks. ignoring ${JSON.stringify(task)}`);
  }

  if (isEventInQueue(task)) {
    return console.log(`${JSON.stringify(task)} is already in the queue`);
  }

  // add some buffer so that we don't retry immediately
  console.log(`enqueuing ${JSON.stringify(task)}...`);
  toBeFulfilled.push(...getNapFillers(5), task);
}

function enqueue(task) {
  _enqueue(task);
  saveGlobalVarNoBlock();
}

function enqueueMany(tasks) {
  tasks.forEach(task => _enqueue(task));
  saveGlobalVarNoBlock();
}

function dequeue() {
  const task = toBeFulfilled.shift();
  console.log(`dequeuing ${JSON.stringify(task)}...`);

  saveGlobalVarNoBlock();
  return task;
}

function removeTask(taskId) {
  console.log(`trying to remove task with id ${taskId}...`);

  if (currentTask && currentTask.id === taskId) {
    return console.warn(`unable to remove the current task ${currentTask} that's under lock`);
  }

  const oldLength = toBeFulfilled.length;
  toBeFulfilled = toBeFulfilled.filter(task => task.id !== taskId);
  saveGlobalVarNoBlock();

  const newLength = toBeFulfilled.length;
  if (newLength === oldLength - 1) {
    return console.log(`successfully removed task with id ${taskId}`);
  }

  console.error(`an error occurred during task removal. old task count ${oldLength}, new task count ${newLength}`);
}

function estimateTimeToCompletion() {
  let timeToCompletion = 0;

  toBeFulfilled.forEach(task => timeToCompletion += task.type === TASK_TYPE.NAP ? 1 : 0);
  return timeToCompletion;
}

function isEventInQueue(eventTask) {
  // we purposefully NOT dedup against the currentTask here
  // since we have use cases that we need to push the current task back into the queue
  return toBeFulfilled.filter(task => {
    if (task.type !== TASK_TYPE.EVENT) {
      return false;
    }

    return task.data.eventId === eventTask.data.eventId && deepEqual(task.data.eventFilters, eventTask.data.eventFilters);
  }).length > 0;
}

/**
 * return all the event tasks from the task queue. Note the return value includes the currentTask as well
 */
function getAllEventTasks() {
  const toBeFulFilledEventTasks = toBeFulfilled.filter(task => task.type === TASK_TYPE.EVENT);

  return {
    currentTask: currentTask && currentTask.type === TASK_TYPE.EVENT ? currentTask : null,
    pendingTasks: toBeFulFilledEventTasks
  };
}

function getTasksByEventId(eventId) {
  const {currentTask, pendingTasks} = getAllEventTasks();

  return [currentTask, ...pendingTasks].filter(
    eventTask => eventTask && eventTask.data.eventId === eventId
  );
}

function getNapFillers(napMinutes) {
  console.log(`trying to add a ${napMinutes} minutes nap to the task queue...`);

  const timeToCompletion = estimateTimeToCompletion();
  const fillers = [];
  if (timeToCompletion >= napMinutes) {
    console.log(`just kidding. it will already take ${timeToCompletion} minutes to complete the current tasks. no need to nap more`);
    return fillers;
  }

  napMinutes = napMinutes - timeToCompletion;
  console.log(`given the current tasks will take ${timeToCompletion} minutes complete, adding ${napMinutes} minutes nap to the task queue...`);
  for (let i = 0; i < napMinutes; i++) {
    fillers.push(NapTask());
  }

  return fillers;
}

async function getFreeRoomsForEvent(event, filters) {
  const allRooms = await CalendarAPI.getAllRoomsWithCache();
  if (isEmpty(allRooms)) {
    GMateError('empty room list');
  }

  const roomCandidates = allRooms.filter(room => filters.matchRoom(room));
  console.log(`found ${roomCandidates.length} room candidates`);
  if (isEmpty(roomCandidates)) {
    // 0 room candidates indicate either a room list fetching issue or a filter setup issue. log more info for investigation
    GMateError('zero room candidates', {
      eventId: event.id,
      ...filters.toDict(),
    });
  }

  return await CalendarAPI.pickFreeRooms(event.startStr, event.endStr, roomCandidates.map(room => room.email));
}

function sortRoomEmailByCount(roomEmailCount) {
  return Object.keys(roomEmailCount).sort((roomEmail1, roomEmail2) => roomEmailCount[roomEmail2] - roomEmailCount[roomEmail1]);
}