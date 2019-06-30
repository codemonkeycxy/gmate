/**
 * Room Radar searches for occupied rooms that matches with the searching criteria and display potentially underutilized rooms
 */
(async () => {
  const newTab = window.open();
  const dom = newTab.document;
  dom.write(await loadHTML('template/room-radar.html'));
  // todo: add a loader while the async call happens https://www.w3schools.com/howto/howto_css_loader.asp
  // todo: inject icon

  // todo: put a sane limit (maybe 5)
  const container = dom.getElementById('underutilized-rooms');
  // this breaks encapsulation by calling a room-raider function. todo: remove this hack
  const eventTasks = getAllEventTasks();
  container.appendChild(await buildResultForEvent(eventTasks[0].data.eventId, eventTasks[0].data.eventFilters));

  async function buildResultForEvent(eventId, eventFilters) {
    const {posFilter, negFilter, flexFilters} = eventFilters;
    const event = await CalendarAPI.getEventB64(eventId);

    const allRooms = await getFullRoomList();
    const roomCandidates = allRooms.filter(room => matchRoom(room.name, posFilter, negFilter, flexFilters));

    const busyRooms = await CalendarAPI.pickBusyRooms(event.startStr, event.endStr, roomCandidates.map(room => room.email));
    console.log(busyRooms);
    // todo: add sane limit for busy rooms
    const events = await CalendarAPI.getEventsForRooms(event.startStr, event.endStr, busyRooms);
    console.log(events);
    const candidates = events.filter(event => event.name && event.name.includes('1:1'));

    const myEvent = htmlToElement(`<p>${event.name}</p>`);
    const theirEvents = newList(candidates.map(event =>
      `<li>
        <a href=${event.htmlLink} target="_blank">
            ${event.name || 'unnamed event'}
        </a>
    </li>`
    ));

    return wrapUIComponents([myEvent, theirEvents]);
  }
})();