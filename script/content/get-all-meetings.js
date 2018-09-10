// self-invoking function to avoid name collision
(() => {
  function getAllMeetingIds() {
    const divTags = document.getElementsByTagName('div');
    const meetingIds = new Set();

    for (let i = 0; i < divTags.length; i++) {
      const eventId = divTags[i].getAttribute('data-eventid');

      if (eventId) {
        meetingIds.add(eventId);
      }
    }

    // set is not supported in json serialization, convert to array instead
    return Array.from(meetingIds);
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === GET_ALL_MEETINGS) {
      sendResponse(getAllMeetingIds());
    }
  });
})();
