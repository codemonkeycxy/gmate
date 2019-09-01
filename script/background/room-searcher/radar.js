/**
 * Room Radar searches for occupied rooms that matches with the searching criteria and display potentially underutilized rooms
 */
// self-invoking function to avoid name collision
(() => {
  onMessageOfType(ROOM_RADAR, async msg => {
    const {eventId} = msg.data;
    const filters = Filters.fromDict(msg.data.eventFilters);
    const newTab = window.open();
    const dom = newTab.document;
    dom.write(await loadHTMLString('template/room-radar.html'));
    // todo: inject icon

    const event = await CalendarAPI.getEventB64(eventId);
    renderMyEventInfo(dom, event);
    await renderTheirEventInfo(dom, event, filters);
  });

  function renderMyEventInfo(dom, event) {
    dom.getElementById('owner-event-name').innerText = event.name || 'unnamed event';
    dom.getElementById('owner-event-start').innerText = prettyDate(event.start);
    dom.getElementById('owner-event-end').innerText = prettyDate(event.end);
  }

  async function renderTheirEventInfo(dom, myEvent, filters) {
    const {fullMatch, partialMatch} = await getLowUtilEvents(myEvent, filters);

    // todo: switch to a better looking loader https://www.w3schools.com/howto/howto_css_loader.asp
    const loader = dom.getElementById('loading');
    hide(loader);

    dom.getElementById('underutilized-rooms-full-match').appendChild(fullMatch);
    dom.getElementById('underutilized-rooms-partial-match').appendChild(partialMatch);
  }

  async function getLowUtilEvents(myEvent, filters) {
    const allRooms = await CalendarAPI.getAllRoomsWithCache();
    const roomCandidates = allRooms.filter(room => filters.matchRoom(room));
    // todo: sanity check array size and fail on too many candidates

    const busyRooms = await CalendarAPI.pickBusyRooms(myEvent.startStr, myEvent.endStr, roomCandidates.map(room => room.email));
    // todo: add sane limit for busy rooms
    const theirEvents = await CalendarAPI.getOwningEventsOfRooms(myEvent.startStr, myEvent.endStr, busyRooms);
    const lowUtilEvents = theirEvents
      .filter(event => lowUtilReason(event))
      // sort precedence: start time, end time, selection reason
      .sort((event1, event2) => (
        event1.start - event2.start
        || event1.end - event2.end
        || lowUtilReason(event1).localeCompare(lowUtilReason(event2)))
      );

    const fullMatch = [];
    const partialMatch = [];

    lowUtilEvents.forEach(theirEvent => {
      const theirEventUI = wrapUIComponents([
        htmlToElement(`<div><a href=${theirEvent.htmlLink} target="_blank">Name: ${theirEvent.name || 'unnamed event'}</a></div>`),
        htmlToElement(`<div>Start: ${prettyDate(theirEvent.start)}</div>`),
        htmlToElement(`<div>End: ${prettyDate(theirEvent.end)}</div>`),
        htmlToElement(`<div>Reason: ${lowUtilReason(theirEvent)}</div>`),
        htmlToElement('<br/>'),
      ]);

      if (theirEvent.start <= myEvent.start && theirEvent.end >= myEvent.end) {
        fullMatch.push(theirEventUI);
      } else {
        partialMatch.push(theirEventUI);
      }
    });

    // todo: expand wrapUIComponents to support multiple columns
    return {
      fullMatch: wrapUIComponents(fullMatch),
      partialMatch: wrapUIComponents(partialMatch)
    }
  }

  function lowUtilReason(event) {
    // todo: think about private meetings
    // todo: large room with few people. make sure to exclude declined. think about maybe and no responded
    // one issue with ^ is calendar api doesn't offer a way to expand group attendee to individuals (https://stackoverflow.com/questions/51315459/google-calendar-api-group-attendee-emails)
    // that makes it hard to do room size comparison accurately
    if (event.likelyOneOnOne()) {
      return 'likely 1:1';
    }

    const attendeeCnt = event.humanAttendees.length;
    const noInvitee = attendeeCnt === 0;
    const organizerOnly = attendeeCnt === 1 && event.humanAttendees[0].isOrganizer;
    if (noInvitee || organizerOnly) {
      return 'no invitee';
    }

    return null;
  }
})();