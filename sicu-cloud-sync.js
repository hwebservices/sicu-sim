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
let baselineRecord = null;
let checkGeneration = 0;

const recordKey = (n) => `sicuCasePacketPatient${n}`;
const baselineKey = (n) => `sicuCloudBaselinePatient${n}`;
const selectedSlot = () => String(slot.value);
const recordRef = (n) => doc(db, 'users', user.uid, 'sicuCasePackets', `patient-${n}`);

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

function localRecord() {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(recordKey(selectedSlot())) || 'null'); } catch (_) {}
  const values = {};
  for (const element of form.elements) {
    if (element.name) values[element.name] = element.value;
  }
  const record = { values, medicationCount: medList.children.length };
  if (saved?.seedVersion !== undefined && saved?.seedVersion !== null) record.seedVersion = saved.seedVersion;
  return record;
}

function readBaseline() {
  try { return JSON.parse(localStorage.getItem(baselineKey(selectedSlot())) || 'null'); } catch (_) { return null; }
}

function saveBaseline(record) {
  localStorage.setItem(baselineKey(selectedSlot()), JSON.stringify(record));
}

function saveBaselineFor(n, record) {
  localStorage.setItem(baselineKey(n), JSON.stringify(record));
}

function setStatus(message, isError = false) {
  status.textContent = message;
  status.style.color = isError ? '#a11' : '';
}

function renderButtons() {
  const signedIn = Boolean(user);
  signInButton.hidden = signedIn;
  signOutButton.hidden = !signedIn;
  checkButton.disabled = !signedIn || !slotReady;
  uploadButton.disabled = !signedIn || !slotReady || !fictionalCheck.checked || !['new', 'local-ahead', 'in-sync'].includes(syncState);
  downloadButton.disabled = !signedIn || !slotReady || !['remote-ahead', 'conflict', 'in-sync'].includes(syncState);
  replaceButton.hidden = syncState !== 'conflict';
  replaceButton.disabled = !signedIn || !slotReady || !fictionalCheck.checked || syncState !== 'conflict';
}

function currentRelation() {
  const local = localRecord();
  if (!remoteExists) return { state: 'new', local };
  if (!remoteRecord) return { state: 'conflict', local };
  if (same(local, remoteRecord)) return { state: 'in-sync', local };
  if (!baselineRecord) return { state: 'conflict', local };
  if (same(remoteRecord, baselineRecord)) return { state: 'local-ahead', local };
  if (same(local, baselineRecord)) return { state: 'remote-ahead', local };
  return { state: 'conflict', local };
}

function describeState() {
  if (!user) return authNotice || 'Not signed in. Local autosave is still active.';
  switch (syncState) {
    case 'new': return 'No cloud copy exists for this record. Saving it to cloud requires the fictional-data confirmation and your click.';
    case 'in-sync': return 'This selected record matches its cloud copy.';
    case 'local-ahead': return 'This device has newer edits. You can save this copy to cloud.';
    case 'remote-ahead': return 'The cloud copy has newer edits. Load it to this device, or keep local edits and check again.';
    case 'conflict': return 'Both copies may have changed. No copy was overwritten. Choose Load cloud, or explicitly replace cloud after checking this record.';
    case 'checking': return 'Checking the private cloud copy…';
    case 'error': return 'Cloud access failed. Your local draft is unchanged and continues to autosave on this device.';
    default: return 'Sign in to check this record’s private cloud copy.';
  }
}

async function checkCloud() {
  if (!user) return;
  const checkedSlot = selectedSlot();
  const generation = ++checkGeneration;
  syncState = 'checking';
  renderButtons();
  setStatus(describeState());
  try {
    const snapshot = await getDoc(recordRef(checkedSlot));
    if (generation !== checkGeneration) return;
    remoteExists = snapshot.exists();
    remoteRecord = remoteExists ? snapshot.data()?.record ?? null : null;
    baselineRecord = readBaseline();
    syncState = currentRelation().state;
    if (syncState === 'in-sync') {
      baselineRecord = remoteRecord;
      saveBaseline(remoteRecord);
    }
    setStatus(describeState());
  } catch (error) {
    if (generation !== checkGeneration) return;
    syncState = 'error';
    remoteRecord = null;
    setStatus(`Cloud check failed (${error?.code || 'network'}). Local autosave is unchanged.`, true);
  }
  renderButtons();
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
  if (!user || !confirmFictional()) return;
  const writeSlot = selectedSlot();
  const generation = checkGeneration;
  const local = localRecord();
  if (serializedRecord(local) > 700000) {
    setStatus('This record is too large to sync. Local autosave remains available.', true);
    return;
  }
  if (!remoteExists) {
    if (syncState !== 'new') await checkCloud();
    if (!user) return;
  }
  const relation = currentRelation();
  if (relation.state === 'in-sync') {
    saveBaseline(remoteRecord);
    setStatus('Cloud copy is already current.');
    renderButtons();
    return;
  }
  if (relation.state === 'remote-ahead') {
    setStatus('The cloud copy is newer. Load it or compare the copies before replacing anything.', true);
    renderButtons();
    return;
  }
  if (relation.state === 'conflict' && !overwrite) {
    syncState = 'conflict';
    setStatus(describeState(), true);
    renderButtons();
    return;
  }
  if (overwrite && !window.confirm('Replace the cloud copy of this selected fictional record with the local copy on this device?')) return;
  if (!overwrite && remoteRecord && relation.state === 'local-ahead' && !window.confirm('Save this device’s newer fictional record to your private cloud copy?')) return;
  if (!overwrite && !remoteExists && !window.confirm('Upload this selected record to your private cloud account? Confirm it contains fictional teaching data only.')) return;

  try {
    const ref = recordRef(writeSlot);
    const wrote = await runTransaction(db, async (transaction) => {
      const latest = await transaction.get(ref);
      const latestExists = latest.exists();
      const latestRecord = latestExists ? latest.data()?.record ?? null : null;
      if (latestExists !== remoteExists || !same(latestRecord, remoteRecord)) {
        return { wrote: false, latestExists, latestRecord };
      }
      transaction.set(ref, {
        schemaVersion: 1,
        record: local,
        clientUpdatedAt: Date.now(),
        updatedAt: serverTimestamp(),
      });
      return { wrote: true };
    });
    if (generation !== checkGeneration || writeSlot !== selectedSlot()) {
      setStatus(wrote.wrote
        ? 'Cloud copy saved for the previous selection. The current record was not changed; check its cloud copy before syncing.'
        : 'The selected record changed while saving. No local record was changed; check the current cloud copy before syncing.');
      return;
    }
    if (!wrote.wrote) {
      remoteExists = wrote.latestExists;
      remoteRecord = wrote.latestRecord;
      baselineRecord = readBaseline();
      syncState = currentRelation().state;
      setStatus('The cloud copy changed while you were reviewing it. Nothing was overwritten; check again.', true);
      renderButtons();
      return;
    }
    remoteRecord = local;
    remoteExists = true;
    baselineRecord = local;
    saveBaselineFor(writeSlot, local);
    if (generation !== checkGeneration || writeSlot !== selectedSlot()) {
      setStatus('Cloud copy saved for the previous selection. The current record was not changed; check its cloud copy before syncing.');
      return;
    }
    const relationAfterSave = currentRelation();
    syncState = relationAfterSave.state;
    setStatus(syncState === 'in-sync'
      ? 'Cloud copy saved for this record.'
      : 'Cloud copy saved. Newer local edits remain on this device and have not been overwritten.');
  } catch (error) {
    syncState = 'error';
    setStatus(`Cloud save failed (${error?.code || 'network'}). The local draft is unchanged.`, true);
  }
  renderButtons();
}

async function loadCloud() {
  if (!user || !remoteExists || !remoteRecord) return;
  if (!window.confirm('Replace this device’s selected local draft with the private cloud copy? This will not change the cloud copy.')) return;
  const localKey = recordKey(selectedSlot());
  localStorage.setItem(localKey, JSON.stringify(remoteRecord));
  saveBaseline(remoteRecord);
  window.location.reload();
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
fictionalCheck.addEventListener('change', renderButtons);
slot.addEventListener('change', () => {
  checkGeneration += 1;
  slotReady = false;
  remoteRecord = null;
  baselineRecord = readBaseline();
  syncState = user ? 'unknown' : 'signed-out';
  renderButtons();
  setStatus(user ? 'Patient record changed. Wait for the local draft to load, then check its cloud copy.' : describeState());
  window.setTimeout(() => {
    slotReady = true;
    syncState = user ? 'unknown' : 'signed-out';
    setStatus(user ? 'Patient record loaded. Check the cloud copy before syncing.' : describeState());
    renderButtons();
  }, 350);
});

onAuthStateChanged(auth, async (signedInUser) => {
  checkGeneration += 1;
  if (!signedInUser) {
    user = null;
    syncState = 'signed-out';
    remoteRecord = null;
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
  renderButtons();
  setStatus(`Signed in as ${allowedEmail}. Local drafts are not uploaded automatically.`);
});

renderButtons();
