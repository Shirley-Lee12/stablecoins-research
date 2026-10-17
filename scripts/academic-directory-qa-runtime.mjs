// Loopback-only UI QA. Executes the actual production public projection in READ ONLY transactions.
import 'dotenv/config';import {createRequire} from 'node:module';import {readFileSync} from 'node:fs';import {resolve} from 'node:path';import vm from 'node:vm';import ts from 'typescript';
const root=resolve(import.meta.dirname,'..');const req=createRequire(resolve(root,'artifacts/api-server/package.json'));const express=req('express');const {Pool}=createRequire(resolve(root,'lib/db/package.json'))('pg');const pool=new Pool({connectionString:process.env.DATABASE_URL,max:3,connectionTimeoutMillis:10000});
const code=ts.transpileModule(readFileSync(resolve(root,'artifacts/api-server/src/lib/publicDirectory.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;const exp={};vm.runInNewContext(code,{exports:exp});let failed=false;
async function query(sql){if(failed)throw Error('QA_FAILURE');const c=await pool.connect();try{await c.query('BEGIN READ ONLY');const rows=await c.query(sql);await c.query('ROLLBACK');return rows;}finally{await c.query('ROLLBACK').catch(()=>{});c.release();}}
const app=express();app.use((_req,res,next)=>{res.setHeader('Access-Control-Allow-Origin','http://localhost:5183');next();});
app.post('/__qa/fail',(_req,res)=>{failed=true;res.json({failed});});app.post('/__qa/recover',(_req,res)=>{failed=false;res.json({failed});});
for(const kind of ['resources','researchers'])app.get('/api/public-directory/'+kind,async(_req,res)=>{try{res.json(await exp.loadPublicDirectory(query,kind));}catch{res.status(503).json({version:'0.2',state:'UNAVAILABLE',error:'The public research directory is temporarily unavailable.'});}});
app.listen(3001,'127.0.0.1',()=>console.log('Read-only public directory QA API on loopback :3001'));
