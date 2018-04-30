// put reusable code in this file
// reference: https://stackoverflow.com/questions/26240463/how-do-i-re-use-code-between-content-scripts-in-a-chrome-extension

var ALLOW_GUEST_MODIFY_EVENT = 'allow-guest-modify-event';
var ZERO_INVITEE_REMINDER = 'zero-invitee-reminder';
var GENERATE_ZOOM_ID = 'generate-zoom-id';

var DEFAULT_SETTINGS = {};
DEFAULT_SETTINGS[ALLOW_GUEST_MODIFY_EVENT] = true;
DEFAULT_SETTINGS[ZERO_INVITEE_REMINDER] = true;
DEFAULT_SETTINGS[GENERATE_ZOOM_ID] = false;

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
function getElementByText(tagName, innerText) {
  var aTags = document.getElementsByTagName(tagName);

  for (var i = 0; i < aTags.length; i++) {
    if (aTags[i].textContent == innerText) {
      return aTags[i];
    }
  }
}

function hasInvitee() {
  var divTags = document.getElementsByTagName('div');

  for (var i = 0; i < divTags.length; i++) {
    var key = divTags[i].getAttribute('key');
    var dataEmail = divTags[i].getAttribute('data-email');
    if (key && dataEmail && key === dataEmail) {
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