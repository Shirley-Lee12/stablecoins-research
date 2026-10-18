import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";
import ts from "typescript";
import { execFileSync } from "node:child_process";
const root = resolve(import.meta.dirname, "../..");
const hub = "artifacts/stablecoin-hub/src/";
const read = (f: string) => readFileSync(resolve(root, hub + f), "utf8");
const layout = read("components/layout.tsx");
const body = layout.slice(layout.indexOf("const NAV_ITEMS"), layout.indexOf("// ── Breadcrumb"));
const icons = Object.fromEntries(["Home", "LayoutDashboard", "BookOpen", "MapPinned", "Workflow", "Microscope", "Database", "UsersRound", "BarChart", "LineChart"].map(k => [k, k]));
const context: any = {...icons};
vm.runInNewContext(ts.transpileModule(body + "\nglobalThis.items = NAV_ITEMS; globalThis.matches = navChildMatches;", {compilerOptions: {target: ts.ScriptTarget.ES2022}}).outputText, context);
const nav = context.items;
const matches = context.matches;
test("restored About menu has six valid bilingual destinations and exact active matching", () => {
  const about = nav.find((n: any) => n.href === "/about-stablecoins");
  assert.equal(about.children.length, 6);
  for (const child of about.children) {
    assert.ok(child.labelEn && child.labelZh);
    assert.ok(matches(child, child.href));
  }
  assert.equal(about.children.filter((c: any) => matches(c, "/about-stablecoins/history")).length, 1);
  assert.equal(about.children.filter((c: any) => matches(c, "/regulatory")).length, 1);
  assert.ok(matches(about.children[2], "/about-stablecoins/types/fiat-backed"));
  assert.equal(nav.filter((n: any) => n.href === "/regulatory").length, 0);
});
test("Agentic menu retains overview, three sections and all detail-route matching", () => {
  const agentic = nav.find((n: any) => n.href === "/agentic-payments");
  assert.deepEqual(Array.from(agentic.children, (c: any) => c.href), ["/agentic-payments", "/agentic-payments/protocols", "/agentic-payments/scenarios", "/agentic-payments/ecosystem"]);
  for (const id of ["x402", "ap2", "acp", "act", "amp", "apop", "mpp", "ucp"]) {
    const active = agentic.children.filter((c: any) => matches(c, "/agentic-payments/protocols/" + id));
    assert.equal(active.length, 1);
    assert.equal(active[0].href, "/agentic-payments/protocols");
  }
  assert.ok(matches(nav.find((n: any) => n.href === "/regional-developments").children[0], "/hong-kong"));
});
test("restored sidebar trigger is a real button and route effects share exact matching", () => {
  assert.match(layout, /<CollapsibleTrigger asChild>\s*<button\s+type="button"/);
  assert.match(layout, /aria-current=\{childActive \? "page" : undefined\}/);
  assert.equal((layout.match(/navChildMatches\(c, location\)/g) || []).length, 2);
  for (const oldClass of ["w-64", "lg:w-16", "bg-sidebar-accent text-sidebar-accent-foreground", "ml-7 mt-0.5 mb-0.5 flex flex-col gap-0.5"]) assert.ok(layout.includes(oldClass));
});
test("baseline homepage composition and global design tokens survive alongside verified data", () => {
  const home = read("pages/home-overview.tsx");
  for (const id of ["hub-introduction", "hub-mission", "hub-work", "hub-agenda", "hub-team", "hub-modules"]) assert.ok(home.includes(`id="${id}"`));
  assert.match(home, /max-w-5xl mx-auto/);
  assert.match(home, /border-l-4 border-primary py-7 pl-7 md:py-10 md:pl-12/);
  assert.match(home, /<ResearchRecord id=\{id\} editorial/);
  assert.match(home, /<FutureResearch editorial/);
  assert.match(home, /<NavigationFigure/);
  const oldCss = execFileSync("git", ["show", "542f53491e4df05dd153aca2b4ed397a482ecff3:" + hub + "index.css"], {cwd:root});
  assert.deepEqual(readFileSync(resolve(root, hub + "index.css")), oldCss);
});
test("visual restoration does not modify API, database, verified datasets or frozen source inputs", () => {
  const changed = execFileSync("git", ["diff", "c8a7b6024c0b966781ed3aa4918e22586cacfdd8", "--name-only"], {cwd:root, encoding:"utf8"}).trim().split("\n");
  for (const path of changed) assert.doesNotMatch(path, /^(?:artifacts\/api-server\/|lib\/(?:db|api)|docs\/source-packages\/)|\.generated\.json$|\.pdf$|\.zip$/);
});
