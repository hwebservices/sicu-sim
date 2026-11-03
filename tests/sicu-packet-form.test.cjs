const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync(new URL('../index.html', `file://${__filename}`), 'utf8');
const sync = fs.readFileSync(new URL('../sicu-cloud-sync.js', `file://${__filename}`), 'utf8');

function has(source, pattern, message) {
  assert.match(source, pattern, message);
}

// The Today row is part of the encounter packet and must remain student-editable.
has(html, /const labels=\['Prehospital · before interventions','Prehospital · after interventions','Hospital entry','Today'\]/, 'four required vitals timepoints are present');
has(html, /function inputCell\(name,label\)[\s\S]*?el\.name=`vitals\.\$\{name\}`/, 'vitals use named form controls');
assert.doesNotMatch(html, /syncLiveVitals|readonly[^>]*vitals\.row/, 'simulator no longer overwrites or locks packet vitals');

// Packet additions must survive local/cloud record save and restoration.
for (const name of [
  'packet.admission.contributingEvents', 'packet.criticalCare.discussedWithMedicalStaff',
  'packet.labReasoning', 'packet.labCorrectiveIntervention', 'packet.vent.inUse',
  'packet.vent.ordered.', 'packet.vent.rationale', 'packet.learning.lectureTime',
  'packet.emce.evaluationStatus', 'packet.emce.presentationStatus',
  'packet.emce.edImproved', 'packet.emce.edHindered', 'packet.emce.icuImproved',
  'packet.emce.icuHindered', 'packet.transport.scopeReview.',
]) assert.ok(html.includes(name), `missing packet field ${name}`);
has(html, /sexReference/, 'lab form requests sex-specific reference ranges where listed');
has(html, /function setMonitors[\s\S]*?\['recordedFrom'/, 'sample monitoring rows include provenance');
has(html, /function addMonitoringRow[\s\S]*?function addScopeReviewRow/, 'monitoring and transport rows can be added dynamically');
has(html, /function reindexRows\(list,prefix\)/, 'medication and drip fields reindex after deletion');
has(html, /dripCount=Math\.max\(0,Math\.min\(Number\.isInteger\(saved\?\.dripCount\)\?saved\.dripCount:0,100\)\)/, 'draft restoration supports up to 100 IV drip rows');
has(html, /patientNumber\.value=n;status\.textContent=saved\?'Draft restored from this device'/, 'record selection restores the selected local draft');
has(sync, /dripCount: dripList\.children\.length, monitoringCount: monitorRows\.children\.length, transportScopeCount: transportScopeRows\.children\.length/, 'cloud packet stores dynamic row counts');
has(sync, /record\.medicationCount > 100/, 'cloud validation supports packet row counts without the former 20-row cap');
has(sync, /function canonicalPacketRecord[\s\S]*?function samePacketRecord/, 'legacy cloud drafts compare without mutating saved records');

const helpers = sync.slice(sync.indexOf('function stable('), sync.indexOf('function isValidPacketRecord('));
const oldDraft = {
  values: { diagnosis: 'synthetic', 'packet.monitoring.0.device': 'telemetry' },
  medicationCount: 1,
};
const currentDraft = {
  ...oldDraft,
  dripCount: 0,
  monitoringCount: 1,
  transportScopeCount: 0,
};
const context = vm.createContext({ oldDraft, currentDraft });
vm.runInContext(`${helpers}\nglobalThis.compatible = samePacketRecord(oldDraft, currentDraft);`, context);
assert.equal(context.compatible, true, 'legacy record compares equal without writing schema upgrades');

console.log('SICU packet form structure regression passed.');
