// put reusable code in this file
// reference: https://stackoverflow.com/questions/26240463/how-do-i-re-use-code-between-content-scripts-in-a-chrome-extension

const APP_ID = 'delnddlekcgngcpgcebeaaffadedenmp';

const TEN_SEC_MS = 10 * 1000;
const ONE_MIN_MS = 60 * 1000;
const FIVE_MIN_MS = 5 * ONE_MIN_MS;
const ONE_HOUR_MS = 60 * ONE_MIN_MS;

// feature toggles
const ZERO_INVITEE_REMINDER = "zero-invitee-reminder";
const GENERATE_ZOOM_ID = "generate-zoom-id";

// room booking related actions
const FAVORITE_ROOMS = "favorite-rooms";
const AUTO_ROOM_BOOKING = "auto-room-booking";
const ROOM_TO_BE_FULFILLED = "room-to-be-fulfilled";
const RECURRING_ROOM_TO_BE_FULFILLED = "recurring-room-to-be-fulfilled";
const ROOM_TO_BE_FULFILLED_FAILURE = "room-to-be-fulfilled-failure";
const REGISTER_FAVORITE_ROOMS = "register-favorite-rooms";
const REGISTER_MEETING_TO_BOOK = "register-meeting-to-book";

// UI modification actions
const SHOW_BANNER = "show-banner";
const ADD_OVERLAY = "add-overlay";

const NOTIFY = "notify";
const TRACK = "track";

// Browser <-> Background Msg
const PROMPT_AUTH = "prompt-auth";
const GET_ROOM_CANDIDATE_CNT = "get-room-candidate-count";

// settings panel actions
const GET_QUEUE = "get-queue";
const REMOVE_TASK = "remove-task";
const ROOM_RADAR = "room-radar";

// room status
const ACCEPTED = "accepted";
const DECLINED = "declined";
const UNKNOWN = "unknown";

const ANY = "any";
const ALL = "all";
const YES = 'yes';
const NO = 'no';

const LEFT = "left";
const RIGHT = "right";

const SEARCH_ROOM_BTN_MSG = "Find a room with GMate";
const SEARCH_ROOM_BTN_CLICKED = "find-room-button-clicked";
const ROOM_RADAR_BTN_CLICKED = "room-radar-button-clicked";

const DEFAULT_FEATURE_TOGGLES = {};
DEFAULT_FEATURE_TOGGLES[ZERO_INVITEE_REMINDER] = true;
DEFAULT_FEATURE_TOGGLES[GENERATE_ZOOM_ID] = false;
DEFAULT_FEATURE_TOGGLES[AUTO_ROOM_BOOKING] = true;

const CALENDAR_PAGE_URL_PREFIX = 'https://calendar.google.com/calendar/r';
const EDIT_PAGE_URL_PREFIX = 'https://calendar.google.com/calendar/r/eventedit';

// room filter UI options
const AUTO_COMPLETE = 'auto-complete';
const DROPDOWN = 'drop-down';
const NUM_RANGE = 'num-range';
const CHECKBOX = 'checkbox';

const FULL_ROOM_LIST_KEY = 'full-room-list';

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

function isNumber(n) {
  //we check isFinite first since it will weed out most of the non-numbers
  //like mixed numbers and strings, which parseFloat happily accepts
  return isFinite(n) && !isNaN(parseFloat(n));
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

// return all matches
function getAllElementsByText(tagName, innerText, parentNode) {
  parentNode = parentNode || document;
  const tags = parentNode.getElementsByTagName(tagName);
  const result = [];

  for (let i = 0; i < tags.length; i++) {
    if (tags[i].textContent == innerText) {
      result.push(tags[i]);
    }
  }

  return result;
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

// ref: https://stackoverflow.com/questions/5783969/how-to-get-child-element-by-id-in-javascript
function findChildById(element, childID) {
  function getAllDescendant(element, lstChildrenNodes) {
    lstChildrenNodes = lstChildrenNodes ? lstChildrenNodes : [];
    var lstChildren = element.childNodes;

    for (var i = 0; i < lstChildren.length; i++) {
      if (lstChildren[i].nodeType == 1) // 1 is 'ELEMENT_NODE'
      {
        lstChildrenNodes.push(lstChildren[i]);
        lstChildrenNodes = getAllDescendant(lstChildren[i], lstChildrenNodes);
      }
    }

    return lstChildrenNodes;
  }

  var retElement = null;
  var lstChildren = getAllDescendant(element);
  for (var i = 0; i < lstChildren.length; i++) {
    if (lstChildren[i].id == childID) {
      retElement = lstChildren[i];
      break;
    }
  }

  return retElement;
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
    const key = divTags[i].getAttribute("data-id");
    const dataEmail = divTags[i].getAttribute("data-email");
    const ariaLabel = divTags[i].getAttribute("aria-label");
    const isInvitee = key && dataEmail && key === dataEmail;
    const isSelf = ariaLabel && ariaLabel.toLocaleLowerCase().includes("organizer");

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

// had to use this hack to get around Chrome disallowing "untrusted" input event
// https://stackoverflow.com/questions/39947875/as-of-chrome-53-how-to-add-text-as-if-a-trusted-textinput-event-was-dispatched
function dispatchTextEvent(target, text) {
  input.focus();
  document.execCommand('insertText', false, text);
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

function onMessageOfType(expectedType, callback, recycleTtl) {
  onMessage(async (msg, sender, sendResponse) => {
    if (!msg.type) {
      throw GMateError('malformed message', {msg, expectedType});
    }

    if (msg.type !== expectedType) {
      return;
    }

    await callback(msg, sender, sendResponse);
  }, recycleTtl);
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

async function getTabById(id) {
  return await new Promise(resolve => chrome.tabs.get(id, tab => resolve(tab)));
}

/**
 * throttle notifications to avoid overwhelming the user
 * this function uses a simple throttle strategy:
 * if the new message is the same as the previous one, then don't send it
 */
const notifyThrottled = (() => {
  let lastMsg;

  return (title, msg) => {
    if (lastMsg === msg) {
      console.log(`Throttled repeated message ${msg} to avoid bugging the user`);
    } else {
      notify(title, msg);
    }

    lastMsg = msg;
  }
})();

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

function track(msg, extra) {
  try {  // for background script
    mixpanel.track(msg, extra);
  } catch (e) {  // for content script
    chrome.runtime.sendMessage({
      type: TRACK,
      data: {msg, extra}
    });
  }
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

async function tryUntilPass(predicate, options) {
  options = options || {};
  const sleepMs = options.sleepMs || 500;
  let countdown = options.countdown || 10;

  while (countdown > 0) {
    if (await predicate()) {
      return true;
    }

    // if predicates returns false, sleep for a while and try again
    countdown--;
    console.log(`failed predicate. chances left: ${countdown}. sleep for ${sleepMs} milliseconds before trying again...`);
    await sleep(sleepMs);
  }

  if (options.suppressError) {
    return false;
  }

  throw GMateError('tryUntilPass failed');
}

async function sleep(ms) {
  return await new Promise(resolve => setTimeout(resolve, ms));
}

const nextId = (() => {
  let id = 0;

  return () => id++;
})();

/**
 * a function that does nothing. can be used as noop or noop(), both have the same effect
 */
const noop = () => () => {
};

function refreshTab(tab) {
  chrome.tabs.update(tab.id, {url: tab.url});
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

// https://stackoverflow.com/questions/4833651/javascript-array-sort-and-unique
function sortUnique(arr) {
  if (arr.length === 0) return arr;
  arr = arr.sort((a, b) => a * 1 - b * 1);
  const ret = [arr[0]];
  for (let i = 1; i < arr.length; i++) { //Start loop at 1: arr[0] can never be a duplicate
    if (arr[i - 1] !== arr[i]) {
      ret.push(arr[i]);
    }
  }
  return ret;
}

// https://codereview.stackexchange.com/questions/26125/getting-all-number-from-a-string-like-this-1-2-5-9
function parseNumbersFromString(stringNumbers) {
  //variable declaration format is personal preference
  //but I prefer having declarations with assignments have individual vars
  //while those that have no assignments as comma separated
  let i, range, low, high, entry;

  //an added bonus, " and ' are the same in JS, but order still applies
  //I prefer to use ' since it's cleaner
  const entries = stringNumbers.split(',');
  const length = entries.length;
  const nums = [];

  for (i = 0; i < length; ++i) {
    entry = entries[i];

    if (isNumber(entry)) {
      //we check if the entry itself is a number. If it is, then we push it directly.
      //an additinal advantage is that negative numbers are valid
      nums.push(+entry);
    } else {

      //if not a number, probably it had the - and not being a negative number
      //only here do we split after we determined that the entry isn't a number
      range = entry.split('-');

      //check if what we split are both numbers, else skip
      if (!isNumber(range[0]) || !isNumber(range[1])) continue;

      //force both to be numbers
      low = +range[0];
      high = +range[1];

      //since we are dealing with numbers, we could do an XOR swap
      //which is a swap that doesn't need a third variable
      //http://en.wikipedia.org/wiki/XOR_swap_algorithm
      if (high < low) {
        low = low ^ high;
        high = low ^ high;
        low = low ^ high;
      }

      //from low, we push up to high
      while (low <= high) {
        nums.push(low++);
      }
    }
  }
  return sortUnique(nums);
}

// https://stackoverflow.com/questions/13627308/add-st-nd-rd-and-th-ordinal-suffix-to-a-number
function appendOrdinalSuffix(i) {
  var j = i % 10,
    k = i % 100;
  if (j == 1 && k != 11) {
    return i + "st";
  }
  if (j == 2 && k != 12) {
    return i + "nd";
  }
  if (j == 3 && k != 13) {
    return i + "rd";
  }
  return i + "th";
}

function isPageActive() {
  return !document.hidden;
}

// https://stackoverflow.com/questions/1068834/object-comparison-in-javascript
function deepEqual() {
  var i, l, leftChain, rightChain;

  function compare2Objects(x, y) {
    var p;

    // remember that NaN === NaN returns false
    // and isNaN(undefined) returns true
    if (isNaN(x) && isNaN(y) && typeof x === 'number' && typeof y === 'number') {
      return true;
    }

    // Compare primitives and functions.
    // Check if both arguments link to the same object.
    // Especially useful on the step where we compare prototypes
    if (x === y) {
      return true;
    }

    // Works in case when functions are created in constructor.
    // Comparing dates is a common scenario. Another built-ins?
    // We can even handle functions passed across iframes
    if ((typeof x === 'function' && typeof y === 'function') ||
      (x instanceof Date && y instanceof Date) ||
      (x instanceof RegExp && y instanceof RegExp) ||
      (x instanceof String && y instanceof String) ||
      (x instanceof Number && y instanceof Number)) {
      return x.toString() === y.toString();
    }

    // At last checking prototypes as good as we can
    if (!(x instanceof Object && y instanceof Object)) {
      return false;
    }

    if (x.isPrototypeOf(y) || y.isPrototypeOf(x)) {
      return false;
    }

    if (x.constructor !== y.constructor) {
      return false;
    }

    if (x.prototype !== y.prototype) {
      return false;
    }

    // Check for infinitive linking loops
    if (leftChain.indexOf(x) > -1 || rightChain.indexOf(y) > -1) {
      return false;
    }

    // Quick checking of one object being a subset of another.
    // todo: cache the structure of arguments[0] for performance
    for (p in y) {
      if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
        return false;
      } else if (typeof y[p] !== typeof x[p]) {
        return false;
      }
    }

    for (p in x) {
      if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
        return false;
      } else if (typeof y[p] !== typeof x[p]) {
        return false;
      }

      switch (typeof (x[p])) {
        case 'object':
        case 'function':

          leftChain.push(x);
          rightChain.push(y);

          if (!compare2Objects(x[p], y[p])) {
            return false;
          }

          leftChain.pop();
          rightChain.pop();
          break;

        default:
          if (x[p] !== y[p]) {
            return false;
          }
          break;
      }
    }

    return true;
  }

  if (arguments.length < 1) {
    return true; //Die silently? Don't know how to handle such case, please help...
    // throw "Need two or more arguments to compare";
  }

  for (i = 1, l = arguments.length; i < l; i++) {

    leftChain = []; //Todo: this can be cached
    rightChain = [];

    if (!compare2Objects(arguments[0], arguments[i])) {
      return false;
    }
  }

  return true;
}

function show(element) {
  element.style.display = 'block';
}

function hide(element) {
  element.style.display = 'none';
}

function decodeEventId(base64Id) {
  const [id, ownerEmail] = atob(base64Id).split(' ');
  return {id, ownerEmail};
}

function encodeEventId(id, ownerEmail) {
  const encoded = btoa(`${id} ${ownerEmail}`);
  // remove the trailing '=' padding
  // https://stackoverflow.com/questions/4492426/remove-trailing-when-base64-encoding
  return removeTrailingChar(encoded, '=');
}

// a simple but inefficient way of removing trailing characters
function removeTrailingChar(str, charToRemove) {
  while (str && str.charAt(str.length - 1) === charToRemove) {
    str = str.substr(0, str.length - 1);
  }

  return str;
}

function injectCss(cssUrl) {
  if (document.getElementById(cssUrl)) {
    return;
  }

  const head = document.getElementsByTagName('head')[0];
  const link = document.createElement('link');
  link.id = cssUrl;
  link.rel = 'stylesheet';
  link.type = 'text/css';
  link.href = cssUrl;
  link.media = 'all';
  head.appendChild(link);
}

function setPauseIcon() {
  chrome.browserAction.setBadgeBackgroundColor({color: '#FF8C00'});
  chrome.browserAction.setBadgeText({text: '|️|️'});
}

function unsetPauseIcon() {
  chrome.browserAction.setBadgeText({text: ''});
}

function replaceAll(str, find, replace) {
  function escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
  }

  return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

/**
 * customized error wrapper that logs the error info and stack trace to both the console and the external tracker.
 * in the end, it returns an error object for the caller to decide whether to throw
 *
 * @param msg required error message
 * @param data optional extra payload data
 * @returns {Error} a new error for the caller to throw
 */
function GMateError(msg, data = null) {
  const infoBag = {msg};
  if (data) {
    infoBag.data = data;
  }

  // we could also have jammed data into the error message but that'd overflow the mixpanel tracker UI
  const error = new Error(msg);
  // make stack trace more compact to fit into mixpanel tracker's UI
  infoBag.stack = replaceAll(error.stack, `chrome-extension://${APP_ID}/script/`, '');

  track('error', infoBag);
  track(msg, infoBag);
  console.error(infoBag);

  return error;
}

// reference: https://medium.com/@Dragonza/four-ways-to-chunk-an-array-e19c889eac4
function chunk(array, size) {
  const chunked_arr = [];
  for (let i = 0; i < array.length; i++) {
    const last = chunked_arr[chunked_arr.length - 1];
    if (!last || last.length === size) {
      chunked_arr.push([array[i]]);
    } else {
      last.push(array[i]);
    }
  }
  return chunked_arr;
}

function prettyDate(date) {
  return date.toString().replace(/(:00)?\s*GMT.*$/, '').trim();
}

async function parallel(funcs, randDelayMs = TEN_SEC_MS) {
  await Promise.all(funcs.map(func =>
    // prepare operations to be run in parallel
    (async () => {
      await sleep(getRandomInt(randDelayMs));
      await func();
    })()
  ));
}

// reference: https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
/**
 * Shuffles array in place. ES6 version
 * @param {Array} a items An array containing the items.
 */
function shuffleInPlace(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function isBackground() {
  return Boolean(chrome.identity)
}

async function getRoomCandidateCnt(filters) {
  if (isBackground()) {
    if (!await hasAuth()) {
      return -1;
    }

    const allRooms = await CalendarAPI.getAllRoomsWithCache();
    const roomCandidates = allRooms.filter(room => filters.matchRoom(room));

    return roomCandidates.length;
  } else {  // for content script
    return await new Promise(resolve => chrome.runtime.sendMessage(
      null, {
        type: GET_ROOM_CANDIDATE_CNT,
        data: {eventFilters: filters}
      },
      null,
      cnt => resolve(cnt)
    ));
  }
}