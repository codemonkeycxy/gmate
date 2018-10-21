// self-invoking function to avoid name collision
(() => {
  const overlayId = 'overlay';

  function addOverlay() {
    if (document.getElementById(overlayId)) {
      return;
    }

    const overlay = document.createElement("div");
    overlay.id = overlayId;
    overlay.style.position = 'fixed';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.right = '0';
    overlay.style.bottom = '0';
    overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
    overlay.style.zIndex = '99999';
    overlay.style.cursor = 'pointer';

    insertBefore(overlay, document.body.firstChild);
  }

  onMessage((msg, sender, sendResponse) => {
    if (msg.type === ADD_OVERLAY) {
      addOverlay();
    }
  });
})();