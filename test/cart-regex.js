rooms.forEach(room => {
  const hasCartSimple = room.toLowerCase().includes('cart');
  const re = new RegExp('\\b(Cart|cart)\\b');
  const hasCart = !!room.match(re);

  if (hasCartSimple !== hasCart) {
    console.log(`${room}. expected: ${hasCartSimple}, actual: ${hasCart}`);
  }
});
