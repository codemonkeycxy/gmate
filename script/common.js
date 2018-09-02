// put reusable code in this file
// reference: https://stackoverflow.com/questions/26240463/how-do-i-re-use-code-between-content-scripts-in-a-chrome-extension

const ALLOW_GUEST_MODIFY_EVENT = "allow-guest-modify-event";
const ZERO_INVITEE_REMINDER = "zero-invitee-reminder";
const GENERATE_ZOOM_ID = "generate-zoom-id";

const AUTO_ROOM_BOOKING = "auto-room-booking";
const REGISTER_FAVORITE_ROOMS = "register-favorite-rooms";
const ROOM_BOOKING_FILTER_POSITIVE = "room-booking-filter-positive-1";
const ROOM_BOOKING_FILTER_NEGATIVE = "room-booking-filter-negative";

const DEFAULT_FEATURE_TOGGLES = {};
DEFAULT_FEATURE_TOGGLES[ALLOW_GUEST_MODIFY_EVENT] = true;
DEFAULT_FEATURE_TOGGLES[ZERO_INVITEE_REMINDER] = true;
DEFAULT_FEATURE_TOGGLES[GENERATE_ZOOM_ID] = false;
DEFAULT_FEATURE_TOGGLES[AUTO_ROOM_BOOKING] = false;

const DEFAULT_ROOM_BOOKING_FILTERS = {};
DEFAULT_ROOM_BOOKING_FILTERS[ROOM_BOOKING_FILTER_POSITIVE] = "";
DEFAULT_ROOM_BOOKING_FILTERS[ROOM_BOOKING_FILTER_NEGATIVE] = "";

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
function getElementByText(tagName, innerText) {
  const tags = document.getElementsByTagName(tagName);

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
  const divTags = document.getElementsByTagName("div");

  for (let i = 0; i < divTags.length; i++) {
    const eventId = divTags[i].getAttribute("data-eventid");

    if (eventId && window.location.href.includes(eventId)) {
      return true;
    }
  }

  return false;
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

function dispatchMouseEvent(target, var_args) {
  const e = document.createEvent("MouseEvents");
  // If you need clientX, clientY, etc., you can call
  // initMouseEvent instead of initEvent
  e.initEvent.apply(e, Array.prototype.slice.call(arguments, 1));
  target.dispatchEvent(e);
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

function onMessage(callback) {
  chrome.runtime.onMessage.addListener(callback);
}

function getFromStorage(keys, callback) {
  chrome.storage.sync.get(keys, callback);
}

function persist(items) {
  chrome.storage.sync.set(items);
}
