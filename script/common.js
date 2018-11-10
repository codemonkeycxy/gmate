// put reusable code in this file
// reference: https://stackoverflow.com/questions/26240463/how-do-i-re-use-code-between-content-scripts-in-a-chrome-extension

const TEN_SEC_MS = 10 * 1000;
const ONE_MIN_MS = 60 * 1000;
const FIVE_MIN_MS = 5 * ONE_MIN_MS;
const ONE_HOUR_MS = 60 * ONE_MIN_MS;

const ALLOW_GUEST_MODIFY_EVENT = "allow-guest-modify-event";
const ZERO_INVITEE_REMINDER = "zero-invitee-reminder";
const GENERATE_ZOOM_ID = "generate-zoom-id";

const ROOM_SELECTED = "room-selected";
const NO_ROOM_FOUND = "no-room-found";
const NO_NEED_TO_BOOK = "no-need-to-book";
const AUTO_ROOM_BOOKING = "auto-room-booking";
const CONFIRM_ROOM_BOOKING_PREFIX = 'confirm_room_booking_';
const ROOM_TO_BE_FULFILLED = "room-to-be-fulfilled";
const ROOM_TO_BE_FULFILLED_FAILURE = "room-to-be-fulfilled-failure";
const REGISTER_FAVORITE_ROOMS = "register-favorite-rooms";
const REGISTER_MEETING_TO_BOOK = "register-meeting-to-book";
const ROOM_BOOKING_FILTER_POSITIVE = "room-booking-filter-positive-1";
const ROOM_BOOKING_FILTER_NEGATIVE = "room-booking-filter-negative";

const SHOW_BANNER = "show-banner";
const ADD_OVERLAY = "add-overlay";

const SAVE_EDIT = "save-edit";
const EDIT_SAVED = "edit-saved";
const SAVE_EDIT_FAILURE = "save-edit-failure";

const NOTIFY = "notify";

const NAP = "nap";
const EVENT = "event";
const GET_QUEUE = "get-queue";
const REMOVE_TASK = "remove-task";
const START_WORKER = "start-worker";
const STOP_WORKER = "stop-worker";
const TASK_QUEUE_UI_GROUP = "task-queue-ui-group";
const WORKER_ACTIVE_UI_GROUP = "worker-active-ui-group";
const WORKER_STOPPED_UI_GROUP = "worker-stopped-ui-group";
const TO_BE_FULFILLED_QUEUE = "to-be-fulfilled-queue";

const ACCEPTED = "accepted";
const DECLINED = "declined";
const UNKNOWN = "unknown";

const SUCCESS = "success";
const INFO = "info";
const WARNING = "warning";
const ERROR = "danger";

const DEFAULT_FEATURE_TOGGLES = {};
DEFAULT_FEATURE_TOGGLES[ALLOW_GUEST_MODIFY_EVENT] = true;
DEFAULT_FEATURE_TOGGLES[ZERO_INVITEE_REMINDER] = true;
DEFAULT_FEATURE_TOGGLES[GENERATE_ZOOM_ID] = false;
DEFAULT_FEATURE_TOGGLES[AUTO_ROOM_BOOKING] = false;

const DEFAULT_ROOM_BOOKING_FILTERS = {};
DEFAULT_ROOM_BOOKING_FILTERS[ROOM_BOOKING_FILTER_POSITIVE] = "";
DEFAULT_ROOM_BOOKING_FILTERS[ROOM_BOOKING_FILTER_NEGATIVE] = "";

const CALENDAR_PAGE_URL_PREFIX = 'https://calendar.google.com/calendar/r';
const EDIT_PAGE_URL_PREFIX = 'https://calendar.google.com/calendar/r/eventedit';

// ref: https://stackoverflow.com/questions/4597900/checking-something-isempty-in-javascript
// test results
//---------------
// []        true, empty array
// {}        true, empty object
// null      true
// undefined true
// ""        true, empty string
// ''        true, empty string
// 0         false, number
// true      false, boolean
// false     false, boolean
// Date      false
// function  false
function isEmpty(val) {
  if (val === undefined) return true;

  if (
    typeof val == "function" ||
    typeof val == "number" ||
    typeof val == "boolean" ||
    Object.prototype.toString.call(val) === "[object Date]"
  )
    return false;

  if (val == null || val.length === 0)
    // null or 0 length array
    return true;

  if (typeof val == "object") {
    // empty object

    let r = true;

    for (let f in val) r = false;

    return r;
  }

  return false;
}

function isElementVisible(element) {
  const styleStr = element.getAttribute("style");

  return !styleStr.includes("display: none") && !styleStr.includes("display:none");
}

// ref: https://stackoverflow.com/questions/3813294/how-to-get-element-by-innertext
// return the first match
function getElementByText(tagName, innerText, parentNode) {
  parentNode = parentNode || document;
  const tags = parentNode.getElementsByTagName(tagName);

  for (let i = 0; i < tags.length; i++) {
    if (tags[i].textContent == innerText) {
      return tags[i];
    }
  }
}

// return the first match
function getElementByAttr(tagName, attrName, expectedVal) {
  const tags = document.getElementsByTagName(tagName);

  for (let i = 0; i < tags.length; i++) {
    const attrVal = tags[i].getAttribute(attrName);

    if (attrVal && attrVal === expectedVal) {
      return tags[i];
    }
  }

  return null;
}

function isEdit() {
  return Boolean(getEventId());
}

function getEventId() {
  const divTags = document.getElementsByTagName('div');

  for (let i = 0; i < divTags.length; i++) {
    const eventId = divTags[i].getAttribute('data-eventid');

    if (eventId && window.location.href.includes(eventId)) {
      return eventId;
    }
  }

  return null;
}

function isMainCalendarPage() {
  return !!getElementByText('div', 'My calendars');
}

function getEventName() {
  const title = document.querySelectorAll('[aria-label="Title"]')[0];
  return title.getAttribute('value');
}

function getEventIdByName(eventName) {
  const meetingIds = [];
  const divTags = document.getElementsByTagName('div');

  for (let i = 0; i < divTags.length; i++) {
    const curr = divTags[i];
    const eventId = curr.getAttribute('data-eventid');
    const eventNameSpan = getElementByText('span', eventName, curr);

    if (eventId && eventNameSpan) {
      meetingIds.push(eventId);
    }
  }

  return meetingIds;
}

function hasInvitee() {
  const guestList = getElementByAttr(
    "div",
    "aria-label",
    "Guests invited to this event."
  );
  const divTags = guestList.getElementsByTagName("div");

  for (let i = 0; i < divTags.length; i++) {
    const key = divTags[i].getAttribute("key");
    const dataEmail = divTags[i].getAttribute("data-email");
    const ariaLabel = divTags[i].getAttribute("aria-label");
    const isInvitee = key && dataEmail && key === dataEmail;
    const isSelf =
      ariaLabel && ariaLabel.toLocaleLowerCase().includes("organizer");

    if (isInvitee && !isSelf) {
      return true;
    }
  }

  return false;
}

function getSaveButton() {
  return document.querySelectorAll('[aria-label="Save"]')[0];
}

function dispatchMouseEvent(target, var_args) {
  const e = document.createEvent("MouseEvents");
  // If you need clientX, clientY, etc., you can call
  // initMouseEvent instead of initEvent
  e.initEvent.apply(e, Array.prototype.slice.call(arguments, 1));
  target.dispatchEvent(e);
}

function insertBefore(newNode, referenceNode) {
  referenceNode.parentNode.insertBefore(newNode, referenceNode);
}

function insertAfter(newNode, referenceNode) {
  referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

/**
 * find the key for the most extreme item in an object according to a predicate function
 * ref: https://codereview.stackexchange.com/questions/51053/get-the-key-of-the-highest-value-in-javascript-object
 * @param obj
 * @param predicate function (mostItemSoFar, currItem) - if true, throw away the current item
 */
function findTheMostKey(obj, predicate) {
  return Object.keys(obj).reduce((mostKey, currKey) => mostKey === undefined || !predicate(obj[mostKey], obj[currKey])
    ? currKey
    : mostKey);
}

// wrappers around verbose chrome functions
function emit(tabId, msg) {
  chrome.tabs.sendMessage(tabId, msg);
}

function onMessage(callback, recycleTtl) {
  chrome.runtime.onMessage.addListener(callback);

  if (recycleTtl) {
    setTimeout(() => {
      console.log(`recycling listener ${callback.name}...`);
      chrome.runtime.onMessage.removeListener(callback);
    }, recycleTtl);
  }
}

function onTabUpdated(callback, recycleTtl) {
  chrome.tabs.onUpdated.addListener(callback);

  if (recycleTtl) {
    setTimeout(() => {
      console.log(`recycling listener ${callback.name}...`);
      chrome.tabs.onUpdated.removeListener(callback);
    }, recycleTtl);
  }
}

function getFromStorage(keys, callback) {
  chrome.storage.sync.get(keys, callback);
}

function persist(items) {
  chrome.storage.sync.set(items);
}

function isMyMeeting() {
  // if I control what guests can do, that means this is a meeting I own
  return Boolean(getElementByText('legend', 'Guests can:'));
}

function notify(title, msg) {
  if (chrome.notifications) {  // for background script
    chrome.notifications.create(null, {
      iconUrl: "icon.png",
      type: 'basic',
      title: title,
      message: msg
    });
  } else {  // for content script
    chrome.runtime.sendMessage({
      type: NOTIFY,
      data: {
        title: title,
        message: msg
      }
    });
  }
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function tryUntilPass(predicate, callback, options) {
  options = options || {};
  const sleepMs = options.sleepMs || 500;
  const countdown = options.countdown || 10;
  const onError = options.onError;

  _tryUntilPassRecursive(predicate, callback, sleepMs, countdown, onError);
}

function _tryUntilPassRecursive(predicate, callback, sleepMs, countdown, onError) {
  if (countdown === 0) {
    if (onError) {
      return onError();
    }

    throw new Error(
      `tryUntilPass(${predicate.name}, ${callback.name}) ran into infinite loop. force break...`
    );
  }

  if (!predicate()) {
    setTimeout(
      () => _tryUntilPassRecursive(predicate, callback, sleepMs, countdown - 1, onError),
      sleepMs
    );
  } else {
    callback();
  }
}

const nextId = (() => {
  let id = 0;

  return () => id++;
})();

/**
 * a function that does nothing. can be used as noop or noop(), both have the same effect
 */
const noop = () => () => {};

function refreshTab(tab) {
  chrome.tabs.update(tab.id,{url: tab.url});
}

function refreshCalendarMainPage(options) {
  options = options || {};
  const excludeTabIds = options.excludeTabIds || [];

  chrome.tabs.query({}, tabs =>
    tabs.forEach(tab => {
      const isCalendarPage = tab.url.startsWith(CALENDAR_PAGE_URL_PREFIX);
      const isEventPage = tab.url.startsWith(EDIT_PAGE_URL_PREFIX);

      if (isCalendarPage && !isEventPage && !excludeTabIds.includes(tab.id)) {
        refreshTab(tab);
      }
    })
  );
}