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
  let throwOnStorageKey = null;
  let pendingLocalSave = null;
  const draftEvents = [];

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

  const localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => {
      if (key === throwOnStorageKey) throw new Error('quota-exceeded');
      storage.set(key, value);
    },
  };
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
      getItem: localStorage.getItem,
      setItem: localStorage.setItem,
    },
    window: {
      confirm: () => true,
      setTimeout: (callback) => { callback(); return 1; },
      location: { reload() {} },
      sicuCaseDraftController: {
        replaceFromCloud: (n, record) => {
          if (pendingLocalSave) {
            draftEvents.push('flush-pending-local-save');
            pendingLocalSave();
            pendingLocalSave = null;
          }
          localStorage.setItem(`sicuCasePacketPatient${n}`, JSON.stringify(record));
          draftEvents.push('replace-with-cloud-record');
        },
      },
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
          if (readGate) await readGate;
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
  cloud = { schemaVersion: 1, record: base, clientUpdatedAt: 1 };

  return {
    elements,
    title,
    slot,
    get cloud() { return cloud; },
    set cloud(value) { cloud = value; },
    get reads() { return reads; },
    get writes() { return writes; },
    get storage() { return storage; },
    get draftEvents() { return draftEvents; },
    setReadGate(promise) { readGate = promise; },
    setThrowOnStorageKey(key) { throwOnStorageKey = key; },
    queuePendingLocalSave(callback) { pendingLocalSave = callback; },
    runPendingLocalSave() { if (pendingLocalSave) pendingLocalSave(); },
    get hasPendingLocalSave() { return Boolean(pendingLocalSave); },
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

  app.cloud = { schemaVersion: 1, record: { values: { title: 'remote new' }, medicationCount: 0 }, clientUpdatedAt: 2 };
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

  const malformedApp = makeHarness();
  malformedApp.cloud = { schemaVersion: 2, record: { values: { title: 'malformed' }, medicationCount: 0 }, clientUpdatedAt: 3 };
  await malformedApp.signIn();
  await malformedApp.elements.get('case-cloud-check').handlers.click();
  assert.match(malformedApp.elements.get('case-cloud-status').textContent, /unsupported or malformed/i);
  assert.equal(malformedApp.elements.get('case-cloud-download').disabled, true, 'malformed cloud data cannot be downloaded');
  assert.equal(malformedApp.elements.get('case-cloud-replace').hidden, false, 'malformed cloud data requires explicit replacement review');

  const downloadApp = makeHarness();
  await downloadApp.signIn();
  await downloadApp.elements.get('case-cloud-check').handlers.click();
  const originalDraft = JSON.stringify({ values: { title: 'local-before-cloud' }, medicationCount: 0 });
  downloadApp.storage.set('sicuCasePacketPatient1', originalDraft);
  downloadApp.queuePendingLocalSave(() => downloadApp.storage.set('sicuCasePacketPatient1', JSON.stringify({ values: { title: 'pending-local-save' }, medicationCount: 0 })));
  await downloadApp.elements.get('case-cloud-download').handlers.click();
  assert.deepEqual(downloadApp.draftEvents, ['flush-pending-local-save', 'replace-with-cloud-record']);
  assert.equal(JSON.parse(downloadApp.storage.get('sicuCasePacketPatient1')).values.title, 'base');
  downloadApp.runPendingLocalSave();
  assert.equal(JSON.parse(downloadApp.storage.get('sicuCasePacketPatient1')).values.title, 'base', 'a stale queued save must not replace the imported cloud record');
  assert.equal(downloadApp.hasPendingLocalSave, false);

  const storageFailureApp = makeHarness();
  await storageFailureApp.signIn();
  await storageFailureApp.elements.get('case-cloud-check').handlers.click();
  const preservedDraft = JSON.stringify({ values: { title: 'must-survive' }, medicationCount: 0 });
  storageFailureApp.storage.set('sicuCasePacketPatient1', preservedDraft);
  storageFailureApp.setThrowOnStorageKey('sicuCasePacketPatient1');
  await storageFailureApp.elements.get('case-cloud-download').handlers.click();
  assert.equal(storageFailureApp.elements.get('case-patient-slot').disabled, false, 'storage failures unlock record selection');
  assert.match(storageFailureApp.elements.get('case-cloud-status').textContent, /Cloud load failed/);
  assert.equal(storageFailureApp.storage.get('sicuCasePacketPatient1'), preservedDraft, 'failed storage writes preserve the prior draft');

  const html = fs.readFileSync(new URL('../index.html', `file://${__filename}`), 'utf8');
  const draftController = html.slice(html.indexOf('window.sicuCaseDraftController='), html.indexOf("slot.addEventListener('change'"));
  assert.match(draftController, /clearTimeout\(saveTimer\);saveTimer=0;if\(!writeRecordNow\(\)\)throw new Error\('local-save-failed'\)/);
  assert.ok(draftController.indexOf('writeRecordNow()') < draftController.indexOf('localStorage.setItem(storageKey(n),JSON.stringify(record))'), 'pending local saves flush before the cloud record replaces them');
  console.log('SICU cloud sync race regression passed.');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
