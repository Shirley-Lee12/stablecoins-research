import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
const root='/Users/shirleylee/Downloads/Stablecoin-Lifecycle-history-rewrite-2026-10-17';
const out=root+'/outputs/visual-restoration-2026-10-18';
mkdirSync(out+'/screenshots',{recursive:true});
const req=createRequire('/Users/shirleylee/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=req('playwright');
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const pages=[['home','/'],['about','/about-stablecoins'],['agentic','/agentic-payments'],['research','/research'],['risk','/quantitative'],['market','/market-data'],['resources','/academic-resources'],['researchers','/experts']];
const results=process.env.RESTORED_ONLY?JSON.parse(readFileSync(out+'/VISUAL_BROWSER_MATRIX.json')).filter(r=>r.variant==='baseline'):[];const functional=[];
const save=()=>{writeFileSync(out+'/VISUAL_BROWSER_MATRIX.json',JSON.stringify(results,null,2));writeFileSync(out+'/NAVIGATION_FUNCTIONAL_QA.json',JSON.stringify(functional,null,2));};
async function context(width,language,theme){const c=await browser.newContext({viewport:{width,height:width===390?844:1000},deviceScaleFactor:1,colorScheme:theme});await c.addInitScript(({language,theme})=>{localStorage.setItem('app-lang',language);localStorage.setItem('app-theme',theme);},{language,theme});return c;}
async function measure(page){return page.evaluate(()=>{const m=document.querySelector('main'),h=document.querySelector('h1');return {innerWidth,clientWidth:document.documentElement.clientWidth,dpr:devicePixelRatio,documentWidth:document.documentElement.scrollWidth,mainWidth:m?.clientWidth,mainScroll:m?.scrollWidth,h1:h?.innerText,h1Font:h?getComputedStyle(h).fontFamily:null,h1Size:h?getComputedStyle(h).fontSize:null,theme:document.documentElement.className,language:document.documentElement.lang};});}
try {
for(const variant of (process.env.RESTORED_ONLY?['restored']:['baseline','restored']))for(const width of [1440,390])for(const [language,theme] of [['zh','light'],['en','dark']]) {
 const ctx=await context(width,language,theme);const page=await ctx.newPage();
 let errors=[],uncaught=[],http=[];page.on('console',e=>{if(e.type()==='error')errors.push(e.text());});page.on('pageerror',e=>uncaught.push(e.message));page.on('response',r=>{if(r.status()>=400)http.push({url:r.url(),status:r.status()});});
 for(const [name,route] of pages){
  errors=[];uncaught=[];http=[];
  await page.goto('http://127.0.0.1:'+(variant==='baseline'?5292:5293)+route,{waitUntil:'networkidle',timeout:90000});
  await page.locator('h1, h2').first().waitFor({timeout:30000});await page.evaluate(()=>document.fonts.ready);
  if(variant==='restored'&&name==='resources')await page.locator('[data-resource]').first().waitFor();
  if(variant==='restored'&&name==='researchers')await page.locator('[data-researcher]').first().waitFor();
  const dimensions=await measure(page);const screenshot=`screenshots/${variant}-${name}-${width}-${language}-${theme}.png`;await page.screenshot({path:out+'/'+screenshot});
  const geometry=dimensions.innerWidth===width&&dimensions.clientWidth===width&&dimensions.dpr===1&&dimensions.documentWidth<=width&&dimensions.mainScroll<=dimensions.mainWidth+1;
  const record={variant,name,route,width,language,theme,...dimensions,screenshot,consoleErrors:[...errors],pageErrors:[...uncaught],httpErrors:[...http],geometryPass:geometry,pass:geometry&&uncaught.length===0&&errors.length===0&&http.length===0};
  results.push(record);save();console.log(JSON.stringify({variant,name,width,language,pass:record.pass,errors,http}));
 }
 await ctx.close();
}
// Required old-baseline difference: the Agentic route did not exist at 542f534; retain screenshot as unavailable, not as a claimed old design.
for(const width of [1440,390])for(const language of ['zh','en'])for(const theme of ['light','dark']) {
 const ctx=await context(width,language,theme),page=await ctx.newPage();const errors=[],uncaught=[];page.on('console',e=>{if(e.type()==='error')errors.push(e.text());});page.on('pageerror',e=>uncaught.push(e.message));
 await page.goto('http://127.0.0.1:5293/',{waitUntil:'networkidle'});
 if(width===390)await page.getByRole('button',{name:language==='zh'?'打开导航':'Open navigation',exact:true}).click();
 const about=page.locator('[data-nav-group="/about-stablecoins"]');const trigger=about.locator('button').first();await trigger.click();if(await trigger.getAttribute('aria-expanded')!=='true')throw Error('About did not expand');
 await trigger.press('Enter');if(await trigger.getAttribute('aria-expanded')!=='false')throw Error('About keyboard collapse failed');await trigger.press('Space');
 await page.screenshot({path:out+`/screenshots/sidebar-${width}-${language}-${theme}.png`});
 const destinations=['/about-stablecoins','/about-stablecoins/history','/about-stablecoins/types','/about-stablecoins/applications','/about-stablecoins/regulatory-evolution','/regulatory'];
 for(const route of destinations){
  if(width===390&&!(await trigger.isVisible()))await page.getByRole('button',{name:language==='zh'?'打开导航':'Open navigation',exact:true}).click();
  if(await trigger.getAttribute('aria-expanded')!=='true')await trigger.click();
  await about.locator(`[data-nav-child="${route}"]`).click();await page.waitForURL('**'+route);await page.locator('h1, h2').first().waitFor();
  if(width===390)await page.getByRole('button',{name:language==='zh'?'打开导航':'Open navigation',exact:true}).click();
  if(await about.locator(`[data-nav-child="${route}"]`).getAttribute('aria-current')!=='page')throw Error('About active mismatch '+route);
 }
 const agent=page.locator('[data-nav-group="/agentic-payments"]'),agentTrigger=agent.locator('button').first();await agentTrigger.click();
 for(const route of ['/agentic-payments','/agentic-payments/protocols','/agentic-payments/scenarios','/agentic-payments/ecosystem']) {
  await agent.locator(`[data-nav-child="${route}"]`).click();await page.waitForURL('**'+route);await page.locator('h1, h2').first().waitFor();
  if(width===390)await page.getByRole('button',{name:language==='zh'?'打开导航':'Open navigation',exact:true}).click();
  if(await agent.locator(`[data-nav-child="${route}"]`).getAttribute('aria-current')!=='page')throw Error('Agent active mismatch '+route);
 }
 if(width===1440){await page.getByRole('button',{name:language==='zh'?'收起导航':'Collapse navigation',exact:true}).click();await page.getByRole('button',{name:language==='zh'?'展开导航':'Expand navigation',exact:true}).waitFor();await agentTrigger.click();await page.getByRole('button',{name:language==='zh'?'收起导航':'Collapse navigation',exact:true}).waitFor();if(await agentTrigger.getAttribute('aria-expanded')!=='true')throw Error('Collapsed group did not expand');}
 await page.goto('http://127.0.0.1:5293/agentic-payments/protocols/x402',{waitUntil:'networkidle'});
 if(width===390)await page.getByRole('button',{name:language==='zh'?'打开导航':'Open navigation',exact:true}).click();
 if(await page.locator('[data-nav-child="/agentic-payments/protocols"]').getAttribute('aria-current')!=='page')throw Error('Protocol detail highlight');
 if(width===390)await page.getByRole('button',{name:language==='zh'?'关闭导航':'Close navigation',exact:true}).click();
 const before=await measure(page);await page.getByRole('button',{name:theme==='light'?(language==='zh'?'深色模式':'Dark mode'):(language==='zh'?'浅色模式':'Light mode'),exact:true}).click();
 await page.getByRole('button',{name:language==='zh'?'EN':'中文',exact:true}).click();
 const after=await measure(page);
 if(after.language===before.language||after.theme===before.theme)throw Error('Language/theme not switched');
 functional.push({width,language,theme,aboutDestinations:6,agenticDestinations:4,keyboardToggle:true,detailHighlight:true,switches:true,errors,uncaught,pass:errors.length===0&&uncaught.length===0});save();await ctx.close();
}
// Global search is baseline-visible at 2xl; test actual encoded navigation and filtering.
const ctx=await context(1600,'en','light'),page=await ctx.newPage();await page.goto('http://127.0.0.1:5293/',{waitUntil:'networkidle'});await page.keyboard.press('Control+k');await page.getByRole('searchbox',{name:'Search the research library'}).fill('Stablecoin Runs');await page.keyboard.press('Enter');await page.waitForURL('**/academic-resources?q=Stablecoin%20Runs');await page.locator('[data-resource="114"]').waitFor();functional.push({feature:'globalSearch',pass:true});save();await ctx.close();
}finally{save();await browser.close();}
console.log(JSON.stringify({cells:results.length,restoredPass:results.filter(r=>r.variant==='restored'&&r.pass).length,restoredTotal:results.filter(r=>r.variant==='restored').length,functional: functional.length,functionalPass:functional.filter(r=>r.pass).length}));
