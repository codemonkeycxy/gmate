// put reusable code in this file
// reference: https://stackoverflow.com/questions/26240463/how-do-i-re-use-code-between-content-scripts-in-a-chrome-extension

var ALLOW_GUEST_MODIFY_EVENT = 'allow-guest-modify-event';
var ZERO_INVITEE_REMINDER = 'zero-invitee-reminder';
var GENERATE_ZOOM_ID = 'generate-zoom-id';

var DEFAULT_SETTINGS = {};
DEFAULT_SETTINGS[ALLOW_GUEST_MODIFY_EVENT] = true;
DEFAULT_SETTINGS[ZERO_INVITEE_REMINDER] = true;
DEFAULT_SETTINGS[GENERATE_ZOOM_ID] = false;

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