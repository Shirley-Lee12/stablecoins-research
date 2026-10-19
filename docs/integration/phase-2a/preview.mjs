import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { existsSync, readFileSync } from "node:fs";
const root = fileURLToPath(new URL("../../../", import.meta.url));
const app=resolve(root,"artifacts/stablecoin-hub");
const req=createRequire(resolve(app,"package.json"));
const {createServer}=await import(req.resolve("vite"));
const react=(await import(req.resolve("@vitejs/plugin-react"))).default;
const tailwind=(await import(req.resolve("@tailwindcss/vite"))).default;
const old=resolve(root,"outputs/friday-ui-release-2026-10-19"),evidence=resolve(old,"PRODUCTION_API_COMPATIBILITY.json");
const fixtures=new Map();
if(existsSync(evidence)) for(const row of JSON.parse(readFileSync(evidence,"utf8")).requests){if(row.status&&row.fixture){const file=resolve(old,"public-api",row.fixture);if(existsSync(file)) fixtures.set(row.path,{status:row.status,body:readFileSync(file,"utf8")});}}
const server=await createServer({configFile:false,envFile:false,root:app,cacheDir:resolve(root,"node_modules/.vite-phase2a-preview"),plugins:[{name:"phase2a-read-only-local-api",configureServer(s){s.middlewares.use("/api",(request,response)=>{response.setHeader("Content-Type","application/json");if(!["GET","HEAD"].includes(request.method)){response.statusCode=405;response.end('{"error":"LOCAL_PREVIEW_READ_ONLY"}');return;}const fixture=fixtures.get("/api"+request.url);response.statusCode=fixture?.status??404;response.end(fixture?.body??'{"error":"No cached unauthenticated GET fixture"}');});}},react(),tailwind()],resolve:{alias:{"@":resolve(app,"src"),"@assets":resolve(root,"attached_assets")},dedupe:["react","react-dom"]},define:{"import.meta.env.VITE_API_BASE_URL":JSON.stringify("")},server:{host:"127.0.0.1",port:5304,strictPort:true,fs:{allow:[root]}}});
await server.listen();console.log("Phase 2A React preview: http://127.0.0.1:5304/agentic-payments (local GET fixtures, no production writes)");
process.on("SIGINT",async()=>{await server.close();process.exit(0);});
