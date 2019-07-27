function getCapacitySimple(room) {
  for (let i = 1; i <= 500; i++) {
    const re = new RegExp(`.*[-|–].*\\([^\\d]*[0]?${i}[^\\d]*\\)`);

    if (room.match(re)) {
      return i;
    }
  }

  return -1;
}

rooms.forEach(room => {
  const capacitySimple = getCapacitySimple(room);
  let capacity = -1;

  const re = new RegExp(`.*[-|–].*\\([^\\d]*[0]?(\\d+)[^\\d]*\\)`);
  const matches = room.match(re);
  if (matches && matches.length >= 2 && matches[1]) {
    capacity = Number(matches[1]);
  }

  if (capacity !== capacitySimple) {
    console.log(`${room}. expected: ${capacitySimple}, actual: ${capacity}`);
  }
});
