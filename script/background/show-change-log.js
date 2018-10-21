const LAST_VERSION = "last-version";
const currVersion = chrome.runtime.getManifest().version;

getFromStorage({[LAST_VERSION]: null}, result => {
  const lastVersion = result[LAST_VERSION];
  persist({[LAST_VERSION]: currVersion});

  if (lastVersion === null) {
    // first time install, don't show change log
    // todo: show a different welcome page with all features
    return;
  }

  // todo: show version specific page
  chrome.tabs.create({url: `https://github.com/codemonkeycxy/gmate/blob/master/CHANGELOG.md#user-content-${currVersion.replace(/\./gi, "")}`});
});
