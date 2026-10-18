const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const base=process.env.BOOK_TEST_URL||'http://127.0.0.1:8765';
const out=fs.mkdtempSync(require('node:path').join(require('node:os').tmpdir(),'book-browser-'));

(async()=>{
const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
const page=await browser.newPage({viewport:{width:1440,height:1000},ignoreHTTPSErrors:true});page.setDefaultTimeout(15000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(`${base}/book-workbench.html`);await page.waitForSelector('#metric-gov_env');
assert.equal(await page.locator('[data-metric][data-field="baseline"]').count(),35);
assert.match(await page.locator('#scoreSummary').innerText(),/待补 35 项/);
await page.locator('[data-need="gov"][data-field="text"]').evaluate(el=>{el.closest('details').open=true;});
await page.locator('[data-need="gov"][data-field="text"]').fill('政策兑现与公共服务');
assert.match(await page.locator('#scoreSummary').innerText(),/待补 35 项/);
await page.locator('#park').fill('测试园区');
await page.locator('#budget').fill('100');await page.locator('#months').fill('12');await page.locator('#staff').fill('24');
// Fill through real input events, including zero, to test saving and the numerical contract.
for(const el of await page.locator('[data-metric][data-field="baseline"]').all()){
 await el.evaluate(e=>{e.closest('details').open=true;});await el.fill('50');}
assert.match(await page.locator('#scoreSummary').innerText(),/基准加权核算：50.00%/);
await page.locator('[data-metric="gov_env"][data-field="baseline"]').fill('0');
assert.match(await page.locator('#scoreSummary').innerText(),/44.29%/);
await page.reload();assert.equal(await page.locator('#park').inputValue(),'测试园区');assert.match(await page.locator('#scoreSummary').innerText(),/44.29%/);
await page.locator('#addAction').click();const cost=page.locator('[data-action][data-field="cost"]');await cost.fill('101');await page.locator('[data-action][data-field="months"]').fill('6');await page.locator('[data-action][data-field="staff"]').fill('12');
await page.locator('[data-action][data-field="name"]').fill('基础设施与普惠服务');
assert.match(await page.locator('#actionResults').innerText(),/超出已填资源上限/);
await cost.fill('60');assert.match(await page.locator('#actionResults').innerText(),/在已填资源上限内/);
const target=page.locator('[data-action-target][data-metric-id="c_acc"]');await target.evaluate(e=>{e.closest('details').open=true;});await target.fill('40');assert.match(await page.locator('#actionResults').innerText(),/受损/);
await page.locator('#recordDecision').click();assert.match(await page.locator('#saveStatus').innerText(),/请填写确认人/);
await page.locator('[data-meta="reviewer"]').fill('测试确认人');await page.locator('[data-meta="decisionDate"]').fill('2026-10-18');await page.locator('[data-meta="decisionReason"]').fill('等待补充七方证据，暂不执行');await page.locator('#recordDecision').click();assert.match(await page.locator('#decisionHistory').innerText(),/测试确认人/);
let download=page.waitForEvent('download');await page.locator('#exportJson').click();const jsonDownload=await download;await jsonDownload.saveAs(out+'/book-workbench-ui-export.json');const saved=JSON.parse(fs.readFileSync(out+'/book-workbench-ui-export.json'));assert.equal(saved.meta.park,'测试园区');assert.equal(saved.decisions.length,1);assert.equal(saved.actions[0].cost,60);
download=page.waitForEvent('download');await page.locator('#exportReport').click();const report=await download;await report.saveAs(out+'/book-workbench-ui-report.txt');assert.ok(fs.readFileSync(out+'/book-workbench-ui-report.txt','utf8').includes('公共安全度指数'));
// malformed imports must preserve the current data.
await page.locator('#importFile').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{"schema":9}')});await page.waitForFunction(()=>document.getElementById('saveStatus').textContent.includes('原档案保留'));assert.match(await page.locator('#saveStatus').innerText(),/原档案保留/);assert.equal(await page.locator('#park').inputValue(),'测试园区');
await page.screenshot({path:out+'/book-workbench-desktop.png'});
await page.setViewportSize({width:390,height:844});await page.goto(`${base}/book-workbench.html`);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));await page.screenshot({path:out+'/book-workbench-mobile.png'});
await page.setViewportSize({width:1440,height:1000});
await page.goto(`${base}/index.html`);await page.waitForSelector('#hud_badge_num:not(:empty)',{state:'attached'});
await page.waitForFunction(()=>document.getElementById('hud_badge_num').textContent!=='--');assert.equal(await page.locator('#hud_badge_num').innerText(),'50.0');
await page.evaluate(()=>{go('survey');openSurvey('ahp');});await page.locator('#ahp_submit').click();assert.match(await page.locator('#toast').innerText(),/请完成全部/);assert.equal(await page.locator('#survey_result').isVisible(),false);
const w=[4,4,2,2,1,1,1];let k=0;for(let i=0;i<7;i++)for(let j=i+1;j<7;j++){const ratio=w[i]/w[j],v=ratio===1?1:ratio>1?-ratio:1/ratio;await page.locator(`[data-pair="${k++}"][data-score="${v}"]`).click();}
await page.locator('#ahp_submit').click();assert.match(await page.locator('#resultBody').innerText(),/7.000/);assert.match(await page.locator('#resultBody').innerText(),/0.0000/);assert.equal(await page.locator('#applyToSandbox').isVisible(),false);
await page.evaluate(()=>openSurvey('com'));await page.locator('#needs_submit').click();assert.match(await page.locator('#resultBody').innerText(),/不是绩效/);assert.equal(await page.locator('#applyToSandbox').isVisible(),false);
await page.evaluate(()=>openSurvey('scoring'));await page.locator('#scoring_submit').click();assert.match(await page.locator('#toast').innerText(),/全部35/);assert.match(await page.locator('#liveDTSI').innerText(),/待补 35/);
await page.goto(`${base}/book-design.html`);assert.equal(await page.getByRole('heading',{name:'三项设计尚待作者确认',exact:true}).count(),1);assert.ok((await page.locator('main').innerText()).includes('未启用'));
assert.deepEqual(errors,[]);fs.writeFileSync(out+'/book-browser-check-results.json',JSON.stringify({passed:true,errors,cases:['35 missing no imputation','needs separated','zero preserved','reload persisted','resource bounds','negative community effect','decision snapshot','JSON and full report export','malformed import preservation','mobile layout','root boot','empty AHP rejected','unequal consistent AHP correct','personal weights separate','needs no copying','incomplete scoring rejected','pending-design public boundary']},null,2));
console.log('Browser flows PASS, no uncaught page errors; 17 scenarios; evidence: '+out);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
