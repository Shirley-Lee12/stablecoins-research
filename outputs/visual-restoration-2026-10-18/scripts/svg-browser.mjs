import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const root='/Users/shirleylee/Downloads/Stablecoin-Lifecycle-history-rewrite-2026-10-17';
const out=root+'/outputs/visual-restoration-2026-10-18';
const stage=process.argv[2];
if(!['before','after','matrix'].includes(stage))throw Error('Expected before, after or matrix');
const req=createRequire('/Users/shirleylee/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=req('playwright');
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const base='http://127.0.0.1:5293';
const prior=JSON.parse(readFileSync(root+'/outputs/phase-b-corrections-2026-10-18/exact-390-matrix.json'));
const routes=[...new Set(prior.map(x=>x.route))];
const affected=[...new Set(prior.filter(x=>!x.pass).map(x=>x.route))];
const results=process.env.DESKTOP_ONLY?JSON.parse(readFileSync(out+'/'+stage+'-12-cells.json')):[],desktop=[];
const save=()=>{writeFileSync(out+`/${stage==='matrix'?'exact-390-matrix':stage+'-12-cells'}.json`,JSON.stringify(results,null,2));if(stage!=='matrix')writeFileSync(out+`/${stage}-desktop-svg.json`,JSON.stringify(desktop,null,2));};
async function settings(language,theme,width=390,height=844){
 const ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,colorScheme:theme});
 await ctx.addInitScript(({language,theme})=>{localStorage.setItem('app-lang',language);localStorage.setItem('app-theme',theme);},{language,theme});return ctx;
}
async function measure(page){return page.evaluate(()=>{
 const main=document.querySelector('main');
 const buttons=[...document.querySelectorAll('button')].filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden');
 return {innerWidth,clientWidth:document.documentElement.clientWidth,innerHeight,devicePixelRatio,bodyScrollWidth:document.body.scrollWidth,documentScrollWidth:document.documentElement.scrollWidth,mainClientWidth:main?.clientWidth,mainScrollWidth:main?.scrollWidth,language:document.documentElement.lang,theme:document.documentElement.classList.contains('dark')?'dark':'light',title:document.title,description:document.querySelector('meta[name="description"]')?.content,unnamedButtons:buttons.filter(e=>!(e.getAttribute('aria-label')||e.getAttribute('title')||e.innerText).trim()).length};
});}
async function svgMeasure(locator){return locator.evaluate(e=>{
 const r=e.getBoundingClientRect(),b=e.getBBox(),v=e.viewBox.baseVal;
 return {widthAttribute:e.getAttribute('width'),heightAttribute:e.getAttribute('height'),inlineStyle:e.getAttribute('style'),viewBox:e.getAttribute('viewBox'),viewBoxRatio:v.width/v.height,width:r.width,height:r.height,ratio:r.width/r.height,left:r.left,right:r.right,bbox:{x:b.x,y:b.y,width:b.width,height:b.height},text:e.textContent.replace(/\s+/g,' ').trim(),children:e.querySelectorAll('*').length,computedWidth:getComputedStyle(e).width,computedHeight:getComputedStyle(e).height,fill:e.querySelector('rect')?getComputedStyle(e.querySelector('rect')).fill:null};
});}
try{
 for(const language of (process.env.DESKTOP_ONLY?[]:['en','zh']))for(const theme of ['light','dark']){
  const ctx=await settings(language,theme);const page=await ctx.newPage();let errors=[],pageErrors=[],httpErrors=[];
  page.on('console',m=>{if(m.type()==='error')errors.push({text:m.text(),location:m.location()});});
  page.on('pageerror',e=>pageErrors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)httpErrors.push({url:r.url(),status:r.status()});});
  for(const [index,route] of (stage==='matrix'?routes:affected).entries()){
   errors=[];pageErrors=[];httpErrors=[];
   await page.goto(base+route,{waitUntil:'networkidle',timeout:90000});
   if(route.startsWith('/authors/'))await page.locator('[data-testid="text-author-name"]').waitFor();
   if(route.startsWith('/academic-resources'))await page.locator('[data-resource]').first().waitFor();
   if(route==='/experts')await page.locator('[data-researcher]').first().waitFor();
   const dimensions=await measure(page);const initialErrors=[...errors];const text=await page.locator('main').innerText();
   let content=true;
   if(['/research','/quantitative','/quantitative/dimension-a','/quantitative/dimension-b'].includes(route))content=text.includes(language==='en'?'Listed in the preliminary programme:':'初步节目表所列场次：')&&text.includes(language==='en'?'30 September 2026 · Online Session 1':'2026年9月30日 · 线上第1场');
   if(route==='/research')content=content&&text.includes(language==='en'?'Submitted anonymised manuscript':'匿名送审稿')&&!/Conference presentation, October 2026|会议报告，2026年10月/.test(text);
   if(route==='/market-data/on-chain')content=text.includes(language==='en'?'endpoint is retired':'接口已退役');
   if(route==='/authors/Anthony%20Lee%20Zhang')content=!!await page.locator('[data-researcher="202"]').count()&&text.includes(language==='en'?'Verified researcher profile':'已核验研究者档案');
   if(route==='/authors/Nan%20Du')content=text.includes(language==='en'?'Bibliographic author record':'书目作者条目')&&await page.locator('[data-researcher]').count()===0;
   if(route==='/academic-resources?id=114')content=await page.locator('[data-resource="114"]').count()===1&&await page.locator('[data-resource]').count()===1;
   if(route==='/missing-phase-b-qa')content=text.includes(language==='en'?'Page not found':'页面未找到');
   const screenshot=`screenshots/${stage}-${language}-${theme}-${index}.png`;await page.screenshot({path:out+'/'+screenshot});
   const modals=[];let switches=true;
   if(stage!=='matrix'){
    const figures=page.locator('figure').filter({has:page.locator('svg[viewBox="0 0 1600 900"]')});
    for(let i=0;i<await figures.count();i++){
      const figure=figures.nth(i);const parent=figure.locator('..');if(await parent.evaluate(e=>e.tagName==='DETAILS'&&!e.open))await parent.locator(':scope > summary').click();const button=figure.getByRole('button',{name:language==='en'?/^Open diagram /:/^打开机制图 /});
      await button.click();const dialog=page.getByRole('dialog');await dialog.waitFor();
      await page.waitForFunction(()=>[...document.querySelectorAll('[role="dialog"]')].every(e=>e.getAnimations({subtree:true}).every(a=>a.playState==='finished')));
      const svg=await svgMeasure(dialog.locator('svg[viewBox="0 0 1600 900"]'));
      const box=await dialog.evaluate(e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,clientWidth:e.clientWidth,scrollWidth:e.scrollWidth};});
      const image=`screenshots/${stage}-modal-${language}-${theme}-${index}-${i}.png`;await page.screenshot({path:out+'/'+image});
      const layout=svg.width>0&&svg.height>0&&Math.abs(svg.ratio-svg.viewBoxRatio)<0.01&&svg.left>=0&&svg.right<=390&&box.left>=0&&box.right<=390&&box.scrollWidth<=box.clientWidth+1;
      modals.push({index:i,svg,dialog:box,screenshot:image,layoutPass:layout});
      await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});
    }
    // Exercise actual controls, then return to the requested combination.
    for(let j=0;j<2;j++){
      const current=j===0?theme:(theme==='light'?'dark':'light');const label=current==='light'?(language==='en'?'Dark mode':'深色模式'):(language==='en'?'Light mode':'浅色模式');
      await page.getByRole('button',{name:label,exact:true}).click();const expected=current==='light';await page.waitForFunction(dark=>document.documentElement.classList.contains('dark')===dark,expected);
    }
    await page.getByRole('button',{name:language==='en'?'中文':'EN',exact:true}).click();await page.waitForFunction(lang=>document.documentElement.lang===lang,language==='en'?'zh-CN':'en');
    await page.getByRole('button',{name:language==='en'?'EN':'中文',exact:true}).click();await page.waitForFunction(lang=>document.documentElement.lang===lang,language==='en'?'en':'zh-CN');
    const restored=await measure(page);switches=restored.language===dimensions.language&&restored.theme===dimensions.theme;
   }
   const geometry=dimensions.innerWidth===390&&dimensions.clientWidth===390&&dimensions.innerHeight===844&&dimensions.devicePixelRatio===1&&dimensions.documentScrollWidth<=390&&dimensions.bodyScrollWidth<=390&&dimensions.mainScrollWidth<=dimensions.mainClientWidth+1;
   const pass=geometry&&dimensions.language===(language==='en'?'en':'zh-CN')&&dimensions.theme===theme&&dimensions.unnamedButtons===0&&content&&switches&&modals.every(m=>m.layoutPass)&&errors.length===0&&pageErrors.length===0&&httpErrors.length===0;
   results.push({route,core:prior.find(x=>x.route===route)?.core,requestedLanguage:language,requestedTheme:theme,viewportConfiguration:{width:390,height:844,deviceScaleFactor:1},...dimensions,content,geometryPass:geometry,initialConsoleErrors:initialErrors,consoleErrors:[...errors],pageErrors:[...pageErrors],httpErrors:[...httpErrors],modals,switchesPass:switches,screenshot,pass});save();
   console.log(JSON.stringify({stage,route,language,theme,pass,errors:errors.length,pageErrors:pageErrors.length,modals:modals.length}));
  }
  await ctx.close();
 }
 if(stage!=='matrix')for(const width of [768,1440])for(const language of ['en','zh'])for(const theme of ['light','dark']){
   const ctx=await settings(language,theme,width,1000);const page=await ctx.newPage();
   for(const [index,route]of affected.entries()){
     await page.goto(base+route,{waitUntil:'networkidle'});const svgs=page.locator('figure > div > svg[viewBox="0 0 1600 900"]');const measurements=[];
     for(let i=0;i<await svgs.count();i++){const parent=svgs.nth(i).locator('..').locator('..').locator('..');if(await parent.evaluate(e=>e.tagName==='DETAILS'&&!e.open))await parent.locator(':scope > summary').click();await svgs.nth(i).waitFor({state:'visible'});measurements.push(await svgMeasure(svgs.nth(i)));}
     const dimensions=await measure(page);const image=`screenshots/${stage}-desktop-${width}-${language}-${theme}-${index}.png`;await svgs.first().locator('..').screenshot({path:out+'/'+image});
     desktop.push({route,language,theme,width,dimensions,svgs:measurements,screenshot:image,layoutPass:measurements.length>0&&measurements.every(s=>s.width>0&&s.height>0&&Math.abs(s.ratio-s.viewBoxRatio)<0.01&&s.left>=0&&s.right<=width)&&dimensions.mainScrollWidth<=dimensions.mainClientWidth+1});save();
   }await ctx.close();
 }
}finally{save();await browser.close();}
console.log(JSON.stringify({stage,cells:results.length,passed:results.filter(x=>x.pass).length,desktop:desktop.length,desktopLayoutPassed:desktop.filter(x=>x.layoutPass).length}));
