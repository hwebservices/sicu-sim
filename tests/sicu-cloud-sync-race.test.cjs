const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync(new URL('../sicu-cloud-sync.js', `file://${__filename}`), 'utf8')
  .replace(/^import[\s\S]*?;\s*/gm, '');

function makeHarness() {
  const elements = new Map();
  const storage = new Map();
  let authChanged;
  let cloud = null;
  let readGate = null;
  let reads = 0;
  let writes = 0;

  class FakeElement {
    constructor(value = '') {
      this.value = value;
      this.checked = false;
      this.hidden = false;
      this.disabled = false;
      this.textContent = '';
      this.style = {};
      this.handlers = {};
    }
    addEventListener(type, handler) { this.handlers[type] = handler; }
  }

  const get = (id) => {
    if (!elements.has(id)) elements.set(id, new FakeElement());
    return elements.get(id);
  };
  const slot = get('case-patient-slot');
  slot.value = '1';
  const title = new FakeElement('base');
  title.name = 'title';
  const form = get('case-form');
  form.elements = [title];
  get('case-med-list').children = [];

  const snapshot = (document) => ({
    exists: () => Boolean(document),
    data: () => document,
  });
  const database = {};
  const sandbox = {
    console,
    TextEncoder,
    Uint8Array,
    document: { getElementById: get },
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    },
    window: {
      confirm: () => true,
      setTimeout: (callback) => { callback(); return 1; },
      location: { reload() {} },
    },
    initializeApp: () => ({}),
    GoogleAuthProvider: class { setCustomParameters() {} },
    getAuth: () => ({}),
    onAuthStateChanged: (_auth, callback) => { authChanged = callback; },
    signInWithPopup: async () => {},
    signOut: async () => {},
    doc: (_db, ...path) => path,
    getDoc: async () => { reads += 1; return snapshot(cloud); },
    getFirestore: () => database,
    serverTimestamp: () => 'server-time',
    runTransaction: async (_db, callback) => {
      let staged = null;
      const result = await callback({
        get: async () => {
          if (readGate) await readGate.promise;
          return snapshot(cloud);
        },
        set: (_ref, document) => { staged = document; },
      });
      if (staged) {
        writes += 1;
        cloud = staged;
      }
      return result;
    },
    setTimeout: (callback) => { callback(); return 1; },
  };
  vm.runInNewContext(source, sandbox, { filename: 'sicu-cloud-sync.js' });

  const base = { values: { title: 'base' }, medicationCount: 0 };
  cloud = { record: base };

  return {
    elements,
    title,
    slot,
    get cloud() { return cloud; },
    set cloud(value) { cloud = value; },
    get reads() { return reads; },
    get writes() { return writes; },
    setReadGate(promise) { readGate = promise; },
    async signIn() {
      await authChanged({ uid: 'owner-uid', email: 'hwebservices80@gmail.com', emailVerified: true });
    },
    async signOut() {
      await authChanged(null);
    },
  };
}

async function run() {
  const app = makeHarness();
  const cloudButton = app.elements.get('case-cloud-check');
  const uploadButton = app.elements.get('case-cloud-upload');
  const replaceButton = app.elements.get('case-cloud-replace');
  app.elements.get('case-cloud-fictional').checked = true;
  await app.signIn();
  await cloudButton.handlers.click();
  assert.equal(app.reads, 1, 'initial check should read the existing cloud baseline');

  app.title.value = 'local edit';
  let releaseTransactionRead;
  const transactionRead = new Promise((resolve) => { releaseTransactionRead = resolve; });
  app.setReadGate(transactionRead);
  const upload = uploadButton.handlers.click();
  assert.equal(app.elements.get('case-cloud-check').disabled, true, 'other sync controls lock during upload');

  app.cloud = { record: { values: { title: 'remote new' }, medicationCount: 0 } };
  await cloudButton.handlers.click();
  assert.equal(app.reads, 1, 'a concurrent cloud check must not run during upload');
  releaseTransactionRead();
  await upload;
  assert.equal(app.writes, 0, 'changed remote data must not be overwritten');
  assert.equal(app.cloud.record.values.title, 'remote new');
  assert.match(app.elements.get('case-cloud-status').textContent, /changed while you were reviewing/i);

  let releaseSecondRead;
  const secondRead = new Promise((resolve) => { releaseSecondRead = resolve; });
  app.setReadGate(secondRead);
  const replace = replaceButton.handlers.click();
  app.slot.value = '2';
  await app.slot.handlers.change();
  releaseSecondRead();
  await replace;
  assert.equal(app.writes, 0, 'a stale slot selection must not write');
  assert.equal(app.cloud.record.values.title, 'remote new');

  const accountApp = makeHarness();
  accountApp.elements.get('case-cloud-fictional').checked = true;
  await accountApp.signIn();
  await accountApp.elements.get('case-cloud-check').handlers.click();
  accountApp.title.value = 'local account edit';
  let releaseAccountRead;
  const accountRead = new Promise((resolve) => { releaseAccountRead = resolve; });
  accountApp.setReadGate(accountRead);
  const accountUpload = accountApp.elements.get('case-cloud-upload').handlers.click();
  await accountApp.signOut();
  releaseAccountRead();
  await accountUpload;
  assert.equal(accountApp.writes, 0, 'a changed signed-in account must not write');
  assert.equal(accountApp.cloud.record.values.title, 'base');
  console.log('SICU cloud sync race regression passed.');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
