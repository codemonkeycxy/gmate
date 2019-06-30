function newList(itemHTMLs) {
  const list = document.createElement('ul');

  itemHTMLs.forEach(htmlStr => {
    const item = htmlToElement(htmlStr);
    list.appendChild(item);
  });

  return list;
}