function appendOrdinalSuffix(i) {
  var j = i % 10,
    k = i % 100;
  if (j == 1 && k != 11) {
    return i + "st";
  }
  if (j == 2 && k != 12) {
    return i + "nd";
  }
  if (j == 3 && k != 13) {
    return i + "rd";
  }
  return i + "th";
}

function getFloorSimple(room) {
  for (let i = 1; i <= 50; i++) {
    const ordinalNum = appendOrdinalSuffix(i);
    const re = new RegExp(`.*[-–].*[^\\d][0]?${ordinalNum}`);

    if (room.match(re)) {
      return i;
    }
  }
}

rooms.forEach(room => {
  const floorSimple = getFloorSimple(room);
  let floor;

  const re = new RegExp(`.*[-–].*[^\\d][0]?(\\d+)(st|nd|rd|th)`);
  const matches = room.match(re);
  if (matches && matches.length >= 2 && matches[1]) {
    floor = Number(matches[1]);
  }

  if (floor !== floorSimple) {
    console.log(`${room}. expected: ${floorSimple}, actual: ${floor}`);
  }
});
