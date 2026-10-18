import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync,existsSync,symlinkSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
const root='/Users/shirleylee/Downloads/Stablecoin-Lifecycle-history-rewrite-2026-10-17';
const output=root+'/outputs/visual-restoration-2026-10-18';
const old='/private/tmp/stablecoin-original-ui-542f534';
const require=createRequire(root+'/artifacts/stablecoin-hub/package.json');
const apiRequire=createRequire(root+'/artifacts/api-server/package.json');
const express=apiRequire('express');
const {createServer}=await import(require.resolve('vite'));
const react=(await import(require.resolve('@vitejs/plugin-react'))).default;
const tailwind=(await import(require.resolve('@tailwindcss/vite'))).default;
if(!existsSync(old+'/artifacts/stablecoin-hub/src')) {
 mkdirSync(old,{recursive:true});
 const archive=execFileSync('git',['archive','542f53491e4df05dd153aca2b4ed397a482ecff3','artifacts/stablecoin-hub','attached_assets','tsconfig.base.json'],{cwd:root,maxBuffer:100*1024*1024});
 execFileSync('tar',['-x','-C',old],{input:archive});
}
for(const [from,to] of [[root+'/node_modules',old+'/node_modules'],[root+'/lib',old+'/lib'],[root+'/artifacts/stablecoin-hub/node_modules',old+'/artifacts/stablecoin-hub/node_modules']]) if(!existsSync(to))symlinkSync(from,to,'dir');
const json=p=>JSON.parse(readFileSync(root+'/outputs/'+p,'utf8'));
const resources=json('production-academic-data-apply-2026-10-18/evidence/directory-resources-after.json');
const researchers=json('phase-b-corrections-2026-10-18/evidence/directory-researchers.json');
const authors=json('phase-b-corrections-2026-10-18/evidence/legacy-public-authors.json');
const market=json('phase-c-svg-correction-2026-10-18/evidence/live-market.json');
const macro=json('phase-c-svg-correction-2026-10-18/evidence/live-macro.json');
const liquidity=json('phase-c-svg-correction-2026-10-18/evidence/live-liquidity.json');
const legacyMarket={source:'DefiLlama',sourceUrl:market.total.source_url,refreshedAt:market.fetched_at,summary:{totalUsd:market.total.value,bellwetherDominancePct:market.top2.value,change1dPct:null,change7dPct:null,change30dPct:market.change30d.value},history:market.history.map(p=>({date:p.date,totalUsd:p.value})),projects:[],chains:market.chains.map(c=>({name:c.name,totalUsd:c.metric.value,sharePct:c.metric.value/market.total.value*100,change30dPct:null,history:[],dominantAssets:[]}))};
const app=express();
app.use((req,res,next)=>{if(req.method!=='GET')return res.status(405).json({error:'LOCAL_PREVIEW_READ_ONLY'});res.set('X-Local-Preview','public-snapshot-only');next();});
app.get('/api/public-directory/resources',(_q,s)=>s.json(resources));
app.get('/api/public-directory/researchers',(_q,s)=>s.json(researchers));
// Legacy payload compatibility for the archived UI only; unknown source metadata stays null.
app.get('/api/resources',(_q,s)=>s.json(resources.records.map(r=>({...r,abstract:null,publishedDate:null,createdAt:'',facetedTags:[],keywordsSource:null,createdBy:null,reviewedAt:null}))));
app.get('/api/authors',(_q,s)=>s.json(authors));
app.get('/api/tags',(_q,s)=>s.json([]));
app.get('/api/stablecoin-market-legacy',(_q,s)=>s.json(legacyMarket));
app.get('/api/stablecoin-market',(_q,s)=>s.json(market));
app.get('/api/stablecoin-macro',(_q,s)=>s.json(macro));
app.get('/api/stablecoin-liquidity',(_q,s)=>s.json(liquidity));
app.get('/api/stablecoin-prices',(_q,s)=>s.json({series:[],state:'UNAVAILABLE',note:'Local snapshot preview'}));
app.get('/api/stablecoin-issuance-status',(_q,s)=>s.json({records:[],state:'UNAVAILABLE',note:'Local snapshot preview'}));
app.get('/api/healthz',(_q,s)=>s.json({status:'ok',mode:'LOCAL_READ_ONLY_SNAPSHOT'}));
app.use('/api',(q,s)=>s.status(404).json({error:'NO_LOCAL_FIXTURE',path:q.path}));
const api=app.listen(5291,'127.0.0.1');
const servers=[];
for(const [label,base,port] of [['baseline',old,5292],['restored',root,5293]]) {
 const dir=base+'/artifacts/stablecoin-hub';
 const server=await createServer({configFile:false,root:dir,envFile:false,cacheDir:'/private/tmp/hub-ui-'+label+'-vite-cache',base:'/',plugins:[react(),tailwind()],resolve:{alias:{'@':dir+'/src','@assets':base+'/attached_assets'},dedupe:['react','react-dom']},define:{'import.meta.env.VITE_API_BASE_URL':JSON.stringify('')},server:{host:'127.0.0.1',port,strictPort:true,proxy:{'/api':{target:'http://127.0.0.1:5291',rewrite:p=>label==='baseline'&&p==='/api/stablecoin-market'?'/api/stablecoin-market-legacy':p}},fs:{allow:[root,old]}}});
 await server.listen();servers.push(server);console.log(label+' http://127.0.0.1:'+port);
}
writeFileSync(output+'/LOCAL_PREVIEW_STATE.json',JSON.stringify({baseline:'http://127.0.0.1:5292',restored:'http://127.0.0.1:5293',api:'http://127.0.0.1:5291',data:'Previously saved public snapshots, no database connection or credentials loaded',productionDml:0},null,2));
const stop=async()=>{for(const s of servers)await s.close();api.close();process.exit(0);};
process.on('SIGINT',stop);process.on('SIGTERM',stop);
