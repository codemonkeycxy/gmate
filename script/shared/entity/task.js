const TASK_TYPE = {
  NAP: "nap",
  EVENT: "event"
};

function EventTask({eventId, eventName, eventFilters, preferredRooms, excludedRooms}) {
  return {
    id: nextId(),
    type: TASK_TYPE.EVENT,
    data: {
      eventId: eventId,
      eventName: eventName,
      eventFilters: eventFilters.toDict(),
      preferredRooms: preferredRooms || [],
      excludedRooms: excludedRooms || []
    }
  };
}

function NapTask() {
  return {
    id: nextId(),
    type: TASK_TYPE.NAP
  }
}