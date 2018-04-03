// put reusable code in this file
// reference: https://stackoverflow.com/questions/26240463/how-do-i-re-use-code-between-content-scripts-in-a-chrome-extension

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