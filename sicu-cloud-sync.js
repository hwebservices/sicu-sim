import { initializeApp } from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js';
import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js';
import {
  doc,
  getDoc,
  getFirestore,
  runTransaction,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js';

const allowedEmail = 'hwebservices80@gmail.com';
const firebaseConfig = {
  apiKey: 'AIzaSyAIi8ylO5OYu5BhFuO5kifj-fyoTF6wyQE',
  authDomain: 'sicu-case-packets-henry-2026.firebaseapp.com',
  projectId: 'sicu-case-packets-henry-2026',
  storageBucket: 'sicu-case-packets-henry-2026.firebasestorage.app',
  messagingSenderId: '270103589959',
  appId: '1:270103589959:web:480510aefe51fd8553ad62',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const google = new GoogleAuthProvider();
google.setCustomParameters({ prompt: 'select_account' });

const slot = document.getElementById('case-patient-slot');
const form = document.getElementById('case-form');
const medList = document.getElementById('case-med-list');
const dripList = document.getElementById('case-drip-list');
const monitorRows = document.getElementById('case-monitor-rows');
const transportScopeRows = document.getElementById('case-transport-scope-rows');
const signInButton = document.getElementById('case-cloud-signin');
const signOutButton = document.getElementById('case-cloud-signout');
const checkButton = document.getElementById('case-cloud-check');
const uploadButton = document.getElementById('case-cloud-upload');
const downloadButton = document.getElementById('case-cloud-download');
const replaceButton = document.getElementById('case-cloud-replace');
const fictionalCheck = document.getElementById('case-cloud-fictional');
const status = document.getElementById('case-cloud-status');

let user = null;
let slotReady = true;
let authNotice = null;
let syncState = 'signed-out';
let remoteRecord = null;
let remoteExists = false;
let remoteToken = null;
let baselineRecord = null;
let checkGeneration = 0;
let syncBusy = false;
let autoSyncRerun = false;

const recordKey = (n) => `sicuCasePacketPatient${n}`;
const baselineKey = (n) => `sicuCloudBaselinePatient${n}`;
const consentKey = (uid, n) => `sicuCloudAutoSyncConsentV1:${uid}:patient-${n}`;
const queueKey = (uid, n) => `sicuCloudAutoSyncQueueV1:${uid}:patient-${n}`;
const editTimeKey = (n) => `sicuCasePacketEditedAt${n}`;
const selectedSlot = () => String(slot.value);
const recordRef = (n, uid = user.uid) => doc(db, 'users', uid, 'sicuCasePackets', `patient-${n}`);

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function same(a, b) {
  if (a === null || b === null) return a === b;
  return stable(a) === stable(b);
}

function canonicalPacketRecord(record) {
  if (!record || typeof record !== 'object' || !record.values) return record;
  const inferredCount = (prefix, fallback = 0) => {
    const indexes = Object.keys(record.values).map((key) => {
      const match = key.match(new RegExp(`^${prefix.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\.(\\d+)\\.`));
      return match ? Number(match[1]) : -1;
    });
    const highest = Math.max(-1, ...indexes);
    return highest < 0 ? fallback : highest + 1;
  };
  return {
    ...record,
    dripCount: record.dripCount ?? inferredCount('drips'),
    monitoringCount: record.monitoringCount ?? inferredCount('packet.monitoring'),
    transportScopeCount: record.transportScopeCount ?? inferredCount('packet.transport.scopeReview'),
  };
}

function samePacketRecord(a, b) {
  return same(canonicalPacketRecord(a), canonicalPacketRecord(b));
}

function isValidPacketRecord(record, n) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return false;
  if (!record.values || typeof record.values !== 'object' || Array.isArray(record.values)) return false;
  // Older saved packets were allowed to grow without a row limit. Keep cloud
  // restore compatible with those records; entry buttons enforce current caps.
  if (!Number.isInteger(record.medicationCount) || record.medicationCount < 0) return false;
  if (record.dripCount !== undefined && (!Number.isInteger(record.dripCount) || record.dripCount < 0)) return false;
  if (record.monitoringCount !== undefined && (!Number.isInteger(record.monitoringCount) || record.monitoringCount < 0)) return false;
  if (record.transportScopeCount !== undefined && (!Number.isInteger(record.transportScopeCount) || record.transportScopeCount < 0)) return false;
  if (record.seedVersion !== undefined && (!Number.isFinite(record.seedVersion) || typeof record.seedVersion !== 'number')) return false;
  if (!Object.entries(record.values).every(([key, value]) => typeof key === 'string' && typeof value === 'string')) return false;
  const patientNumber = record.values['packet.patientNumber'];
  return patientNumber === undefined || patientNumber === String(n);
}

function tokenForCloudDocument(data) {
  return data === null ? null : stable({
    schemaVersion: data.schemaVersion,
    record: data.record,
    clientUpdatedAt: data.clientUpdatedAt,
  });
}

function localRecord() {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(recordKey(selectedSlot())) || 'null'); } catch (_) {}
  const values = {};
  for (const element of form.elements) {
    if (element.name) values[element.name] = element.value;
  }
  const record = { values, medicationCount: medList.children.length, dripCount: dripList.children.length, monitoringCount: monitorRows.children.length, transportScopeCount: transportScopeRows.children.length };
  if (saved?.seedVersion !== undefined && saved?.seedVersion !== null) record.seedVersion = saved.seedVersion;
  return record;
}

function readBaseline() {
  return readBaselineFor(selectedSlot());
}

function readBaselineFor(n) {
  try { return JSON.parse(localStorage.getItem(baselineKey(n)) || 'null'); } catch (_) { return null; }
}

function saveBaseline(record) {
  localStorage.setItem(baselineKey(selectedSlot()), JSON.stringify(record));
}

function saveBaselineFor(n, record) {
  localStorage.setItem(baselineKey(n), JSON.stringify(record));
}

function readAutoConsent(uid, n) {
  try {
    const consent = JSON.parse(localStorage.getItem(consentKey(uid, n)) || 'null');
    return consent?.version === 1 && Number.isFinite(consent.enabledAt) ? consent : null;
  } catch (_) { return null; }
}

function autoSyncEnabled(uid = user?.uid, n = selectedSlot()) {
  return Boolean(uid && readAutoConsent(uid, n));
}

function readQueue(uid, n) {
  try {
    const queued = JSON.parse(localStorage.getItem(queueKey(uid, n)) || 'null');
    if (queued?.version !== 1 || queued.uid !== uid || queued.slot !== String(n) || !isValidPacketRecord(queued.record, n)) return null;
    return queued;
  } catch (_) { return null; }
}

function saveQueue(uid, n, record, editedAt) {
  const queued = { version: 1, uid, slot: String(n), record, editedAt };
  localStorage.setItem(queueKey(uid, n), JSON.stringify(queued));
  return queued;
}

function clearQueue(uid, n) {
  try { localStorage.removeItem(queueKey(uid, n)); return true; }
  catch (_) { return false; }
}

function readLastLocalEdit(n) {
  try { return Number(localStorage.getItem(editTimeKey(n))) || 0; } catch (_) { return 0; }
}

function isOnline() {
  return typeof navigator === 'undefined' || navigator.onLine !== false;
}

function applyAutoSyncConsent({ preserveFictional = false } = {}) {
  const enabled = autoSyncEnabled();
  if (enabled) fictionalCheck.checked = true;
  else if (!preserveFictional) fictionalCheck.checked = false;
}

function enableAutomaticSyncForCurrentRecord() {
  if (!user || !fictionalCheck.checked) return false;
  const key = consentKey(user.uid, selectedSlot());
  if (readAutoConsent(user.uid, selectedSlot())) return true;
  try {
    localStorage.setItem(key, JSON.stringify({ version: 1, enabledAt: Date.now() }));
    return true;
  } catch (_) {
    setStatus('Automatic sync could not be enabled on this device. Local autosave remains active.', true);
    return false;
  }
}

function setStatus(message, isError = false) {
  status.textContent = message;
  status.style.color = isError ? '#a11' : '';
}

function renderButtons() {
  const signedIn = Boolean(user);
  signInButton.hidden = signedIn;
  signOutButton.hidden = !signedIn;
  slot.disabled = syncBusy || !slotReady;
  signOutButton.disabled = syncBusy;
  checkButton.disabled = !signedIn || !slotReady || syncBusy;
  uploadButton.disabled = !signedIn || !slotReady || syncBusy || !fictionalCheck.checked || !['new', 'local-ahead', 'in-sync'].includes(syncState);
  downloadButton.disabled = !signedIn || !slotReady || syncBusy || !remoteExists || !remoteRecord || !['remote-ahead', 'conflict', 'in-sync'].includes(syncState);
  replaceButton.hidden = syncState !== 'conflict';
  replaceButton.disabled = !signedIn || !slotReady || syncBusy || !fictionalCheck.checked || syncState !== 'conflict';
}

function currentRelation() {
  const local = localRecord();
  if (!remoteExists) return { state: 'new', local };
  if (!remoteRecord) return { state: 'conflict', local };
  if (samePacketRecord(local, remoteRecord)) return { state: 'in-sync', local };
  if (!baselineRecord) return { state: 'conflict', local };
  if (samePacketRecord(remoteRecord, baselineRecord)) return { state: 'local-ahead', local };
  if (samePacketRecord(local, baselineRecord)) return { state: 'remote-ahead', local };
  return { state: 'conflict', local };
}

function describeState() {
  if (!user) return authNotice || 'Not signed in. Local autosave is still active.';
  switch (syncState) {
    case 'new': return 'No cloud copy exists for this record. Existing local data stays here until a new edit is made after fictional data is confirmed or you save it explicitly.';
    case 'in-sync': return 'This selected record matches its cloud copy.';
    case 'local-ahead': return 'This device has newer edits. Automatic sync saves edits made after fictional data was confirmed.';
    case 'remote-ahead': return 'The cloud copy has newer edits. Load it to this device, or keep local edits and check again.';
    case 'conflict': return 'Both copies may have changed. No copy was overwritten. Choose Load cloud, or explicitly replace cloud after checking this record.';
    case 'checking': return 'Checking the private cloud copy…';
    case 'error': return 'Cloud access failed. Your local draft is unchanged and continues to autosave on this device.';
    default: return 'Sign in to check this record’s private cloud copy.';
  }
}

async function checkCloud() {
  if (!user || syncBusy) return;
  syncBusy = true;
  const checkedUid = user.uid;
  const checkedSlot = selectedSlot();
  const generation = ++checkGeneration;
  const localAtCheck = localRecord();
  let checkedSuccessfully = false;
  syncState = 'checking';
  renderButtons();
  setStatus(describeState());
  try {
    const snapshot = await getDoc(recordRef(checkedSlot, checkedUid));
    if (generation !== checkGeneration || user?.uid !== checkedUid || selectedSlot() !== checkedSlot) return;
    remoteExists = snapshot.exists();
    const cloudData = remoteExists ? snapshot.data() : null;
    remoteToken = tokenForCloudDocument(cloudData);
    const validRecord = !remoteExists || (cloudData?.schemaVersion === 1 && isValidPacketRecord(cloudData?.record, checkedSlot));
    remoteRecord = remoteExists && validRecord ? cloudData.record : null;
    baselineRecord = readBaselineFor(checkedSlot);
    if (remoteExists && !validRecord) {
      syncState = 'conflict';
      setStatus('The cloud copy has an unsupported or malformed format. It was not loaded locally; review it before choosing Replace cloud copy.', true);
      return;
    }
    syncState = currentRelation().state;
    if (syncState === 'in-sync') {
      baselineRecord = remoteRecord;
      saveBaseline(remoteRecord);
    }
    setStatus(describeState());
    checkedSuccessfully = true;
  } catch (error) {
    if (generation !== checkGeneration || user?.uid !== checkedUid || selectedSlot() !== checkedSlot) return;
    syncState = 'error';
    remoteRecord = null;
    remoteToken = null;
    setStatus(`Cloud check failed (${error?.code || 'network'}). Local autosave is unchanged.`, true);
  } finally {
    syncBusy = false;
    renderButtons();
  }
  if (checkedSuccessfully && generation === checkGeneration && user?.uid === checkedUid && selectedSlot() === checkedSlot) {
    await reconcileAutomaticSync(checkedUid, checkedSlot, generation, localAtCheck);
  }
}

async function reconcileAutomaticSync(uid, n, generation, localAtCheck) {
  if (!autoSyncEnabled(uid, n) || !fictionalCheck.checked || user?.uid !== uid || selectedSlot() !== n) return;
  if (!isOnline()) {
    if (readQueue(uid, n)) setStatus('Offline. This fictional draft is saved on this device and queued for private sync when the connection returns.');
    return;
  }
  if (syncState === 'in-sync') {
    clearQueue(uid, n);
    return;
  }
  if (syncState === 'remote-ahead') {
    if (generation !== checkGeneration || !samePacketRecord(localRecord(), localAtCheck)) {
      syncState = 'conflict';
      renderButtons();
      setStatus('Both copies may have changed during the check. No copy was overwritten; review the copies before resolving this conflict.', true);
      return;
    }
    let controller;
    try {
      controller = window.sicuCaseDraftController;
      if (!controller || typeof controller.replaceFromCloud !== 'function') throw new Error('draft-controller-unavailable');
      controller.replaceFromCloud(n, remoteRecord);
    } catch (error) {
      syncState = 'unknown';
      setStatus(`Cloud restore failed (${error?.message || 'local-storage'}). The previous local draft was retained.`, true);
      renderButtons();
      return;
    }
    try {
      saveBaselineFor(n, remoteRecord);
      baselineRecord = remoteRecord;
      clearQueue(uid, n);
      syncState = 'in-sync';
      setStatus('A newer fictional cloud draft was safely restored to this device.');
    } catch (error) {
      baselineRecord = readBaselineFor(n);
      syncState = 'unknown';
      setStatus(`Cloud draft loaded locally, but sync status could not be saved (${error?.message || 'storage'}). Check the cloud copy before syncing again.`, true);
    }
    renderButtons();
    return;
  }
  if (syncState === 'conflict') return;
  if (!['new', 'local-ahead'].includes(syncState)) return;

  let queued = readQueue(uid, n);
  if (!queued) {
    const consent = readAutoConsent(uid, n);
    const editedAt = readLastLocalEdit(n);
    if (syncState === 'local-ahead' && consent && editedAt >= consent.enabledAt) {
      try { queued = saveQueue(uid, n, localRecord(), editedAt); }
      catch (_) {
        setStatus('Automatic sync could not queue this draft on this device. Local autosave remains active.', true);
        return;
      }
    }
  }
  if (queued) await flushAutomaticQueue(uid, n, generation, queued);
}

async function flushAutomaticQueue(uid, n, generation, queued) {
  if (!user || user.uid !== uid || selectedSlot() !== n || generation !== checkGeneration) return;
  if (!autoSyncEnabled(uid, n) || !fictionalCheck.checked || !isValidPacketRecord(queued.record, n)) return;
  if (!isOnline()) {
    setStatus('Offline. This fictional draft is saved on this device and queued for private sync when the connection returns.');
    return;
  }
  if (syncBusy) { autoSyncRerun = true; return; }
  if (!['new', 'local-ahead'].includes(syncState)) return;
  if (serializedRecord(queued.record) > 700000) {
    setStatus('This draft is too large to sync. The local copy remains saved and queued on this device.', true);
    return;
  }
  if (!samePacketRecord(localRecord(), queued.record)) {
    setStatus('Waiting for the latest local edit to save before syncing.');
    return;
  }

  const expectedExists = remoteExists;
  const expectedRemote = remoteRecord;
  const expectedToken = remoteToken;
  const writeGeneration = generation;
  syncBusy = true;
  renderButtons();
  try {
    const ref = recordRef(n, uid);
    const clientUpdatedAt = queued.editedAt;
    const result = await runTransaction(db, async (transaction) => {
      const latest = await transaction.get(ref);
      const latestExists = latest.exists();
      const latestData = latestExists ? latest.data() : null;
      const valid = !latestExists || (latestData?.schemaVersion === 1 && isValidPacketRecord(latestData?.record, n));
      const latestRecord = latestExists && valid ? latestData.record : null;
      const latestToken = tokenForCloudDocument(latestData);
      if (writeGeneration !== checkGeneration || user?.uid !== uid || selectedSlot() !== n) {
        return { wrote: false, stale: true, latestExists, latestRecord, latestToken };
      }
      if (!valid || latestExists !== expectedExists || !same(latestToken, expectedToken) || !same(latestRecord, expectedRemote)) {
        return { wrote: false, changed: true, latestExists, latestRecord, latestToken };
      }
      transaction.set(ref, { schemaVersion: 1, record: queued.record, clientUpdatedAt, updatedAt: serverTimestamp() });
      return { wrote: true };
    });
    if (result.stale || writeGeneration !== checkGeneration || user?.uid !== uid || selectedSlot() !== n) return;
    if (!result.wrote) {
      if (result.changed) {
        remoteExists = result.latestExists;
        remoteRecord = result.latestRecord;
        remoteToken = result.latestToken;
        baselineRecord = readBaselineFor(n);
        syncState = 'conflict';
        autoSyncRerun = false;
        setStatus('The cloud copy changed while this draft was queued. Nothing was overwritten; the queued copy remains on this device for review.', true);
      }
      return;
    }
    remoteExists = true;
    remoteRecord = queued.record;
    remoteToken = tokenForCloudDocument({ schemaVersion: 1, record: queued.record, clientUpdatedAt });
    baselineRecord = queued.record;
    try { saveBaselineFor(n, queued.record); }
    catch (error) {
      syncState = 'unknown';
      setStatus(`Cloud draft saved, but its sync baseline could not be stored (${error?.message || 'storage'}). The local queue is retained; check again before the next sync.`, true);
      return;
    }
    const currentQueue = readQueue(uid, n);
    if (currentQueue && same(currentQueue.record, queued.record)) clearQueue(uid, n);
    syncState = currentRelation().state;
    if (syncState === 'in-sync') {
      setStatus('Fictional draft saved automatically to your private account.');
    } else if (syncState === 'local-ahead' && currentQueue) {
      autoSyncRerun = true;
      setStatus('A draft update was saved; syncing the newer local edit next.');
    } else {
      setStatus('Fictional draft saved automatically. Newer local edits remain queued on this device.');
    }
  } catch (error) {
    if (user?.uid === uid && selectedSlot() === n) {
      setStatus(`Automatic cloud save is waiting (${error?.code || 'network'}). The draft remains saved locally and queued for retry.`, true);
    }
  } finally {
    syncBusy = false;
    renderButtons();
  }
  if (autoSyncRerun && user?.uid === uid && selectedSlot() === n && syncState === 'local-ahead') {
    autoSyncRerun = false;
    const next = readQueue(uid, n);
    if (next) await flushAutomaticQueue(uid, n, checkGeneration, next);
  }
}

function queueAutomaticDraft(event) {
  const detail = event?.detail;
  const n = String(detail?.slot || '');
  const uid = user?.uid;
  if (!uid || !n || !autoSyncEnabled(uid, n) || (n === selectedSlot() && !fictionalCheck.checked)) return;
  const consent = readAutoConsent(uid, n);
  const editedAt = Number(detail.editedAt) || Date.now();
  if (!consent || editedAt < consent.enabledAt || !isValidPacketRecord(detail.record, n)) return;
  let queued;
  try { queued = saveQueue(uid, n, detail.record, editedAt); }
  catch (_) {
    setStatus('Automatic sync could not queue this edit on this device. Local autosave remains active.', true);
    return;
  }
  if (n !== selectedSlot()) return;
  if (!isOnline()) {
    setStatus('Offline. This fictional draft is saved on this device and queued for private sync when the connection returns.');
  } else if (syncBusy) {
    autoSyncRerun = true;
  } else {
    // A later edit can arrive after the previous upload left the cached state
    // at in-sync. Recompute against the captured baseline before deciding
    // whether the durable queue is safe to flush.
    if (syncState === 'in-sync') {
      syncState = currentRelation().state;
      renderButtons();
    }
    if (['new', 'local-ahead'].includes(syncState)) {
      void flushAutomaticQueue(uid, n, checkGeneration, queued);
    } else if (['unknown', 'error', 'signed-out'].includes(syncState)) {
      void checkCloud();
    } else if (syncState === 'conflict') {
      setStatus('Both copies may have changed. The new edit remains queued on this device; review the copies before resolving this conflict.', true);
    }
  }
}

function confirmFictional() {
  if (!fictionalCheck.checked) {
    setStatus('Check the fictional-training-data confirmation before sending this record.', true);
    return false;
  }
  return true;
}

function serializedRecord(record) {
  return new TextEncoder().encode(stable(record)).length;
}

async function writeCloud({ overwrite = false } = {}) {
  if (!user || syncBusy || !confirmFictional()) return;
  const writeSlot = selectedSlot();
  const writeUid = user.uid;
  const generation = checkGeneration;
  const local = localRecord();
  if (serializedRecord(local) > 700000) {
    setStatus('This record is too large to sync. Local autosave remains available.', true);
    return;
  }
  if (!isValidPacketRecord(local, writeSlot)) {
    setStatus('This record does not match the supported SICU packet format and was not uploaded.', true);
    return;
  }
  const expectedExists = remoteExists;
  const expectedRemote = remoteRecord;
  const expectedRemoteToken = remoteToken;
  const relation = currentRelation();
  syncBusy = true;
  renderButtons();
  try {
    if (relation.state === 'in-sync') {
      saveBaseline(remoteRecord);
      setStatus('Cloud copy is already current.');
      return;
    }
    if (relation.state === 'remote-ahead') {
      setStatus('The cloud copy is newer. Load it or compare the copies before replacing anything.', true);
      return;
    }
    if (relation.state === 'conflict' && !overwrite) {
      syncState = 'conflict';
      setStatus(describeState(), true);
      return;
    }
    if (overwrite && !window.confirm('Replace the cloud copy of this selected fictional record with the local copy on this device?')) return;
    if (!overwrite && remoteRecord && relation.state === 'local-ahead' && !window.confirm('Save this device’s newer fictional record to your private cloud copy?')) return;
    if (!overwrite && !remoteExists && !window.confirm('Upload this selected record to your private cloud account? Confirm it contains fictional teaching data only.')) return;

    try {
      const ref = recordRef(writeSlot, writeUid);
      const clientUpdatedAt = Date.now();
      const wrote = await runTransaction(db, async (transaction) => {
        const latest = await transaction.get(ref);
        const latestExists = latest.exists();
        const latestData = latestExists ? latest.data() : null;
        const latestRecordValid = !latestExists || (latestData?.schemaVersion === 1 && isValidPacketRecord(latestData?.record, writeSlot));
        const latestRecord = latestExists && latestRecordValid ? latestData.record : null;
        const latestToken = tokenForCloudDocument(latestData);
        if (generation !== checkGeneration || user?.uid !== writeUid || selectedSlot() !== writeSlot) {
          return { wrote: false, latestExists, latestRecord, latestToken, staleSelection: true };
        }
        if (latestExists !== expectedExists || !same(latestToken, expectedRemoteToken) || (latestExists && !latestRecordValid && !overwrite) || !same(latestRecord, expectedRemote)) {
          return { wrote: false, latestExists, latestRecord, latestToken };
        }
        transaction.set(ref, {
          schemaVersion: 1,
          record: local,
          clientUpdatedAt,
          updatedAt: serverTimestamp(),
        });
        return { wrote: true };
      });
      if (wrote.staleSelection || generation !== checkGeneration || user?.uid !== writeUid || writeSlot !== selectedSlot()) {
        setStatus('The selected record or account changed while saving. No sync write was made for the changed selection.');
        return;
      }
      if (!wrote.wrote) {
        remoteExists = wrote.latestExists;
        remoteRecord = wrote.latestRecord;
        remoteToken = wrote.latestToken;
        baselineRecord = readBaselineFor(writeSlot);
        syncState = currentRelation().state;
        setStatus('The cloud copy changed while you were reviewing it. Nothing was overwritten; check again.', true);
        renderButtons();
        return;
      }
      remoteRecord = local;
      remoteExists = true;
      remoteToken = tokenForCloudDocument({ schemaVersion: 1, record: local, clientUpdatedAt });
      baselineRecord = local;
      saveBaselineFor(writeSlot, local);
      const queued = readQueue(writeUid, writeSlot);
      if (queued && samePacketRecord(queued.record, local)) clearQueue(writeUid, writeSlot);
      const relationAfterSave = currentRelation();
      syncState = relationAfterSave.state;
      setStatus(syncState === 'in-sync'
        ? 'Cloud copy saved for this record.'
        : 'Cloud copy saved. Newer local edits remain on this device and have not been overwritten.');
    } catch (error) {
      syncState = 'error';
      setStatus(`Cloud save failed (${error?.code || 'network'}). The local draft is unchanged.`, true);
    }
  } finally {
    syncBusy = false;
    renderButtons();
  }
  if (autoSyncRerun && user && autoSyncEnabled(user.uid, selectedSlot()) && syncState !== 'conflict') {
    autoSyncRerun = false;
    void checkCloud();
  }
}

async function loadCloud() {
  if (!user || syncBusy || !remoteExists || !remoteRecord) return;
  const downloadSlot = selectedSlot();
  if (!isValidPacketRecord(remoteRecord, downloadSlot)) {
    syncState = 'conflict';
    setStatus('The cloud copy failed validation and was not loaded. Your local draft is unchanged.', true);
    renderButtons();
    return;
  }
  if (!window.confirm('Replace this device’s selected local draft with the private cloud copy? This will not change the cloud copy.')) return;
  syncBusy = true;
  renderButtons();
  try {
    const controller = window.sicuCaseDraftController;
    if (!controller || typeof controller.replaceFromCloud !== 'function') throw new Error('draft-controller-unavailable');
    controller.replaceFromCloud(downloadSlot, remoteRecord);
    try {
      saveBaselineFor(downloadSlot, remoteRecord);
      baselineRecord = remoteRecord;
      clearQueue(user.uid, downloadSlot);
      syncState = 'in-sync';
      setStatus('Cloud copy loaded on this device.');
    } catch (error) {
      baselineRecord = readBaselineFor(downloadSlot);
      syncState = 'unknown';
      setStatus(`Cloud copy loaded locally, but sync status could not be saved (${error?.message || 'storage'}). Check the cloud copy before syncing again.`, true);
      return;
    }
    window.location.reload();
  } catch (error) {
    setStatus(`Cloud load failed (${error?.message || 'local-storage'}). The previous local draft was retained.`, true);
  } finally {
    syncBusy = false;
    renderButtons();
  }
}

signInButton.addEventListener('click', async () => {
  setStatus('Opening Google sign-in…');
  try {
    await signInWithPopup(auth, google);
  } catch (error) {
    const code = error?.code || 'sign-in';
    setStatus(`Google sign-in failed (${code}). Local autosave is still active.`, true);
  }
});

signOutButton.addEventListener('click', async () => {
  try { await signOut(auth); } catch (error) { setStatus(`Sign-out failed (${error?.code || 'auth'}).`, true); }
});

checkButton.addEventListener('click', checkCloud);
uploadButton.addEventListener('click', () => writeCloud());
replaceButton.addEventListener('click', () => writeCloud({ overwrite: true }));
downloadButton.addEventListener('click', loadCloud);
fictionalCheck.addEventListener('change', () => {
  if (!fictionalCheck.checked && user && autoSyncEnabled(user.uid, selectedSlot())) {
    try {
      localStorage.removeItem(consentKey(user.uid, selectedSlot()));
      setStatus('Automatic saving is paused for this record. Any queued copy remains on this device.');
    } catch (_) {
      fictionalCheck.checked = true;
      setStatus('Automatic saving could not be paused on this device. The saved choice remains enabled.', true);
    }
  } else if (fictionalCheck.checked && user && enableAutomaticSyncForCurrentRecord()) {
    setStatus('Automatic saving is active for this fictional record. Existing local data stays here until a new edit or explicit save.');
    void checkCloud();
  } else if (fictionalCheck.checked && !user) {
    setStatus('Sign in with the owner account to automatically save new edits.');
  }
  renderButtons();
});
window.addEventListener('sicu-local-draft-changed', queueAutomaticDraft);
window.addEventListener('online', () => {
  if (user && autoSyncEnabled(user.uid, selectedSlot())) void checkCloud();
});
window.addEventListener('offline', () => {
  if (user && autoSyncEnabled(user.uid, selectedSlot()) && readQueue(user.uid, selectedSlot())) {
    setStatus('Offline. This fictional draft is saved on this device and queued for private sync when the connection returns.');
  }
});
slot.addEventListener('change', () => {
  checkGeneration += 1;
  slotReady = false;
  remoteRecord = null;
  remoteExists = false;
  remoteToken = null;
  baselineRecord = readBaseline();
  syncState = user ? 'unknown' : 'signed-out';
  renderButtons();
  setStatus(user ? 'Patient record changed. Wait for the local draft to load, then check its cloud copy.' : describeState());
  window.setTimeout(() => {
    slotReady = true;
    applyAutoSyncConsent();
    syncState = user ? 'unknown' : 'signed-out';
    setStatus(user ? 'Patient record loaded. Check the cloud copy before syncing.' : describeState());
    renderButtons();
    if (user && autoSyncEnabled(user.uid, selectedSlot())) void checkCloud();
  }, 400);
});

onAuthStateChanged(auth, async (signedInUser) => {
  checkGeneration += 1;
  if (!signedInUser) {
    user = null;
    syncState = 'signed-out';
    remoteRecord = null;
    remoteExists = false;
    remoteToken = null;
    fictionalCheck.checked = false;
    setStatus(describeState());
    renderButtons();
    return;
  }
  if (signedInUser.email?.toLowerCase() !== allowedEmail || !signedInUser.emailVerified) {
    user = null;
    authNotice = `Only a verified ${allowedEmail} Google account can sync.`;
    syncState = 'signed-out';
    setStatus(authNotice, true);
    renderButtons();
    try { await signOut(auth); } catch (_) {}
    return;
  }
  authNotice = null;
  user = signedInUser;
  syncState = 'unknown';
  applyAutoSyncConsent({ preserveFictional: true });
  renderButtons();
  setStatus(autoSyncEnabled(user.uid, selectedSlot())
    ? `Signed in as ${allowedEmail}. Checking this record for safe automatic sync.`
    : `Signed in as ${allowedEmail}. Confirm this record contains fictional data; new edits will then save automatically.`);
  if (autoSyncEnabled(user.uid, selectedSlot())) void checkCloud();
});

renderButtons();
