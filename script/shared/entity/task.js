const TASK_TYPE = {
  NAP: "nap",
  EVENT: "event"
};

function EventTask({eventId, eventName, eventFilters, preferredRooms}) {
  return {
    id: nextId(),
    type: TASK_TYPE.EVENT,
    data: {
      eventId: eventId,
      eventName: eventName,
      eventFilters: eventFilters,
      preferredRooms: preferredRooms || [],
    }
  };
}

function NapTask() {
  return {
    id: nextId(),
    type: TASK_TYPE.NAP
  }
}