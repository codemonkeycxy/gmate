/**
 * Room Radar searches for occupied rooms that matches with the searching criteria and display potentially underutilized rooms
 */
(async () => {
  const newTab = window.open();
  const dom = newTab.document;
  dom.write(await loadHTML('template/room-radar.html'));
  // todo: inject icon

  // todo: put a sane limit (maybe 5)
  const container = dom.getElementById('underutilized-rooms');
  // this breaks encapsulation by calling a room-raider function. todo: remove this hack
  const eventTasks = getAllEventTasks();
  const task = eventTasks[0];
  const event = await CalendarAPI.getEventB64(task.data.eventId);
  dom.getElementById('owner-event-name').innerText = event.name || 'unnamed event';
  // todo: switch to more readable ts
  dom.getElementById('owner-event-start').innerText = event.startStr;
  dom.getElementById('owner-event-end').innerText = event.endStr;

  const results = await buildResultForEvent(event, task.data.eventFilters);
  // todo: switch to a better looking loader https://www.w3schools.com/howto/howto_css_loader.asp
  const loader = dom.getElementById('loading');
  hide(loader);
  container.appendChild(results);

  async function buildResultForEvent(event, eventFilters) {
    const {posFilter, negFilter, flexFilters} = eventFilters;

    const allRooms = await getFullRoomList();
    const roomCandidates = allRooms.filter(room => matchRoom(room.name, posFilter, negFilter, flexFilters));
    // todo: sanity check array size and fail on too many candidates

    const busyRooms = await CalendarAPI.pickBusyRooms(event.startStr, event.endStr, roomCandidates.map(room => room.email));
    // todo: add sane limit for busy rooms
    const events = await CalendarAPI.getEventsForRooms(event.startStr, event.endStr, busyRooms);
    console.log(events);
    // todo: add "report a problem" for users to report incorrectly identified candidate
    const results = [];

    events.forEach(event => {
      const reason = blah(event);
      if (reason) {
        results.push(wrapUIComponents([
          htmlToElement(`<div><a href=${event.htmlLink} target="_blank">Name: ${event.name || 'unnamed event'}</a></div>`),
          htmlToElement(`<div>Start: ${event.startStr}</div>`),
          htmlToElement(`<div>End: ${event.endStr}</div>`),
          htmlToElement(`<div>Reason: ${reason}</div>`),
          htmlToElement('<br/>'),
        ]));
      }
    });

    return wrapUIComponents(results);
  }

  function blah(event) {
    // todo: large room with few people. make sure to exclude declined. think about maybe and no responded
    if (event.likelyOneOnOne()) {
      return 'likely 1:1';
    }

    // todo: check only the accepted ones? maybe?
    // todo: only return when the creator is the only invitee
    if (event.humanAttendees.length === 1) {
      return 'no invitee';
    }
  }
})();