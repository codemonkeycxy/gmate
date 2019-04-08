const LAST_VERSION = "last-version";
const currVersion = chrome.runtime.getManifest().version;

(async () => {
  const result = await getFromStorageSync({[LAST_VERSION]: null});
  const lastVersion = result[LAST_VERSION];
  persistSync({[LAST_VERSION]: currVersion});

  if (lastVersion === null) {
    // first time install, show the welcome page
    return chrome.tabs.create({url: 'https://www.gmate.us/'});
  }

  if (lastVersion === currVersion) {
    return;
  }

  const versionSettings = VERSIONS[currVersion];
  if (versionSettings && versionSettings.notify && versionSettings.notify.url) {
    chrome.tabs.create({url: versionSettings.notify.url});
  }
})();
