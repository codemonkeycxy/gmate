rooms.forEach(room => {
  let matchCnt = 0;

  for (let i = 1; i <= 200; i++) {
    const re = new RegExp(`.*-.*\\([^\\d]*[0]?${i}[^\\d]*\\)`);

    if (room.match(re)) {
      matchCnt++
    }
  }

  if (matchCnt === 0) {
    console.log(`no match for ${room}`);
  } else if (matchCnt > 1) {
    console.log(`multiple match for ${room}`);
  }
});
