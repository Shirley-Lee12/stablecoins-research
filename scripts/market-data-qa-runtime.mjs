import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
const root = resolve(import.meta.dirname, "..");
const apiRequire = createRequire(
  resolve(root, "artifacts/api-server/package.json"),
);
const express = apiRequire("express");
const saved = new Map(),
  cache = new Map();
const output = resolve(root, "outputs/market-data-dashboard-v02-qa-2026-10-16");
const logger = { warn: () => {}, error: () => {}, info: () => {} };
let failed = false;
const realFetch = globalThis.fetch;
function load(file) {
  file = resolve(file);
  if (cache.has(file)) return cache.get(file);
  const exports = {};
  cache.set(file, exports);
  const raw = readFileSync(file, "utf8");
  const code = ts.transpileModule(raw, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const req = (id) => {
    if (id === "./logger") return { logger };
    if (id === "./persistentSnapshot")
      return {
        readPersistentSnapshot: async (key, ttl) => {
          const row = saved.get(key);
          return row
            ? {
                ...row.payload,
                dataStatus: {
                  state:
                    Date.now() - Date.parse(row.observedAt) <= ttl
                      ? "current"
                      : "delayed",
                  observedAt: row.observedAt,
                },
              }
            : null;
        },
        writePersistentSnapshot: async (key, source, payload, observedAt) => {
          saved.set(key, { payload, observedAt, source });
        },
      };
    if (id === "./auth")
      return {
        requireAuth: (_req, res) => res.sendStatus(403),
        requireAdmin: (_req, res) => res.sendStatus(403),
      };
    if (id.startsWith(".")) return load(resolve(dirname(file), id + ".ts"));
    return apiRequire(id);
  };
  vm.runInNewContext(
    code,
    {
      exports,
      require: req,
      process,
      Date,
      Map,
      Set,
      URL,
      URLSearchParams,
      AbortSignal,
      fetch: (...args) =>
        failed
          ? Promise.reject(new Error("QA forced current-refresh failure"))
          : realFetch(...args),
      setInterval,
      setTimeout,
      clearTimeout,
    },
    { filename: file },
  );
  return exports;
}
const market = load(
  resolve(root, "artifacts/api-server/src/lib/stablecoinMarket.ts"),
);
const macro = load(
  resolve(root, "artifacts/api-server/src/lib/macroContext.ts"),
);
const liq = load(
  resolve(root, "artifacts/api-server/src/lib/stablecoinLiquidity.ts"),
);
const app = express();
app.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5183");
  next();
});
// QA controls are bound to loopback only; they never enter the production router.
app.post("/__qa/fail", (_req, res) => {
  failed = true;
  res.json({ failed });
});
app.post("/__qa/recover", (_req, res) => {
  failed = false;
  res.json({ failed });
});
app.post("/__qa/refresh", async (_req, res) => {
  const results = await Promise.allSettled([
    market.getStablecoinMarketSnapshot(true),
    macro.getMacroContext(true),
    liq.refreshStablecoinLiquidity(),
  ]);
  res.json(results.map((r) => ({ status: r.status })));
});
app.use((req, _res, next) => {
  req.log = logger;
  next();
});
app.use(
  "/api",
  load(resolve(root, "artifacts/api-server/src/routes/stablecoinMarket.ts"))
    .default,
);
const server = app.listen(3001, "127.0.0.1", () =>
  process.stdout.write(
    "QA public API listening on loopback :3001 (memory persistence; no database writes)\n",
  ),
);
await Promise.allSettled([
  market.getStablecoinMarketSnapshot(),
  macro.getMacroContext(),
  liq.refreshStablecoinLiquidity(),
]);
for (const [name, get] of [
  ["market", market.getStablecoinMarketSnapshot],
  ["macro", macro.getMacroContext],
  ["liquidity", liq.getStablecoinLiquidity],
])
  try {
    writeFileSync(
      resolve(output, `live-${name}.json`),
      JSON.stringify(await get(), null, 2),
    );
    process.stdout.write(`${name} real-source payload saved\n`);
  } catch (error) {
    process.stdout.write(`${name} unavailable: ${error.message}\n`);
  }
