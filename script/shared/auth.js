function _authNotFound() {
  return chrome.runtime.lastError && chrome.runtime.lastError.message.includes('OAuth2 not granted or revoked');
}

async function hasAuth() {
  return await new Promise(
    resolve => chrome.identity.getAuthToken({interactive: false}, token => {
      if (_authNotFound()) {
        return resolve(false);
      }

      resolve(Boolean(token));
    })
  );
}

async function promptAuth() {
  if (chrome.identity) {  // for background script
    return await new Promise(resolve => chrome.identity.getAuthToken({interactive: true}, token => {
      if (chrome.runtime.lastError && chrome.runtime.lastError.message.includes('The user did not approve access')) {
        return resolve(null);
      }

      resolve(token);
    }));
  } else {  // for content script
    return await new Promise(resolve => chrome.runtime.sendMessage(
      null, {type: PROMPT_AUTH}, null, token => resolve(token)
    ));
  }
}

async function getAuthToken() {
  // todo: handle no auth error. send user a notification to ask for auth
  return await new Promise(
    (resolve, reject) => chrome.identity.getAuthToken({interactive: false}, token => {
      if (_authNotFound()) {
        return reject(GMateError('auth not found'));
      }

      return resolve(token);
    })
  );
}