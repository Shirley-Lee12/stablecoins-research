/** Minimal TS/TSX SSR loader. No API response substitution: effects never execute during SSR.
 * UI primitives are transparent so source/popover bodies are included in content scans.
 * Actual React state/memo/context semantics are retained; page-specific contexts are explicit overrides.
 */
import {readFileSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
export function renderModule(root:string,filename:string,overrides:Record<string,any>={},globals:Record<string,any>={}){
 const req=createRequire(resolve(root,'artifacts/stablecoin-hub/package.json')),React=req('react'),cache=new Map<string,any>();
 const transparent=({children,asChild,...props}:any)=>React.createElement('div',Object.fromEntries(Object.entries(props).filter(([k])=>k==='className'||k==='id'||k.startsWith('data-')||k.startsWith('aria-'))),children);
 const primitive=new Proxy({}, {get:(_o,key)=>key==='__esModule'?true:transparent});
 function load(file:string):any{
  if(cache.has(file))return cache.get(file);
  if(file.endsWith('.json'))return JSON.parse(readFileSync(file,'utf8'));
  const exports:any={};cache.set(file,exports);
  const source=readFileSync(file,'utf8').replaceAll('import.meta.env','({BASE_URL:"/",VITE_API_BASE_URL:""})');
  const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  vm.runInNewContext(js,{exports,URL,URLSearchParams,encodeURIComponent,decodeURIComponent,console,require:(id:string)=>{
   if(id in overrides)return overrides[id];
   if(id.startsWith('@/components/ui/'))return primitive;
   const base=id.startsWith('@/')?resolve(root,'artifacts/stablecoin-hub/src',id.slice(2)):id.startsWith('.')?resolve(dirname(file),id):null;
   if(base){const target=[base,base+'.tsx',base+'.ts',base+'.json',resolve(base,'index.ts'),resolve(base,'index.tsx')].find(p=>existsSync(p)&&/\.(?:tsx?|json)$/.test(p));if(!target)throw Error('Unresolved local module '+id+' from '+file);return load(target);}
   return req(id);
  },...globals},{filename:file});
  return exports;
 }
 return load(filename);
}
