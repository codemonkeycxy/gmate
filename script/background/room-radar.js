/**
 * Room Radar searches for occupied rooms that matches with the searching criteria and display potentially underutilized rooms
 */
(async () => {
  // const eventFilters = {
  //   flexFilters: {
  //     'room-booking-filter-negative': "",
  //     'room-booking-filter-positive-1': "",
  //     'room-booking-filter-uber-floor': "4,5",
  //     'room-booking-filter-uber-location': "SFO | 1455 Market",
  //     'room-booking-filter-uber-need_vc': true,
  //     'room-booking-filter-uber-room_size': "3-15",
  //   },
  //   negFilter: "",
  //   posFilter: "",
  // };
  // const {posFilter, negFilter, flexFilters} = eventFilters;
  //
  // const event = await CalendarAPI.getEventB64('N2owYXM2ZzdxN3N1aDlzdTVpaGM5YmhwYXYgeGlueWlAdWJlci5jb20');
  // const allRooms = await getFullRoomList();
  // const roomCandidates = allRooms.filter(room => matchRoom(room.name, posFilter, negFilter, flexFilters));
  //
  // const busyRooms = await CalendarAPI.pickBusyRooms(event.startStr, event.endStr, roomCandidates.map(room => room.email));
  // console.log(busyRooms);
  // // todo: add sane limit for busy rooms
  // const events = await CalendarAPI.getEventsForRooms(event.startStr, event.endStr, busyRooms);
  // console.log(events);
  // const candidates = events.filter(event => event.name && event.name.includes('1:1'));
  var newWindow = window.open();
  chrome.tabs.create({url: chrome.extension.getURL('template/room-radar.html')});
  // reference: https://stackoverflow.com/questions/16334054/inject-html-into-a-page-from-a-content-script
  fetch(chrome.extension.getURL('template/room-radar.html'))
    .then(response => response.text())
    .then(data => {
      // reference: https://stackoverflow.com/questions/10573404/open-a-new-tab-with-custom-html-instead-of-a-url
      var newWindow = window.open();
      newWindow.document.write(data);
      newWindow.document.getElementById('to-inject').innerText = "injected!";
      // other code
      // eg update injected elements,
      // add event listeners or logic to connect to other parts of the app
  });
})();