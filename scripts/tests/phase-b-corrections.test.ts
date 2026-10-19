import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import ts from 'typescript';
const root=resolve(import.meta.dirname,'../..');
const read=(p:string)=>readFileSync(resolve(root,p),'utf8');
const json=(p:string)=>JSON.parse(read(p));
const data='artifacts/stablecoin-hub/src/data/';
const home=json(data+'home-research-v02.generated.json'),conference=json(data+'conference-risk-framework-v02.generated.json'),market=json(data+'market-data-v02.generated.json'),plan=json('scripts/phase-b-data/ACADEMIC_DATA_PATCH_PLAN.json');
const exports:any={};
vm.runInNewContext(ts.transpileModule(read('artifacts/api-server/src/lib/publicDirectory.ts'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports});
const profile={id:202,name:'Exact author',profileUrl:'https://example.org/profile',verifiedOn:'2026-10-17',works:[{id:114}]};
test('verified author reuses the shared projection with a bound canonical ID',async()=>{
 const result=await exports.loadVerifiedResearcher(async(text:string,values:number[])=>{assert.match(text,/WHERE id = \$1/);assert.ok(text.includes(exports.PUBLIC_RESEARCHERS_SQL));assert.equal(values[0],202);return {rows:[profile]};},202);
 assert.equal(result,profile);assert.match(exports.PUBLIC_RESEARCHERS_SQL,/r.status='approved'/);
});
test('same-name different-ID records cannot become a verified identity',async()=>assert.equal(await exports.loadVerifiedResearcher(async()=>({rows:[{...profile,id:999}]}),202),null));
test('invalid IDs never query; missing or unverified records fall back',async()=>{
 for(const id of [0,-1,NaN,1.2,'202']) assert.equal(await exports.loadVerifiedResearcher(()=>{throw Error('Must not query')},id),null);
 for(const rows of [[],[{...profile,verifiedOn:null}],[{...profile,profileUrl:null}],[{...profile,works:[]}]]) assert.equal(await exports.loadVerifiedResearcher(async()=>({rows}),202),null);
});
test('query failure propagates instead of silently downgrading verified status',async()=>await assert.rejects(exports.loadVerifiedResearcher(async()=>{throw Error('DB unavailable')},202),/DB unavailable/));
test('both study projections use the exact preliminary schedule with unknown actual dates',()=>{
 assert.deepEqual(home.study,conference.study);
 const s=home.study;assert.equal(s.programme_date,'2026-09-30');assert.equal(s.programme_session,'Online Session 1');assert.equal(s.programme_label_en,'Listed in the preliminary programme:');assert.equal(s.programme_label_zh,'初步节目表所列场次：');assert.equal(s.programme_display_en,'30 September 2026 · Online Session 1');assert.equal(s.programme_display_zh,'2026年9月30日 · 线上第1场');assert.equal(s.conference_start,'2026-09-29');assert.equal(s.conference_end,'2026-10-02');
 for(const k of ['presentation_date','actual_presentation_date','individual_acceptance_date','publication_date']) assert.equal(s[k],null);
 assert.equal(home.acceptance,'ACCEPTED_CONFERENCE_PAPER');
});
test('anonymised manuscript label preserves exact existing PDF bytes',()=>{
 assert.equal(home.paper.label_en,'Submitted anonymised manuscript');assert.equal(home.paper.label_zh,'匿名送审稿');
 const bytes=readFileSync(resolve(root,'artifacts/stablecoin-hub/public'+home.paper.url));assert.equal(bytes.length,11838783);assert.equal(createHash('sha256').update(bytes).digest('hex'),'25eaf2418c2cb6c1a3fb20302203608973650f736893bd4b66811fe8bc54344d');
});
test('both Artemis sources and dataset acknowledge retired endpoints and non-comparable gross volume',()=>{
 for(const id of ['SRC-MD-08','SRC-MD-09']){const s=market.sources.find((s:any)=>s.source_id===id);assert.equal(s.url,'https://www.artemis.ai/docs/data-reference/stablecoin-methodology');assert.equal(s.status,'RETIRED');assert.equal(s.site_mode,'HISTORICAL_RETIRED_METHODOLOGY');assert.match(s.use_for,/retired/);}
 const d=market.datasets.find((d:any)=>d.dataset_id==='DS-ARTEMIS-ACTIVITY');assert.equal(d.mode,'HISTORICAL_RETIRED_METHODOLOGY');assert.match(d.critical_boundary,/not a continuous replacement/);
});
test('academic plan targets seven IDs and cannot change status or invent verification dates',()=>{
 assert.deepEqual(plan.resourceIds,[107,127,159,162,180,284,429]);assert.equal(plan.applyAuthorized,false);
 for(const p of plan.patches){assert.equal(p.before.status,'approved');assert.ok(!('status' in p.resourcePatch));assert.ok(!('verified_on' in p.metadataPatch));assert.ok(!('language' in p.metadataPatch)||p.id===429);}
 assert.deepEqual(plan.patches.find((p:any)=>p.id===107).resourcePatch,{source_type:'conference_paper'});
});
test('unpublished contribution, formal chapter and invalid DOI have coherent patches',()=>{
 const p=(id:number)=>plan.patches.find((p:any)=>p.id===id);
 assert.deepEqual(p(429).resourcePatch.authors,['Ching Kar Chung','Angela Marqui','Ambi Ambituuni']);assert.equal(p(429).metadataPatch.evidence_type,'conference_contribution');assert.match(p(429).metadataPatch.method,/Unpublished/);assert.deepEqual(p(284).resourcePatch,{published_date:'2023',source_type:'book_chapter'});assert.equal(plan.versionRelation,'VERSION_RELATION_PENDING');assert.ok(!plan.resourceIds.includes(285));assert.equal(p(159).resourcePatch.doi,null);assert.equal(p(159).before.doi,'10.29094/1164');assert.equal(p(127).metadataPatch.venue,'HKMA Insight / 汇思');assert.equal(p(180).resourcePatch.authors,undefined);
});
test('historical dry-run audit preserves recorded public counts and all non-target records',()=>{
 const d=json('scripts/tests/fixtures/phase-b-academic-dry-run.historical.json');assert.equal(d.status,'PASS');assert.equal(d.productionWrites,0);assert.equal(d.nonTargetChanges,0);assert.equal(d.statusChanges,0);assert.equal(d.approvedAfter,395);assert.equal(d.nonNewsAfter,378);
});
test('author page retains publication links and guards legacy metadata display',()=>{
 const p=read('artifacts/stablecoin-hub/src/pages/author.tsx');assert.match(p,/ResearcherCard researcher=\{author.verifiedProfile\}/);assert.match(p,/Bibliographic author record/);assert.match(p,/Verified researcher profile/);assert.match(p,/academic-resources\?id=\$\{resource.id\}/);assert.match(p,/setLocation\("\/experts"\)/);assert.match(p,/!author.verifiedProfile && author.bio/);
});
test('prepared transaction has no CLI execution and synchronizes authors atomically',()=>{
 const s=read('scripts/phase-b-data/prepared-transaction.ts');assert.match(s,/authorization !== 'OWNER_APPROVED_PERSISTENT_PHASE_B_2026_10_18'/);assert.match(s,/syncResourceAuthors\(patch.id,patch.resourcePatch.authors,tx\)/);assert.match(s,/isolationLevel:'serializable'/);assert.match(s,/Before-image drift/);assert.match(s,/export async function rollbackReviewedPhaseB/);assert.doesNotMatch(s,/process\.argv|applyReviewedPhaseB\(process/);
});

function transactionHarness() {
 const rows=new Map(plan.patches.map((p:any)=>[p.id,structuredClone(p.before)]));
 const authorCalls:any[]=[];let transactions=0;
 const resourceTable={id:'resource_id',kind:'resource'},metadataTable={resourceId:'resource_id',kind:'metadata'};
 const columns:any={sourceType:'source_type',publishedDate:'published_date',resourceId:'resource_id',seedId:'seed_id',seedOrigin:'seed_origin',evidenceType:'evidence_type',themeTerms:'theme_terms',verifiedOn:'verified_on',relevanceNote:'relevance_note'};
 const unmap=(values:any)=>Object.fromEntries(Object.entries(values).map(([k,v])=>[columns[k]||k,v]));
 const tx:any={
  execute:async(query:any)=>{
   if(query.text.startsWith('SELECT r.id'))return {rows:[structuredClone(rows.get(query.values[0]))]};
   if(query.text.startsWith('SELECT author_id FROM resource_authors'))return {rows:[{author_id:1054},{author_id:1055},{author_id:1056}]};
   if(query.text.startsWith('SELECT id FROM authors'))return {rows:[]};
   return {rows:[]};
  },
  update:(table:any)=>({set:(values:any)=>({where:({value}:any)=>{
   const row:any=rows.get(value);Object.assign(table.kind==='resource'?row:row.metadata,unmap(values));
   return Object.assign(Promise.resolve([]),{returning:async()=>[{id:value}]});
  }})}),
  insert:()=>({values:async(values:any)=>{const v:any=unmap(values);const row:any=rows.get(v.resource_id);row.metadata={resource_id:v.resource_id,seed_id:v.seed_id,seed_origin:v.seed_origin,theme_terms:[],venue:null,language:null,evidence_type:null,method:null,access:null,relevance_note:null,verified_on:null,...v};}}),
  delete:()=>({where:async({value}:any)=>{(rows.get(value) as any).metadata=null;}}),
 };
 const db={transaction:async(fn:any,options:any)=>{
  transactions++;assert.equal(options.isolationLevel,'serializable');const before=structuredClone(rows);const n=authorCalls.length;
  try{return await fn(tx);}catch(e){rows.clear();for(const [id,row]of before)rows.set(id,row);authorCalls.length=n;throw e;}
 }};
 const mod:any={};
 const source=read('scripts/phase-b-data/prepared-transaction.ts').replaceAll('import.meta.url','"file:///prepared-transaction.ts"');
 const overrides:any={
  'node:fs':{readFileSync:()=>JSON.stringify(plan)},
  'node:util':{isDeepStrictEqual:(a:any,b:any)=>{try{assert.deepEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)));return true;}catch{return false;}}},
  '@workspace/db':{db,resourcesTable:resourceTable,publicResourceMetadataTable:metadataTable},
  'drizzle-orm':{eq:(column:any,value:any)=>({column,value}),sql:(parts:any,...values:any[])=>({text:parts.join('?'),values})},
  '../../artifacts/api-server/src/lib/resourceAuthors':{syncResourceAuthors:async(id:any,names:any,database:any)=>{assert.equal(database,tx);authorCalls.push({id,names});}},
 };
 vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:mod,require:(id:string)=>{assert.ok(id in overrides,id);return overrides[id]},URL});
 return {mod,rows,authorCalls,transactions:()=>transactions};
}
const authorization='OWNER_APPROVED_PERSISTENT_PHASE_B_2026_10_18';
test('prepared transaction rejects missing owner authorization before opening a transaction',async()=>{
 const h=transactionHarness();await assert.rejects(h.mod.applyReviewedPhaseB(''),/owner production-data authorization/);assert.equal(h.transactions(),0);
});
test('before-image drift aborts every resource change atomically',async()=>{
 const h=transactionHarness();(h.rows.get(180) as any).url='https://example.org/new-owner-edit';const before=structuredClone([...h.rows]);await assert.rejects(h.mod.applyReviewedPhaseB(authorization),/Before-image drift/);assert.deepEqual(JSON.parse(JSON.stringify([...h.rows])),before);assert.equal(h.authorCalls.length,0);
});
test('prepared apply and rollback round-trip all planned records, preserving moderation and author scope',async()=>{
 const h=transactionHarness();const before=structuredClone([...h.rows]);const applied=await h.mod.applyReviewedPhaseB(authorization);assert.equal(applied.affectedResources,7);
 assert.equal((h.rows.get(159) as any).doi,null);assert.equal((h.rows.get(429) as any).metadata.verified_on,null);assert.equal(h.authorCalls.length,1);assert.equal(h.authorCalls[0].id,429);
 for(const row of h.rows.values())assert.equal((row as any).status,'approved');
 await h.mod.rollbackReviewedPhaseB(authorization);assert.deepEqual(JSON.parse(JSON.stringify([...h.rows])),before);assert.equal(h.authorCalls.length,2);assert.equal(h.authorCalls[1].id,429);
});
test('rollback stops rather than discarding later metadata enrichment',async()=>{
 const h=transactionHarness();await h.mod.applyReviewedPhaseB(authorization);(h.rows.get(429) as any).metadata.access='Later verified value';const before=structuredClone([...h.rows]);await assert.rejects(h.mod.rollbackReviewedPhaseB(authorization),/Later metadata enrichment/);assert.deepEqual(JSON.parse(JSON.stringify([...h.rows])),before);
});
