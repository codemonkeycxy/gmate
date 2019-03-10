rooms.forEach(room => {
  const hasVcSimple = room.includes('VC');
  const re = new RegExp('.*-.*\\(.*VC.*\\)');
  const hasVcRe = !!room.match(re);

  if (hasVcSimple !== hasVcRe) {
    console.log(`${room}. expected: ${hasVcSimple}, actual: ${hasVcRe}`);
  }
});
