// Offline, field-level simulation from the separately captured READ ONLY public snapshot.
// This program has no database connection or write capability.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
const root = resolve(import.meta.dirname, '../..');
const output = resolve(root, 'outputs/phase-b-corrections-2026-10-18');
const plan = JSON.parse(readFileSync(resolve(import.meta.dirname, 'ACADEMIC_DATA_PATCH_PLAN.json')));
const rows = JSON.parse(readFileSync(resolve(output, 'evidence/target-rows.json')));
const directory = JSON.parse(readFileSync(resolve(output, 'evidence/directory-resources.json')));
const expected = [107,127,159,162,180,284,429];
if (!isDeepStrictEqual(plan.resourceIds, expected)) throw Error('Unexpected target IDs');
const changes = [];
for (const patch of plan.patches) {
  const before = rows.find(r => r.id === patch.id);
  if (!isDeepStrictEqual(before, patch.before) || before.status !== 'approved') throw Error('Snapshot drift: ' + patch.id);
  if (Object.keys(patch.resourcePatch).some(k => !['url','doi','source_type','published_date','authors'].includes(k))) throw Error('Unapproved column');
  if (Object.keys(patch.metadataPatch).some(k => !['venue','language','evidence_type','method'].includes(k))) throw Error('Unapproved metadata column');
  for (const [field, after] of Object.entries(patch.resourcePatch)) changes.push({id:patch.id,table:'resources',field,before:before[field],after,evidence:patch.evidence});
  for (const [field, after] of Object.entries(patch.metadataPatch)) changes.push({id:patch.id,table:'public_resource_metadata',field,before:before.metadata?.[field]??null,after,evidence:patch.evidence});
}
const after = structuredClone(directory.records);
for (const patch of plan.patches) {
  const record=after.find(r=>r.id===patch.id);
  const columns={source_type:'sourceType',published_date:'yearLabel'};
  for(const [field,value] of Object.entries(patch.resourcePatch)) record[columns[field]||field]=value;
  const metaColumns={evidence_type:'evidenceType'};
  for(const [field,value] of Object.entries(patch.metadataPatch)) record[metaColumns[field]||field]=value;
}
for(const record of after) if(!expected.includes(record.id) && !isDeepStrictEqual(record,directory.records.find(r=>r.id===record.id))) throw Error('Non-target changed');
const result={status:'PASS',mode:'OFFLINE_SIMULATION_OF_READ_ONLY_SNAPSHOT',productionWrites:0,affectedResources:7,metadataRowsToInsert:2,fieldChanges:changes.length,approvedBefore:directory.total,approvedAfter:after.length,nonNewsBefore:directory.records.filter(r=>r.sourceType!=='news').length,nonNewsAfter:after.filter(r=>r.sourceType!=='news').length,nonTargetChanges:0,statusChanges:0,verifiedOnInferred:0,authorSync:'PREPARED_ONLY; exact names; resource 429 only',versionRelation:'VERSION_RELATION_PENDING',PERSISTENT_DATA_APPLY_PENDING:true};
writeFileSync(resolve(output,'ACADEMIC_DATA_BEFORE_AFTER.json'), JSON.stringify(changes,null,2)+'\n');
writeFileSync(resolve(output,'ACADEMIC_DATA_DRY_RUN.json'), JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));
