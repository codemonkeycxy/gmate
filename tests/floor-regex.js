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


rooms.forEach(room => {
  let matchCnt = 0;

  for (let i = 1; i <= 50; i++) {
    const ordinalNum = appendOrdinalSuffix(i);
    const re = new RegExp(`.*-.*[^\\d][0]?${ordinalNum}.*\\(.*`);

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
