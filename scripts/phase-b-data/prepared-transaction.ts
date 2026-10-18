/** Prepared only. No CLI entry point. Importing this module does not apply data.
 * A later owner-authorized operation must explicitly call apply/rollback.
 */
import { readFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { db, resourcesTable, publicResourceMetadataTable } from '@workspace/db';
import { eq, sql } from 'drizzle-orm';
import { syncResourceAuthors } from '../../artifacts/api-server/src/lib/resourceAuthors';
const plan = JSON.parse(readFileSync(new URL('./ACADEMIC_DATA_PATCH_PLAN.json', import.meta.url), 'utf8'));
const resourceColumns: Record<string, string> = {url:'url',doi:'doi',source_type:'sourceType',published_date:'publishedDate',authors:'authors'};
const metadataColumns: Record<string, string> = {venue:'venue',language:'language',evidence_type:'evidenceType',method:'method'};
function mapped(patch: Record<string, unknown>, columns: Record<string,string>) {
  return Object.fromEntries(Object.entries(patch).map(([key,value])=>{
    if(!columns[key]) throw Error('Unauthorized column '+key);
    return [columns[key],value];
  }));
}
function authorize(authorization: string) {
  if(authorization !== 'OWNER_APPROVED_PERSISTENT_PHASE_B_2026_10_18') throw Error('Explicit owner production-data authorization required');
  const ids=[107,127,159,162,180,284,429];
  if(!isDeepStrictEqual(plan.resourceIds,ids) || !isDeepStrictEqual(plan.patches.map((p:any)=>p.id),ids)) throw Error('Unexpected target IDs');
  if(plan.patches.some((p:any)=>p.before.id!==p.id || p.before.status!=='approved')) throw Error('Invalid approved before-image');
}
async function current(tx:any,id:number) {
  const result=await tx.execute(sql`SELECT r.id,r.title,r.authors,r.source_type,r.published_date,r.url,r.doi,r.status,to_jsonb(m) AS metadata FROM resources r LEFT JOIN public_resource_metadata m ON m.resource_id=r.id WHERE r.id=${id} FOR UPDATE OF r`);
  if(result.rows.length!==1) throw Error('Target missing '+id);
  return result.rows[0];
}
export async function applyReviewedPhaseB(authorization:string) {
  authorize(authorization);
  return db.transaction(async tx=>{
    // Serialise this patch; metadata locks prevent concurrent field drift.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(20261018)`);
    await tx.execute(sql`SELECT resource_id FROM public_resource_metadata WHERE resource_id IN (107,127,159,162,180,284,429) FOR UPDATE`);
    for(const patch of plan.patches) if(!isDeepStrictEqual(await current(tx,patch.id),patch.before)) throw Error('Before-image drift '+patch.id);
    const priorLinks=await tx.execute(sql`SELECT author_id FROM resource_authors WHERE resource_id=429 ORDER BY author_id FOR UPDATE`);
    if(!isDeepStrictEqual(priorLinks.rows.map((r:any)=>r.author_id),plan.guardedAuthorSync.authorLinksBefore)) throw Error('Author link before-image drift');
    // Existing helper uses exact name lookup. Abort instead of choosing between duplicate identities.
    for(const name of plan.patches.find((p:any)=>p.id===429).resourcePatch.authors) {
      const match=await tx.execute(sql`SELECT id FROM authors WHERE name=${name}`);
      if(match.rows.length>1) throw Error('Ambiguous exact bibliographic name '+name);
    }
    for(const patch of plan.patches) {
      const updated=await tx.update(resourcesTable).set(mapped(patch.resourcePatch,resourceColumns)).where(eq(resourcesTable.id,patch.id)).returning({id:resourcesTable.id});
      if(updated.length!==1) throw Error('Unexpected affected count');
      if(patch.resourcePatch.authors) await syncResourceAuthors(patch.id,patch.resourcePatch.authors,tx);
      if(Object.keys(patch.metadataPatch).length) {
        if(patch.before.metadata) await tx.update(publicResourceMetadataTable).set(mapped(patch.metadataPatch,metadataColumns)).where(eq(publicResourceMetadataTable.resourceId,patch.id));
        else await tx.insert(publicResourceMetadataTable).values({resourceId:patch.id,seedId:`PHASE-B-2026-10-18-${patch.id}`,seedOrigin:'PHASE_B_TARGETED_CORRECTION_2026_10_18',...mapped(patch.metadataPatch,metadataColumns)});
      }
      const after=await current(tx,patch.id);
      if(after.status!=='approved') throw Error('Approval changed');
      for(const [key,value] of Object.entries(patch.resourcePatch)) if(!isDeepStrictEqual(after[key],value)) throw Error('Resource postcondition failed');
      for(const [key,value] of Object.entries(patch.metadataPatch)) if(!isDeepStrictEqual(after.metadata[key],value)) throw Error('Metadata postcondition failed');
    }
    return {affectedResources:7,metadataResources:2,approvalChanges:0};
  },{isolationLevel:'serializable'});
}
export async function rollbackReviewedPhaseB(authorization:string) {
  authorize(authorization);
  return db.transaction(async tx=>{
    await tx.execute(sql`SELECT pg_advisory_xact_lock(20261018)`);
    for(const patch of [...plan.patches].reverse()) {
      const after=await current(tx,patch.id);
      if(after.status!=='approved') throw Error('Approval drift; rollback stopped');
      for(const [key,value] of Object.entries(patch.resourcePatch)) if(!isDeepStrictEqual(after[key],value)) throw Error('After-image drift '+patch.id);
      for(const [key,value] of Object.entries(patch.metadataPatch)) if(!isDeepStrictEqual(after.metadata?.[key],value)) throw Error('Metadata drift '+patch.id);
      const restored=Object.fromEntries(Object.keys(patch.resourcePatch).map(key=>[key,patch.before[key]]));
      await tx.update(resourcesTable).set(mapped(restored,resourceColumns)).where(eq(resourcesTable.id,patch.id));
      if(restored.authors) await syncResourceAuthors(patch.id,restored.authors,tx);
      if(Object.keys(patch.metadataPatch).length) {
        if(patch.before.metadata) await tx.update(publicResourceMetadataTable).set(mapped(Object.fromEntries(Object.keys(patch.metadataPatch).map(k=>[k,patch.before.metadata[k]])),metadataColumns)).where(eq(publicResourceMetadataTable.resourceId,patch.id));
        else {
          if(after.metadata.seed_id!==`PHASE-B-2026-10-18-${patch.id}`) throw Error('Metadata ownership drift');
          // Refuse to discard later enrichment outside this patch.
          const empty={resource_id:patch.id,seed_id:`PHASE-B-2026-10-18-${patch.id}`,seed_origin:'PHASE_B_TARGETED_CORRECTION_2026_10_18',theme_terms:[],venue:null,language:null,evidence_type:null,method:null,access:null,relevance_note:null,verified_on:null,...patch.metadataPatch};
          if(!isDeepStrictEqual(after.metadata,empty)) throw Error('Later metadata enrichment; manual rollback required');
          await tx.delete(publicResourceMetadataTable).where(eq(publicResourceMetadataTable.resourceId,patch.id));
        }
      }
    }
    // Author entities are never deleted or globally renamed; restore only resource 429 links.
    return {restoredResources:7,approvalChanges:0,authorEntitiesDeleted:0};
  },{isolationLevel:'serializable'});
}
