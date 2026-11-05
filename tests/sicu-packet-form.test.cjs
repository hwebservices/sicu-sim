const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync(new URL('../index.html', `file://${__filename}`), 'utf8');
const sync = fs.readFileSync(new URL('../sicu-cloud-sync.js', `file://${__filename}`), 'utf8');
const inlineScripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(match => match[1]);

function has(source, pattern, message) {
  assert.equal(pattern.test(source), true, message);
}

// The Today row is part of the encounter packet and must remain student-editable.
has(html, /const labels=\['Prehospital · before interventions','Prehospital · after interventions','Hospital entry','Today'\]/, 'four required vitals timepoints are present');
has(html, /function inputCell\(name,label\)[\s\S]*?el\.name=`vitals\.\$\{name\}`/, 'vitals use named form controls');
assert.doesNotMatch(html, /syncLiveVitals|readonly[^>]*vitals\.row/, 'simulator no longer overwrites or locks packet vitals');

// Packet additions must survive local/cloud record save and restoration.
for (const name of [
  'packet.admission.contributingEvents', 'packet.criticalCare.discussedWithMedicalStaff',
  'packet.labReasoning', 'packet.labCorrectiveIntervention', 'packet.vent.inUse',
  'packet.vent.ordered.', 'packet.vent.ordered.mode', 'packet.vent.ordered.modeOther', 'packet.vent.rationale', 'packet.learning.lectureTime',
  'packet.emce.evaluationStatus', 'packet.emce.presentationStatus',
  'packet.emce.edImproved', 'packet.emce.edHindered', 'packet.emce.icuImproved',
  'packet.emce.icuHindered', 'packet.transport.scopeReview.',
]) assert.ok(html.includes(name), `missing packet field ${name}`);
has(html, /sexReference/, 'lab form requests sex-specific reference ranges where listed');
has(html, /function addMonitoringRow\(\)[\s\S]*?\['device','Monitoring device'\],\['recordedFrom','Observed in'\]/, 'monitor rows include provenance');
has(html, /function addMonitoringRow[\s\S]*?function addScopeReviewRow/, 'monitoring and transport rows can be added dynamically');
has(html, /function reindexRows\(list,prefix\)/, 'medication and drip fields reindex after deletion');
has(html, /restoredCount=\(count,fallback\)=>Number\.isInteger\(count\)&&count>=0\?count:fallback/, 'draft restoration retains the complete saved row count');
has(html, /rowLimits=\{medications:100,drips:100,monitoring:50,scope:100\}/, 'new row entry limits are explicit');
has(html, /count>=limit\?`Limit reached \(\$\{limit\} \$\{label\}\)\. Existing saved rows are retained\.`/, 'row limits explain that existing rows remain intact');
const reportBuilder = html.slice(html.indexOf('function packetReport()'), html.indexOf('const nativePrint=window.print.bind(window)'));
has(reportBuilder, /Additional overall improvement notes[\s\S]*?Additional overall hindrance notes[\s\S]*?Overall evaluation notes/, 'print packet retains legacy overall improved/hindered notes');
has(html, /patientNumber\.value=n;window\.sicuPacketRows\.updateLimits\(\);status\.textContent=saved\?'Draft restored from this device'/, 'record selection restores the selected local draft');
has(sync, /dripCount: dripList\.children\.length, monitoringCount: monitorRows\.children\.length, transportScopeCount: transportScopeRows\.children\.length/, 'cloud packet stores dynamic row counts');
has(sync, /if \(!Number\.isInteger\(record\.medicationCount\) \|\| record\.medicationCount < 0\) return false/, 'cloud validation accepts legacy row counts above current entry caps');
has(sync, /function canonicalPacketRecord[\s\S]*?function samePacketRecord/, 'legacy cloud drafts compare without mutating saved records');

const medicationScript = inlineScripts.find(script => script.includes('window.sicuPacketRows=') && script.includes('function addMedicationRow'));
const packetControllerScript = inlineScripts.find(script => script.includes('function loadRecord(n)') && script.includes('function addMonitoringRow'));
assert.ok(medicationScript, 'row helper owner script exists');
assert.ok(packetControllerScript, 'packet restore controller script exists');
has(medicationScript, /window\.sicuPacketRows=\{limits:rowLimits,updateLimits:updateRowLimits,addMedication,addDrip\}/, 'row helpers are exposed across script scopes');
has(packetControllerScript, /window\.sicuPacketRows\.addMedication\(\)/, 'restore calls medication helper through shared API');
has(packetControllerScript, /window\.sicuPacketRows\.addDrip\(\)/, 'restore calls IV drip helper through shared API');
has(packetControllerScript, /window\.sicuPacketRows\.updateLimits\(\)/, 'monitor and scope row updates use shared API');
assert.doesNotMatch(packetControllerScript, /\browLimits\b|\bupdateRowLimits\(/, 'packet controller does not reference inaccessible lexical names');

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

const validation = sync.slice(sync.indexOf('function isValidPacketRecord('), sync.indexOf('function tokenForCloudDocument('));
const largeDraft = { values: { 'packet.patientNumber': '1' }, medicationCount: 105, dripCount: 108, monitoringCount: 55, transportScopeCount: 106 };
const validationContext = vm.createContext({ largeDraft });
vm.runInContext(`${validation}\nglobalThis.valid = isValidPacketRecord(largeDraft, '1');`, validationContext);
assert.equal(validationContext.valid, true, 'legacy cloud record with rows above new-entry limits remains restorable');

// The re-scoped product has exactly two patient slots and no seeded scenario products.
assert.equal((html.match(/<option value="[12]">Patient [12]<\/option>/g) || []).length, 4, 'room and form selectors each expose only Patient 1 and Patient 2');
assert.equal(/Scenario ·|Shockable cardiac arrest|Acute ischemic stroke|Severe DKA|septicShock|data-intervention=/.test(html), false, 'no fictional scenario product or clinical simulator controls remain');
assert.match(html, /Patient 1 · Adult SICU trauma-abdomen course/, 'Patient 1 seed uses only the approved case shape');
assert.match(html, /'medications\.0\.pattern':'Scheduled','medications\.1\.pattern':'PRN'/, 'Patient 1 seed shows scheduled and PRN structure without inventing drug details');
assert.match(html, /leave unverified values blank/i, 'Patient 1 seed does not invent clinical values');
assert.match(html, /sicu-room-patient-slot/, 'the room provides a patient switcher');
assert.match(html, /packet.course.procedures/, 'procedure timeline is captured in the packet');
assert.match(html, /packet.course.ventilatorTimeline/, 'ventilator course is captured in the packet');
assert.match(html, /vitals.row\$\{index\}.hospitalDay/, 'vitals snapshots support hospital-day numbering');
assert.match(html, /Recorded vitals snapshots[\s\S]*?Medications[\s\S]*?IV drips[\s\S]*?Procedures and interventions[\s\S]*?Ventilator course/, 'presentation view covers patient-specific progress');
const seedScript = inlineScripts.find(script => script.includes("const key='sicuCasePacketPatient1'"));
assert.ok(seedScript, 'Patient 1 case-shape seed script exists');
const seedStore = new Map();
const seedContext = vm.createContext({
  localStorage: { getItem: key => seedStore.get(key) ?? null, setItem: (key, value) => seedStore.set(key, value) },
});
vm.runInContext(seedScript, seedContext);
const seededPatient1 = JSON.parse(seedStore.get('sicuCasePacketPatient1'));
assert.equal(seededPatient1.values['vitals.row0.0'], undefined, 'Patient 1 seed does not invent snapshot values');
assert.equal(seededPatient1.values['packet.course.procedures'], undefined, 'Patient 1 seed does not invent procedures');
assert.equal(seededPatient1.values['packet.course.ventilatorTimeline'], undefined, 'Patient 1 seed does not invent ventilator progression');
assert.equal(seededPatient1.values['medications.0.drug'], undefined, 'Patient 1 seed does not invent medication names or doses');
assert.equal(seededPatient1.values['medications.0.pattern'], 'Scheduled');
assert.equal(seededPatient1.values['medications.1.pattern'], 'PRN');
const preservedStore = new Map([['sicuCasePacketPatient1', JSON.stringify({values:{diagnosis:'existing local draft'}})]]);
vm.runInContext(seedScript, vm.createContext({localStorage:{getItem:key=>preservedStore.get(key)??null,setItem:(key,value)=>preservedStore.set(key,value)}}));
assert.equal(JSON.parse(preservedStore.get('sicuCasePacketPatient1')).values.diagnosis, 'existing local draft', 'existing Patient 1 draft is never overwritten by seed');

const presentationScript = inlineScripts.find(script => script.includes("const panel=document.getElementById('sicu-presentation-panel')"));
assert.ok(presentationScript, 'patient presentation controller exists');
class PresentationElement {
  constructor(id = '') { this.id=id; this.value=''; this.hidden=false; this.className=''; this.attributes={}; this.handlers={}; this.children=[]; this._text=''; this.classList={add:()=>{},remove:()=>{}}; }
  addEventListener(type,handler){this.handlers[type]=handler;}
  setAttribute(name,value){this.attributes[name]=value;}
  replaceChildren(...children){this.children=children;}
  append(...children){this.children.push(...children);}
  focus(){}
  dispatchEvent(event){this.handlers[event.type]?.(event);}
  set textContent(value){this._text=String(value);}
  get textContent(){return this._text+this.children.map(child=>child.textContent).join('');}
}
const presentationNodes=new Map();
for(const id of ['sicu-presentation-panel','sicu-present-toggle','sicu-presentation-close','sicu-room-patient-slot','case-patient-slot','sicu-room-status','sicu-presentation-title','sicu-presentation-summary','sicu-presentation-vitals','sicu-presentation-meds','sicu-presentation-drips','sicu-presentation-procedures','sicu-presentation-ventilator'])presentationNodes.set(id,new PresentationElement(id));
presentationNodes.get('sicu-room-patient-slot').value='1';presentationNodes.get('case-patient-slot').value='1';
const presentationRecords=new Map([
  ['sicuCasePacketPatient1',{values:{presentationTitle:'Patient One Test Record',patientSummary:'Summary one', 'vitals.row0.hospitalDay':'day-label','vitals.row0.0':'time-entry','medications.0.pattern':'Scheduled','medications.0.drug':'medication-entry','packet.course.procedures':'procedure-entry','packet.course.ventilatorTimeline':'ventilator-entry'},medicationCount:1,dripCount:0}],
  ['sicuCasePacketPatient2',{values:{presentationTitle:'Patient Two Test Record',patientSummary:'Summary two'},medicationCount:0,dripCount:0}],
]);
const domReady=[];const windowListeners={};
const presentationContext=vm.createContext({
  document:{getElementById:id=>presentationNodes.get(id)||null,createElement:()=>new PresentationElement(),addEventListener:(type,fn)=>{if(type==='DOMContentLoaded')domReady.push(fn);},body:{classList:{add(){},remove(){}}}},
  window:{addEventListener:(type,fn)=>{windowListeners[type]=fn;}},
  localStorage:{getItem:key=>presentationRecords.has(key)?JSON.stringify(presentationRecords.get(key)):null},
  Event:class{constructor(type){this.type=type;}},
});
vm.runInContext(presentationScript,presentationContext);
for(const ready of domReady)ready();
assert.match(presentationNodes.get('sicu-presentation-summary').textContent,/Summary one/,'presentation starts with Patient 1 data');
assert.match(presentationNodes.get('sicu-presentation-vitals').textContent,/Hospital day day-label/,'presentation includes hospital-day snapshot structure');
assert.match(presentationNodes.get('sicu-presentation-meds').textContent,/medication-entry/,'presentation includes medication detail');
assert.match(presentationNodes.get('sicu-presentation-procedures').textContent,/procedure-entry/,'presentation includes procedures');
assert.match(presentationNodes.get('sicu-presentation-ventilator').textContent,/ventilator-entry/,'presentation includes ventilator course');
presentationNodes.get('sicu-room-patient-slot').value='2';presentationNodes.get('sicu-room-patient-slot').dispatchEvent({type:'change'});
assert.equal(presentationNodes.get('case-patient-slot').value,'2','room switcher changes the form record selection');
assert.match(presentationNodes.get('sicu-presentation-summary').textContent,/Summary two/,'presentation switches to Patient 2 record');
presentationNodes.get('sicu-present-toggle').dispatchEvent({type:'click'});
assert.equal(presentationNodes.get('sicu-presentation-panel').hidden,false,'presentation view opens');
presentationNodes.get('sicu-presentation-close').dispatchEvent({type:'click'});
assert.equal(presentationNodes.get('sicu-presentation-panel').hidden,true,'presentation returns to the room');


assert.match(html, /#case-cloud-sync #case-cloud-check,#case-cloud-sync #case-cloud-upload,#case-cloud-sync #case-cloud-download,#case-cloud-sync #case-cloud-replace\{display:none!important\}/, 'manual cloud-sync actions are hidden from the product');
assert.match(html, /<section id="case-cloud-sync"/, 'cloud sign-in and fictional confirmation remain available without a manual sync panel');

console.log('SICU packet form structure regression passed.');
