async function loadHTMLString(fileName) {
  return await new Promise(
    resolve => fetch(chrome.extension.getURL(fileName))
      .then(response => response.text())
      .then(htmlStr => resolve(htmlStr))
      .catch(error => {
        throw GMateError(error.message);
      })
  );
}

async function loadHTMLElement(fileName) {
  return htmlToElement(await loadHTMLString(fileName));
}

/**
 * reference: https://stackoverflow.com/questions/494143/creating-a-new-dom-element-from-an-html-string-using-built-in-dom-methods-or-pro/35385518#35385518
 * @param {String} html representing a single element
 * @return {Node | null}
 */
function htmlToElement(html) {
  const template = document.createElement('template');
  html = html.trim(); // Never return a text node of whitespace as the result
  template.innerHTML = html;
  return template.content.firstChild;
}