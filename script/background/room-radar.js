/**
 * Room Radar searches for occupied rooms that matches with the searching criteria and display potentially underutilized rooms
 */
(async () => {
  const newTab = window.open();
  const dom = newTab.document;
  dom.write(await loadHTML('template/room-radar.html'));
  // todo: add a loader while the async call happens https://www.w3schools.com/howto/howto_css_loader.asp
  // todo: inject icon

  const eventFilters = {
    flexFilters: {
      'room-booking-filter-negative': "",
      'room-booking-filter-positive-1': "",
      'room-booking-filter-uber-floor': "4,5",
      'room-booking-filter-uber-location': "SFO | 1455 Market",
      'room-booking-filter-uber-need_vc': true,
      'room-booking-filter-uber-room_size': "3-15",
    },
    negFilter: "",
    posFilter: "",
  };
  const {posFilter, negFilter, flexFilters} = eventFilters;

  const event = await CalendarAPI.getEventB64('N2owYXM2ZzdxN3N1aDlzdTVpaGM5YmhwYXYgeGlueWlAdWJlci5jb20');
  const allRooms = await getFullRoomList();
  const roomCandidates = allRooms.filter(room => matchRoom(room.name, posFilter, negFilter, flexFilters));

  const busyRooms = await CalendarAPI.pickBusyRooms(event.startStr, event.endStr, roomCandidates.map(room => room.email));
  console.log(busyRooms);
  // todo: add sane limit for busy rooms
  const events = await CalendarAPI.getEventsForRooms(event.startStr, event.endStr, busyRooms);
  console.log(events);
  const candidates = events.filter(event => event.name && event.name.includes('1:1'));

  const list = dom.createElement('ul');
  candidates.forEach(event => {
    const item = htmlToElement('<li><a href="https://www.google.com" target="_blank">${event.name}</li>');
    console.log(item);
    list.appendChild(item);
  });
  dom.getElementById('to-inject').appendChild(list);
})();