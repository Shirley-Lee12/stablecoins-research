import {createHash} from 'node:crypto';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
const root=resolve(import.meta.dirname,'../..'),prefix='artifacts/stablecoin-hub/src/';
const read=(p:string)=>readFileSync(resolve(root,p),'utf8');
function breadcrumbs(){
 const text=read(prefix+'components/layout.tsx'),tree=ts.createSourceFile('layout.tsx',text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let fn='',routes='';
 function visit(n:ts.Node){if(ts.isFunctionDeclaration(n)&&n.name?.text==='useBreadcrumbs')fn=n.getText(tree);if(ts.isVariableDeclaration(n)&&n.name.getText(tree)==='ROUTE_LABELS')routes=n.initializer!.getText(tree);ts.forEachChild(n,visit);}visit(tree);
 assert.ok(fn&&routes);const exports:any={};vm.runInNewContext(ts.transpileModule('const ROUTE_LABELS='+routes+';'+fn+';exports.build=useBreadcrumbs;',{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,decodeURIComponent});return exports.build;
}
test('actual legacy-author breadcrumb returns through Researchers and decodes the name without inferring identity',()=>{
 const build=breadcrumbs();for(const lang of ['en','zh']){const result=build('/authors/'+encodeURIComponent('张三 & Alice'),lang);assert.equal(result[1].href,'/experts');assert.equal(result.at(-1).label,'张三 & Alice');assert.equal(result.filter((x:any)=>x.href==='/authors').length,0);assert.equal(result[1].label,lang==='zh'?'专家与机构':'Experts & Institutions');}
 assert.doesNotThrow(()=>build('/authors/%E0%A4%A','en'));assert.equal(build('/market-data/adoption','zh').at(-1).label,'采用');
});
test('unreviewed Agentic content, D01, data and styles remain byte-identical to 894e040',()=>{
 const files=['pages/agentic-payments.tsx','components/agentic-evidence-notes.tsx','components/agentic-payment-stack.tsx','components/agentic-payment-ui.tsx','data/agentic-payments-reconciled.ts','data/agentic-ecosystem-translations.ts','data/friday-agentic-payments.ts','data/agentic-payments-v02.generated.json','index.css','components/section-top-nav.tsx'];
 for(const relative of files){const path=prefix+relative;assert.equal(read(path),execFileSync('git',['show','894e0408f24675106991a88bf1edef287ada8bf9:'+path],{cwd:root,encoding:'utf8'}),path);}
});
test('historical dry-run fixture is an authentic immutable audit, not a live database response',()=>{
 const text=read('scripts/tests/fixtures/phase-b-academic-dry-run.historical.json');
 // Digest of the real pre-existing offline report. Counts describe that historical simulation only.
 assert.equal(createHash('sha256').update(text).digest('hex'),'e143bd58936bdda4f1bf97c70bc573537120a9c5317d926e983206b48beb0305');
 const data=JSON.parse(text);assert.equal(data.mode,'OFFLINE_SIMULATION_OF_READ_ONLY_SNAPSHOT');assert.equal(data.productionWrites,0);
});
