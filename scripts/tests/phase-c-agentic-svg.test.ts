import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';
import ts from 'typescript';
const root = resolve(import.meta.dirname, '../..');
const file = 'artifacts/stablecoin-hub/src/components/agentic-payment-ui.tsx';
// 632 replaced PaymentVisual; this test explicitly protects the archived Phase C renderer.
// The actual production D01 is exercised separately below, not substituted by this renderer.
const source = execFileSync('git',['show',`c8a7b6024c0b966781ed3aa4918e22586cacfdd8:${file}`],{cwd:root,encoding:'utf8'});
const baseline = execFileSync('git', ['show', `914e81ddea21ea0cce468750372b95074c589b04:${file}`], { cwd: root, encoding: 'utf8' });
const pack = JSON.parse(readFileSync(resolve(root, 'artifacts/stablecoin-hub/src/data/agentic-payments-v02.generated.json'), 'utf8'));
const req = createRequire(resolve(root, 'artifacts/stablecoin-hub/package.json'));
const React = req('react');
const { renderToStaticMarkup } = req('react-dom/server');
let language = 'en';
const Container = ({ children }: any) => React.createElement('div', null, children);
const overrides: Record<string, any> = {
  react: React,
  'react/jsx-runtime': req('react/jsx-runtime'),
  wouter: { Link: Container, useLocation: () => ['/agentic-payments', () => {}] },
  'lucide-react': { ExternalLink: Container, Info: Container, Maximize2: Container },
  '@/lib/language-context': { useLanguage: () => ({ language, t: (en: string, zh: string) => language === 'en' ? en : zh }) },
  '@/components/section-top-nav': { SectionTopNav: Container },
  '@/data/agentic-payments': { PACKAGE: pack, AGENT_PROTOCOLS: pack.protocols, PAYMENT_SOURCES: pack.sources, REVIEWED_AT: '', getSource: () => null, valueTranslations: {} },
  '@/lib/utils': { cn: (...values: string[]) => values.filter(Boolean).join(' ') },
};
for (const [part, names] of Object.entries({
  tooltip: ['Tooltip', 'TooltipContent', 'TooltipTrigger'],
  popover: ['Popover', 'PopoverContent', 'PopoverTrigger'],
  dialog: ['Dialog', 'DialogContent', 'DialogHeader', 'DialogTitle', 'DialogDescription'],
})) overrides[`@/components/ui/${part}`] = Object.fromEntries(names.map(name => [name, Container]));
function load(text: string) {
  const exports: any = {};
  const code = ts.transpileModule(text.replaceAll('import.meta.env', '({BASE_URL:"/"})'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(code, { exports, require: (id: string) => { assert.ok(id in overrides, `Unexpected import ${id}`); return overrides[id]; } });
  return exports.PaymentVisual;
}
const PaymentVisual = load(source), Before = load(baseline);
const render = (component: any, id: string, theme: string) => renderToStaticMarkup(
  React.createElement('div', { className: theme }, React.createElement(component, { id, label: language === 'en' ? 'Mechanism diagram' : '机制图' })),
);
for (const id of Object.keys(pack.svg)) for (const lang of ['en', 'zh']) {
  test(`archived Phase C ${id} ${lang}: valid inline/modal sizing preserves all other diagram markup`, () => {
    language = lang;
    for (const theme of ['light', 'dark']) {
      const html = render(PaymentVisual, id, theme);
      const roots = html.match(/<svg\b[^>]*>/g) || [];
      assert.equal(roots.length, 2);
      for (const svg of roots) {
        assert.doesNotMatch(svg, /\bheight="auto"/);
        assert.match(svg, /\bheight="900"/);
        assert.match(svg, /\bwidth="100%"/);
        assert.match(svg, /\bstyle="height:auto"/);
        assert.match(svg, /\bviewBox="0 0 1600 900"/);
      }
      // Only root sizing may differ. Paths, text, palette, IDs, references,
      // viewBox, links and bilingual UI remain identical to the accepted baseline.
      assert.equal(html, render(Before, id, theme).replaceAll(
        'width="100%" height="auto" role="img"',
        'width="100%" height="900" style="height:auto" role="img"',
      ));
    }
  });
}
test('archived Phase C missing diagram still renders nothing', () => {
  assert.equal(renderToStaticMarkup(React.createElement(PaymentVisual, { id: 'missing', label: 'Missing' })), '');
});
test('archived Phase C repeated diagrams retain unique inline/modal IDs and resolve marker references', () => {
  const html = renderToStaticMarkup(React.createElement('div', null,
    React.createElement(PaymentVisual, { id: 'AGT-D01', label: 'First' }),
    React.createElement(PaymentVisual, { id: 'AGT-D01', label: 'Second' }),
  ));
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.ok(ids.length >= 4);
  assert.equal(new Set(ids).size, ids.length);
  for (const [, id] of html.matchAll(/url\(#([^\)]+)\)/g)) assert.ok(ids.includes(id), id);
});
