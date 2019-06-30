// /**
//  * Room Radar searches for occupied rooms that matches with the searching criteria and display potentially underutilized rooms
//  */
// // self-invoking function to avoid name collision
// (async () => {
//   function renderMyEventInfo(dom, event) {
//     dom.getElementById('owner-event-name').innerText = event.name || 'unnamed event';
//     dom.getElementById('owner-event-start').innerText = prettyDate(event.start);
//     dom.getElementById('owner-event-end').innerText = prettyDate(event.end);
//   }
//
//   async function renderTheirEventInfo(dom, event, eventFilters) {
//     const theirEventInfo = await getLowUtilEvents(event, eventFilters);
//
//     // todo: switch to a better looking loader https://www.w3schools.com/howto/howto_css_loader.asp
//     const loader = dom.getElementById('loading');
//     hide(loader);
//
//     dom.getElementById('underutilized-rooms').appendChild(theirEventInfo);
//   }
//
//   async function getLowUtilEvents(event, eventFilters) {
//     const {posFilter, negFilter, flexFilters} = eventFilters;
//
//     const allRooms = await getFullRoomList();
//     const roomCandidates = allRooms.filter(room => matchRoom(room.name, posFilter, negFilter, flexFilters));
//     // todo: sanity check array size and fail on too many candidates
//
//     const busyRooms = await CalendarAPI.pickBusyRooms(event.startStr, event.endStr, roomCandidates.map(room => room.email));
//     // todo: add sane limit for busy rooms
//     const theirEvents = await CalendarAPI.getEventsForRooms(event.startStr, event.endStr, busyRooms);
//     // todo: add "report a problem" for users to report incorrectly identified candidate
//     const lowUtilEvents = theirEvents
//       .filter(event => lowUtilReason(event))
//       .sort((event1, event2) => lowUtilReason(event1).localeCompare(lowUtilReason(event2)));
//
//     const components = lowUtilEvents.map(event =>
//       wrapUIComponents([
//         htmlToElement(`<div><a href=${event.htmlLink} target="_blank">Name: ${event.name || 'unnamed event'}</a></div>`),
//         htmlToElement(`<div>Start: ${prettyDate(event.start)}</div>`),
//         htmlToElement(`<div>End: ${prettyDate(event.end)}</div>`),
//         htmlToElement(`<div>Reason: ${lowUtilReason(event)}</div>`),
//         htmlToElement('<br/>'),
//       ])
//     );
//
//     // todo: prefer exact time match
//     // todo: expand wrapUIComponents to support multiple columns
//     return wrapUIComponents(components);
//   }
//
//   function lowUtilReason(event) {
//     // todo: think about private meetings
//     // todo: large room with few people. make sure to exclude declined. think about maybe and no responded
//     // to do the ^ comparison, need to know the room capacity, need to parse info from g suite response and standardize
//     if (event.likelyOneOnOne()) {
//       return 'likely 1:1';
//     }
//
//     const attendeeCnt = event.humanAttendees.length;
//     const noInvitee = attendeeCnt === 0;
//     const organizerOnly = attendeeCnt === 1 && event.humanAttendees[0].isOrganizer;
//     if (noInvitee || organizerOnly) {
//       return 'no invitee';
//     }
//
//     return null;
//   }
//
//   (async function main() {
//     const newTab = window.open();
//     const dom = newTab.document;
//     dom.write(await loadHTML('template/room-radar.html'));
//     // todo: inject icon
//
//     // this breaks encapsulation by calling a room-raider function. todo: remove this hack
//     const eventTasks = getAllEventTasks();
//     const task = eventTasks[0];
//     const event = await CalendarAPI.getEventB64(task.data.eventId);
//
//     renderMyEventInfo(dom, event);
//     await renderTheirEventInfo(dom, event, task.data.eventFilters);
//   })();
// })();