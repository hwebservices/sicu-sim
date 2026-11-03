const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync(new URL('../sicu-cloud-sync.js', `file://${__filename}`), 'utf8')
  .replace(/^import[\s\S]*?;\s*/gm, '');

function makeHarness({ initialCloud } = {}) {
  const elements = new Map();
  const storage = new Map();
  let authChanged;
  const base = { values: { title: 'base' }, medicationCount: 0 };
  let cloud = initialCloud === undefined ? { schemaVersion: 1, record: base, clientUpdatedAt: 1 } : initialCloud;
  let readGate = null;
  let reads = 0;
  let writes = 0;
  let throwOnStorageKey = null;
  let pendingLocalSave = null;
  let throwInDraftImport = false;
  const draftEvents = [];
  const windowHandlers = new Map();
  const navigator = { onLine: true };
  const refs = [];

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
    removeItem: (key) => storage.delete(key),
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
      removeItem: localStorage.removeItem,
    },
    navigator,
    CustomEvent: class { constructor(type, init = {}) { this.type = type; this.detail = init.detail; } },
    window: {
      confirm: () => true,
      setTimeout: (callback) => { callback(); return 1; },
      location: { reload() {} },
      dispatchEvent: (event) => { for (const handler of windowHandlers.get(event.type) || []) handler(event); },
      addEventListener: (type, handler) => { const handlers = windowHandlers.get(type) || []; handlers.push(handler); windowHandlers.set(type, handlers); },
      sicuCaseDraftController: {
        replaceFromCloud: (n, record) => {
          if (pendingLocalSave) {
            draftEvents.push('flush-pending-local-save');
            pendingLocalSave();
            pendingLocalSave = null;
          }
          if (throwInDraftImport) throw new Error('draft-import-failed');
          localStorage.setItem(`sicuCasePacketPatient${n}`, JSON.stringify(record));
          if (record.values?.title !== undefined) title.value = record.values.title;
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
    doc: (_db, ...path) => { refs.push(path); return path; },
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
    get refs() { return refs; },
    get navigator() { return navigator; },
    emit(type, detail) { for (const handler of windowHandlers.get(type) || []) handler({ type, detail }); },
    async settle() { for (let i = 0; i < 10; i += 1) await Promise.resolve(); },
    setReadGate(promise) { readGate = promise; },
    setThrowOnStorageKey(key) { throwOnStorageKey = key; },
    setThrowInDraftImport(value) { throwInDraftImport = value; },
    queuePendingLocalSave(callback) { pendingLocalSave = callback; },
    runPendingLocalSave() { if (pendingLocalSave) pendingLocalSave(); },
    get hasPendingLocalSave() { return Boolean(pendingLocalSave); },
    async signInAs(user) { await authChanged(user); },
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

  const conflictDownloadApp = makeHarness();
  conflictDownloadApp.elements.get('case-cloud-fictional').checked = true;
  await conflictDownloadApp.signIn();
  await conflictDownloadApp.elements.get('case-cloud-check').handlers.click();
  const priorBaseline = conflictDownloadApp.storage.get('sicuCloudBaselinePatient1');
  conflictDownloadApp.title.value = 'local conflict edit';
  conflictDownloadApp.cloud = { schemaVersion: 1, record: { values: { title: 'remote conflict edit' }, medicationCount: 0 }, clientUpdatedAt: 4 };
  await conflictDownloadApp.elements.get('case-cloud-check').handlers.click();
  assert.equal(conflictDownloadApp.elements.get('case-cloud-upload').disabled, true, 'both-side edits require explicit conflict resolution');
  conflictDownloadApp.setThrowInDraftImport(true);
  await conflictDownloadApp.elements.get('case-cloud-download').handlers.click();
  assert.equal(conflictDownloadApp.storage.get('sicuCloudBaselinePatient1'), priorBaseline, 'failed import preserves the prior sync baseline');
  assert.equal(conflictDownloadApp.title.value, 'local conflict edit', 'failed import preserves the visible local record');
  assert.equal(conflictDownloadApp.elements.get('case-cloud-upload').disabled, true, 'failed import keeps conflict unresolved');
  assert.equal(conflictDownloadApp.elements.get('case-cloud-replace').hidden, false, 'conflict resolution remains explicit after failed import');

  const baselineFailureApp = makeHarness();
  baselineFailureApp.elements.get('case-cloud-fictional').checked = true;
  await baselineFailureApp.signIn();
  await baselineFailureApp.elements.get('case-cloud-check').handlers.click();
  baselineFailureApp.setThrowOnStorageKey('sicuCloudBaselinePatient1');
  await baselineFailureApp.elements.get('case-cloud-download').handlers.click();
  assert.equal(JSON.parse(baselineFailureApp.storage.get('sicuCasePacketPatient1')).values.title, 'base', 'successful import remains local when baseline storage fails');
  assert.equal(baselineFailureApp.elements.get('case-cloud-upload').disabled, true, 'baseline failure requires a fresh cloud check before syncing');
  assert.match(baselineFailureApp.elements.get('case-cloud-status').textContent, /loaded locally, but sync status could not be saved/i);

  async function enableAutomaticSync(target) {
    await target.signIn();
    target.elements.get('case-cloud-fictional').checked = true;
    target.elements.get('case-cloud-autosync').checked = true;
    target.elements.get('case-cloud-autosync').handlers.change();
    await target.settle();
  }
  function editSyntheticDraft(target, title, editedAt) {
    target.title.value = title;
    target.emit('sicu-local-draft-changed', {
      slot: '1',
      record: { values: { title }, medicationCount: 0 },
      editedAt,
    });
  }

  const automaticSaveApp = makeHarness({ initialCloud: null });
  await enableAutomaticSync(automaticSaveApp);
  assert.equal(automaticSaveApp.writes, 0, 'enabling automatic sync must not upload an existing local draft');
  const enabledConsent = JSON.parse(automaticSaveApp.storage.get('sicuCloudAutoSyncConsentV1:owner-uid:patient-1'));
  editSyntheticDraft(automaticSaveApp, 'synthetic edit after opt-in', enabledConsent.enabledAt + 10);
  await automaticSaveApp.settle();
  assert.equal(automaticSaveApp.writes, 1, 'a later fictional edit should upload automatically');
  assert.equal(automaticSaveApp.cloud.record.values.title, 'synthetic edit after opt-in');
  assert.deepEqual(automaticSaveApp.refs.at(-1), ['users', 'owner-uid', 'sicuCasePackets', 'patient-1'], 'automatic sync stays in the owner UID path');
  assert.equal(automaticSaveApp.storage.has('sicuCloudAutoSyncQueueV1:owner-uid:patient-1'), false, 'successful sync clears the durable queue');

  const preOptInApp = makeHarness({ initialCloud: null });
  await preOptInApp.signIn();
  preOptInApp.elements.get('case-cloud-fictional').checked = true;
  preOptInApp.title.value = 'existing local synthetic edit';
  preOptInApp.elements.get('case-cloud-autosync').checked = true;
  preOptInApp.elements.get('case-cloud-autosync').handlers.change();
  await preOptInApp.settle();
  const preOptInConsent = JSON.parse(preOptInApp.storage.get('sicuCloudAutoSyncConsentV1:owner-uid:patient-1'));
  preOptInApp.emit('sicu-local-draft-changed', {
    slot: '1', record: { values: { title: 'existing local synthetic edit' }, medicationCount: 0 },
    editedAt: preOptInConsent.enabledAt - 10,
  });
  await preOptInApp.settle();
  assert.equal(preOptInApp.writes, 0, 'a debounced edit made before opt-in is never uploaded after opt-in');
  assert.equal(preOptInApp.storage.has('sicuCloudAutoSyncQueueV1:owner-uid:patient-1'), false);

  const offlineApp = makeHarness();
  await enableAutomaticSync(offlineApp);
  const offlineConsent = JSON.parse(offlineApp.storage.get('sicuCloudAutoSyncConsentV1:owner-uid:patient-1'));
  offlineApp.navigator.onLine = false;
  editSyntheticDraft(offlineApp, 'synthetic edit while offline', offlineConsent.enabledAt + 10);
  assert.equal(offlineApp.writes, 0, 'offline edits remain local');
  assert.equal(offlineApp.storage.has('sicuCloudAutoSyncQueueV1:owner-uid:patient-1'), true, 'offline edit is durably queued');
  assert.match(offlineApp.elements.get('case-cloud-status').textContent, /Offline.*queued/i);
  offlineApp.navigator.onLine = true;
  offlineApp.emit('online');
  await offlineApp.settle();
  assert.equal(offlineApp.writes, 1, 'reconnection flushes the queued fictional edit');
  assert.equal(offlineApp.cloud.record.values.title, 'synthetic edit while offline');
  assert.equal(offlineApp.storage.has('sicuCloudAutoSyncQueueV1:owner-uid:patient-1'), false);

  const autoRestoreApp = makeHarness();
  await enableAutomaticSync(autoRestoreApp);
  autoRestoreApp.cloud = { schemaVersion: 1, record: { values: { title: 'remote newer synthetic' }, medicationCount: 0 }, clientUpdatedAt: 2 };
  autoRestoreApp.emit('online');
  await autoRestoreApp.settle();
  assert.equal(autoRestoreApp.title.value, 'remote newer synthetic', 'newer cloud data restores when local still matches its baseline');
  assert.equal(JSON.parse(autoRestoreApp.storage.get('sicuCasePacketPatient1')).values.title, 'remote newer synthetic');
  assert.match(autoRestoreApp.elements.get('case-cloud-status').textContent, /safely restored/i);

  const unknownBaselineApp = makeHarness();
  unknownBaselineApp.cloud = { schemaVersion: 1, record: { values: { title: 'other device synthetic' }, medicationCount: 0 }, clientUpdatedAt: 2 };
  await enableAutomaticSync(unknownBaselineApp);
  assert.equal(unknownBaselineApp.title.value, 'base', 'first-time cloud differences never replace an unknown local draft automatically');
  assert.equal(unknownBaselineApp.writes, 0);
  assert.equal(unknownBaselineApp.elements.get('case-cloud-download').disabled, false, 'the owner can explicitly review and load the first cloud copy');

  const uploadConflictApp = makeHarness({ initialCloud: null });
  await enableAutomaticSync(uploadConflictApp);
  let releaseAutoRead;
  const autoRead = new Promise((resolve) => { releaseAutoRead = resolve; });
  uploadConflictApp.setReadGate(autoRead);
  const autoConsent = JSON.parse(uploadConflictApp.storage.get('sicuCloudAutoSyncConsentV1:owner-uid:patient-1'));
  editSyntheticDraft(uploadConflictApp, 'local queued synthetic', autoConsent.enabledAt + 10);
  await uploadConflictApp.settle();
  uploadConflictApp.cloud = { schemaVersion: 1, record: { values: { title: 'other device update' }, medicationCount: 0 }, clientUpdatedAt: 5 };
  releaseAutoRead();
  await uploadConflictApp.settle();
  assert.equal(uploadConflictApp.writes, 0, 'a remote write during an offline/queued save is never overwritten');
  assert.equal(uploadConflictApp.cloud.record.values.title, 'other device update');
  assert.equal(uploadConflictApp.storage.has('sicuCloudAutoSyncQueueV1:owner-uid:patient-1'), true, 'conflicting local edits remain queued locally');
  assert.match(uploadConflictApp.elements.get('case-cloud-status').textContent, /cloud copy changed.*Nothing was overwritten/i);

  const wrongAccountApp = makeHarness({ initialCloud: null });
  await wrongAccountApp.signInAs({ uid: 'other-uid', email: 'other@example.com', emailVerified: true });
  assert.equal(wrongAccountApp.elements.get('case-cloud-signin').hidden, false, 'a non-owner account is rejected and remains signed out');
  assert.equal(wrongAccountApp.elements.get('case-cloud-autosync').disabled, true);
  assert.equal(wrongAccountApp.reads, 0, 'a non-owner account cannot read the cloud copy');
  assert.equal(wrongAccountApp.writes, 0, 'a non-owner account cannot write a cloud copy');

  const html = fs.readFileSync(new URL('../index.html', `file://${__filename}`), 'utf8');
  assert.match(html, /<script type="module" src="\.\/sicu-cloud-sync\.js"><\/script>/, 'the full-form branch loads the approved owner-only sync module');
  assert.match(html, /id="case-cloud-autosync"/, 'the record-level automatic sync choice is present');
  assert.match(html, /sicu-local-draft-changed/, 'a saved user edit notifies the sync queue');
  const draftController = html.slice(html.indexOf('window.sicuCaseDraftController='), html.indexOf("slot.addEventListener('change'"));
  assert.match(draftController, /clearTimeout\(saveTimer\);saveTimer=0;const isEdited=pendingEdited,editedAt=pendingEditAt;pendingEdited=false;pendingEditAt=0;if\(!writeRecordNow\(\{edited:isEdited,editedAt\}\)\)throw new Error\('local-save-failed'\)/);
  assert.match(html, /pendingEditAt=Date\.now\(\)/, 'edit time is captured before the debounce so pre-opt-in edits cannot be uploaded');
  assert.ok(draftController.indexOf('writeRecordNow()') < draftController.indexOf('localStorage.setItem(storageKey(n),JSON.stringify(record))'), 'pending local saves flush before the cloud record replaces them');
  console.log('SICU cloud sync race regression passed.');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
