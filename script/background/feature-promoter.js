/**
 * Feature Promoter listens to user actions and intelligently suggests potentially unnoticed features
 */
// self-invoking function to avoid name collision
(() => {
  onMessageOfType(ROOM_TO_BE_FULFILLED, async msg => {
    const TRIGGER_POINTS = [10, 20, 40, 80, 120, 160];
    const searchRoomClickCnt = await getKeyFromSync(SEARCH_ROOM_BTN_CLICKED, 0);
    const roomRadarClickCnt = await getKeyFromSync(ROOM_RADAR_BTN_CLICKED, 0);

    if (TRIGGER_POINTS.includes(searchRoomClickCnt) && roomRadarClickCnt === 0) {
      chrome.tabs.create({url: 'https://www.gmate.us/faq/tips-of-the-day/room-radar'});
    }
  });
})();