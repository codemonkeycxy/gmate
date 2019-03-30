// self-invoking function to avoid name collision
(() => {
  const bannerIdPrefix = 'gmate-banner';

  function injectBanner(level, message) {
    const id = `${bannerIdPrefix}-${level}-${message}`;
    if (document.getElementById(id)) {
      return;
    }

    const banner = document.createElement("div");
    banner.id = id;
    banner.className = `alert alert-${level}`;
    banner.innerHTML = message;
    document.body.insertBefore(banner, document.body.childNodes[0]);
  }

  function applyWorkerWarning(level, message) {
    injectCss('https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css');
    injectBanner(level, message);
  }

  onMessage((msg, sender, sendResponse) => {
    if (msg.type === SHOW_BANNER) {
      applyWorkerWarning(msg.data.level, msg.data.message);
    }
  });
})();