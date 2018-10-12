// self-invoking function to avoid name collision
(() => {
  const cssId = 'banner-CSS';
  const bannerIdPrefix = 'gmate-banner';

  function loadBannerCSS() {
    if (document.getElementById(cssId)) {
      return;
    }

    const head = document.getElementsByTagName('head')[0];
    const link = document.createElement('link');
    link.id = cssId;
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = 'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css';
    link.media = 'all';
    head.appendChild(link);
  }

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
    loadBannerCSS();
    injectBanner(level, message);
  }

  onMessage((msg, sender, sendResponse) => {
    if (msg.type === SHOW_BANNER) {
      applyWorkerWarning(msg.data.level, msg.data.message);
    }
  });
})();