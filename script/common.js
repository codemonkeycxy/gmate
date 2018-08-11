// put reusable code in this file
// reference: https://stackoverflow.com/questions/26240463/how-do-i-re-use-code-between-content-scripts-in-a-chrome-extension

var ALLOW_GUEST_MODIFY_EVENT = 'allow-guest-modify-event';
var ZERO_INVITEE_REMINDER = 'zero-invitee-reminder';
var GENERATE_ZOOM_ID = 'generate-zoom-id';
var AUTO_ROOM_BOOKING = 'auto-room-booking';
var ROOM_BOOKING_FILTER_POSITIVE = 'room-booking-filter-positive-1';
var ROOM_BOOKING_FILTER_NEGATIVE = 'room-booking-filter-negative';

var DEFAULT_FEATURE_TOGGLES = {};
DEFAULT_FEATURE_TOGGLES[ALLOW_GUEST_MODIFY_EVENT] = true;
DEFAULT_FEATURE_TOGGLES[ZERO_INVITEE_REMINDER] = true;
DEFAULT_FEATURE_TOGGLES[GENERATE_ZOOM_ID] = false;
DEFAULT_FEATURE_TOGGLES[AUTO_ROOM_BOOKING] = false;

var DEFAULT_ROOM_BOOKING_FILTERS = {};
DEFAULT_ROOM_BOOKING_FILTERS[ROOM_BOOKING_FILTER_POSITIVE] = '';
DEFAULT_ROOM_BOOKING_FILTERS[ROOM_BOOKING_FILTER_NEGATIVE] = '';

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
  if (val === undefined)
    return true;

  if (typeof (val) == 'function' || typeof (val) == 'number' || typeof (val) == 'boolean' || Object.prototype.toString.call(val) === '[object Date]')
    return false;

  if (val == null || val.length === 0)        // null or 0 length array
    return true;

  if (typeof (val) == "object") {
    // empty object

    var r = true;

    for (var f in val)
      r = false;

    return r;
  }

  return false;
}

function isElementVisible(element) {
  var styleStr = element.getAttribute('style');

  return !styleStr.includes('display: none') && !styleStr.includes('display:none');
}

// ref: https://stackoverflow.com/questions/3813294/how-to-get-element-by-innertext
// return the first match
function getElementByText(tagName, innerText) {
  var tags = document.getElementsByTagName(tagName);

  for (var i = 0; i < tags.length; i++) {
    if (tags[i].textContent == innerText) {
      return tags[i];
    }
  }
}

// return the first match
function getElementByAttr(tagName, attrName, expectedVal) {
  var tags = document.getElementsByTagName(tagName);

  for (var i = 0; i < tags.length; i++) {
    var attrVal = tags[i].getAttribute(attrName);

    if (attrVal && attrVal === expectedVal) {
      return tags[i];
    }
  }

  return null;
}

function isEdit() {
  var divTags = document.getElementsByTagName('div');

  for (var i = 0; i < divTags.length; i++) {
    var eventId = divTags[i].getAttribute('data-eventid');

    if (eventId && window.location.href.includes(eventId)) {
      return true;
    }
  }

  return false
}

function hasInvitee() {
  var guestList = getElementByAttr('div', 'aria-label', 'Guests invited to this event.');
  var divTags = guestList.getElementsByTagName('div');

  for (var i = 0; i < divTags.length; i++) {
    var key = divTags[i].getAttribute('key');
    var dataEmail = divTags[i].getAttribute('data-email');
    var ariaLabel = divTags[i].getAttribute('aria-label');
    var isInvitee = key && dataEmail && key === dataEmail;
    var isSelf = ariaLabel && ariaLabel.toLocaleLowerCase().includes('organizer');

    if (isInvitee && !isSelf) {
      return true;
    }
  }

  return false;
}

function dispatchMouseEvent(target, var_args) {
  var e = document.createEvent("MouseEvents");
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
  return Object.keys(obj).reduce(function (mostKey, currKey) {
    return (mostKey === undefined || !predicate(obj[mostKey], obj[currKey])) ? currKey : mostKey;
  });
}