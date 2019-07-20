async function getFromLocal(keys) {
  return await new Promise(resolve => chrome.storage.local.get(keys, result => resolve(result)));
}

async function getKeyFromLocal(key, defaultVal) {
  const result = await getFromLocal({[key]: defaultVal});
  return result[key];
}

async function getFromSync(keys) {
  return await new Promise(resolve => chrome.storage.sync.get(keys, result => resolve(result)));
}

async function getKeyFromSync(key, defaultVal) {
  const result = await getFromSync({[key]: defaultVal});
  return result[key];
}

// larger storage space but the data is not synced across Chrome browsers
async function persistLocal(items) {
  await new Promise(resolve => chrome.storage.local.set(items, () => resolve()));
}

async function persistPairLocal(key, val) {
  await persistLocal({[key]: val});
}

// data synced across multiple Chrome browsers, but the storage space is more limited
async function persistSync(items) {
  await new Promise(resolve => chrome.storage.sync.set(items, () => resolve()));
}

async function persistPairSync(key, val) {
  await persistSync({[key]: val});
}

async function incrementSync(key) {
  const oldVal = await getKeyFromSync(key, 0);
  const newVal = oldVal + 1;
  await persistPairSync(key, newVal);

  return newVal;
}