import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
import ts from 'typescript';
const root=resolve(import.meta.dirname,'../..'),hub=resolve(root,'artifacts/stablecoin-hub/src');
const read=(p:string)=>readFileSync(resolve(hub,p),'utf8');
test('Friday sidebar keeps About and Agentic as single entries and preserves original top navigation',()=>{
 const text=read('components/layout.tsx'),sf=ts.createSourceFile('layout.tsx',text,ts.ScriptTarget.Latest,true);let init='';
 function visit(n:ts.Node){if(ts.isVariableDeclaration(n)&&n.name.getText(sf)==='NAV_ITEMS')init=n.initializer!.getText(sf);ts.forEachChild(n,visit)}visit(sf);
 const context:any=Object.fromEntries(['Home','LayoutDashboard','BookOpen','MapPinned','Workflow','Microscope','Database','UsersRound','BarChart','LineChart'].map(n=>[n,n]));
 vm.runInNewContext('items='+init,context);
 for(const href of ['/about-stablecoins','/agentic-payments']){const item=context.items.find((n:any)=>n.href===href);assert.ok(item);assert.equal(item.children,undefined);assert.ok(item.labelEn&&item.labelZh)}
 const about=read('components/about-section-nav.tsx');for(const suffix of ['history','types','applications','regulatory-evolution'])assert.ok(about.includes('/about-stablecoins/'+suffix));assert.ok(about.includes('/regulatory'));
 const payments=read('components/agentic-payment-ui.tsx');assert.ok(payments.includes('SectionTopNav'));for(const suffix of ['protocols','scenarios','ecosystem'])assert.ok(payments.includes(suffix));
});
test('Friday layout retains the original task-oriented Agentic overview rather than either rejected design',()=>{
 const page=read('pages/agentic-payments.tsx');for(const text of ['智能体如何付款，用户如何保持控制？','What would you ask an agent to do?','TaskExplorer','PaymentFlow','aria-pressed','PaymentProtocolNav'])assert.ok(page.includes(text),text);
 assert.ok(page.includes('@/data/friday-agentic-payments'));assert.ok(read('App.tsx').includes('/market-data/macro'));
});
test('backend, schema, governance, verified source packages and binary research inputs remain unchanged',()=>{
 const paths=execFileSync('git',['diff','c8a7b6024c0b966781ed3aa4918e22586cacfdd8','--name-only'],{cwd:root,encoding:'utf8'}).trim().split('\n');
 for(const path of paths)assert.doesNotMatch(path,/^(artifacts\/api-server\/|lib\/|docs\/source-packages\/|DEPLOYMENT\.md$)|\.(pdf|zip)$/);
});
test('restored public research uses conference examples and discloses future-work boundaries',()=>{
 const research=read('pages/research.tsx');assert.ok(research.includes('@/data/conference-risk-framework'));assert.ok(research.includes('TAXONOMY_BOUNDARY'));assert.ok(research.includes('representative'));
 for(const old of ['@/data/research-risks','risk-lifecycle.jpg','risk-amplification-pyramid.jpg','risk-transmission-path.jpg','Common 27','Unique 28','All 55'])assert.ok(!research.includes(old),old);
 const quant=read('pages/quantitative.tsx');for(const falseClaim of ['Expected release: Q3 2024','A real-time gauge','Model under calibration','Collaborating with international payment gateways'])assert.ok(!quant.includes(falseClaim));
 assert.ok(quant.includes('No operational index'));assert.ok(research.includes('Submitted anonymised manuscript'));
});
test('market recovery preserves dated observations, real nulls and USDT quote units',()=>{
 const data=(n:string)=>JSON.parse(readFileSync(resolve(root,'artifacts/stablecoin-hub/public/friday-data/'+n+'.json'),'utf8'));
 const m=data('market');assert.equal(m.preview.returned,50);assert.equal(m.projects.filter((p:any)=>p.status==='active').length,50);assert.ok(m.summary.totalUsd>300e9);assert.ok(Math.abs(m.summary.change30dPct)<100);
 assert.equal(data('macro').series.length,11);assert.ok(data('macro').series.some((s:any)=>s.observations.some((p:any)=>p.value===null)));
 assert.ok(data('liquidity').venues.every((v:any)=>v.depth2PctBidUsd===null&&v.quoteCurrency==='USDT'));
 const page=read('pages/market-structure.tsx');assert.ok(page.includes('2% 买盘深度 · USDT'));assert.ok(page.includes('row.volume24hUsd == null ? "—"'));
 assert.ok(read('components/friday-data-notice.tsx').includes('非实时'));
});
test('required old and current public regional URLs remain available without changing backend routes',()=>{
 const app=read('App.tsx');for(const route of ['/mainland-china','/hong-kong','/singapore','/uae','/regional-developments/mainland-china','/about-stablecoins','/agentic-payments','/academic-resources','/authors/:name','/profile'])assert.ok(app.includes('path="'+route+'"'),route);
});
test('unverified independent A2P2 classification is not republished by the historical protocol dataset',()=>{
 const source=read('data/friday-agentic-payments.ts');assert.ok(!source.includes('id: "a2p2"'));assert.ok(!source.includes('protocols: ["a2p2"]'));assert.ok(existsSync(resolve(hub,'data/agentic-payments-v02.generated.json')));
});
