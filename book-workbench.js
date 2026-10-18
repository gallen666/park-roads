'use strict';
const S=window.BOOK_STAKES,C=window.BookCore,KEY='openflowone_book_20261018';
const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const emptyMetric=()=>({baseline:null,target:null,actual:null,raw:'',source:'',observedAt:'',owner:'',method:'',quality:'待核验',due:'',targetReason:'',actualSource:'',actualDate:'',actualQuality:'待核验'});
function blank(){return {schema:1,weightVersion:C.VERSION,meta:{park:'',lead:'',baselineDate:'',reviewDate:'',goalAgreement:'',constraints:'',selectedAction:'',reviewer:'',decisionDate:'',decisionStatus:'待确认',decisionReason:'',nextReview:''},limits:{budget:null,months:null,staff:null},needs:Object.fromEntries(S.map(st=>[st.id,{text:'',source:'',participants:'',date:'',conflicts:''}])),metrics:Object.fromEntries(C.metricIds.map(id=>[id,emptyMetric()])),actions:[],decisions:[]};}
let project=blank();
function valid(input){
 if(!input||input.schema!==1||input.weightVersion!==C.VERSION)throw Error('档案版本不匹配，请保留原档案核对');
 const result=blank();
 const copyStrings=(to,from)=>{for(const key of Object.keys(to))if(typeof to[key]==='string'){if(typeof from?.[key]!=='string'||from[key].length>20000)throw Error('文本字段缺失或过长');to[key]=from[key];}};
 copyStrings(result.meta,input.meta);
 for(const k of Object.keys(result.limits)){const v=input.limits?.[k];if(v!==null&&!(typeof v==='number'&&Number.isFinite(v)&&v>=0))throw Error('资源约束必须为空或非负数字');result.limits[k]=v;}
 for(const st of S)copyStrings(result.needs[st.id],input.needs?.[st.id]);
 for(const id of C.metricIds){const r=input.metrics?.[id];copyStrings(result.metrics[id],r);for(const k of ['baseline','target','actual']){if(r?.[k]!==null&&!C.pct(r?.[k]))throw Error('指标百分比必须为空或0—100');result.metrics[id][k]=r[k];}}
 if(!Array.isArray(input.actions)||input.actions.length>100||!Array.isArray(input.decisions)||input.decisions.length>500)throw Error('方案或决定记录数量无效');
 const ids=new Set();
 result.actions=input.actions.map(a=>{if(typeof a.id!=='string'||!/^[\w-]{1,80}$/.test(a.id)||ids.has(a.id))throw Error('方案编号无效或重复');ids.add(a.id);const r={id:a.id,name:'',owner:'',source:'',assumptions:'',risk:'',start:'',end:'',cost:null,months:null,staff:null,targets:{}};copyStrings(r,a);for(const k of ['cost','months','staff']){if(a[k]!==null&&!(typeof a[k]==='number'&&Number.isFinite(a[k])&&a[k]>=0))throw Error('方案资源数值无效');r[k]=a[k];}for(const id of C.metricIds)if(a.targets?.[id]!==undefined){if(!C.pct(a.targets[id]))throw Error('方案目标值无效');r.targets[id]=a.targets[id];}return r;});
 // Stored snapshots are data only: render as text; no HTML or executable content.
 result.decisions=input.decisions.map(d=>{if(typeof d.at!=='string'||!d.snapshot||typeof d.snapshot!=='object'||typeof d.reason!=='string'||typeof d.reviewer!=='string')throw Error('决定记录格式无效');return {at:d.at,reviewer:d.reviewer,reason:d.reason,snapshot:d.snapshot};});
 return result;
}
try{const raw=localStorage.getItem(KEY);if(raw)project=valid(JSON.parse(raw));}catch(e){$('saveStatus').textContent='未覆盖原档案：'+e.message;}
const numeric=(value)=>value.trim()===''?null:Number(value);
function save(){try{localStorage.setItem(KEY,JSON.stringify(project));$('saveStatus').textContent='已保存在当前浏览器 · '+new Date().toLocaleTimeString('zh-CN');}catch(e){$('saveStatus').textContent='本机保存失败，请导出档案保存：'+e.message;}}
function input(label,attrs,value,type='text'){return `<label>${label}<input type="${type}" ${attrs} value="${esc(value)}"></label>`;}
function text(label,attrs,value){return `<label>${label}<textarea ${attrs}>${esc(value)}</textarea></label>`;}
function quality(attrs,value){return `<label>证据状态<select ${attrs}>${['待核验','已核验','估计','演示'].map(v=>`<option${v===value?' selected':''}>${v}</option>`).join('')}</select></label>`;}
function render(){
 document.querySelectorAll('[data-meta]').forEach(el=>{if(el.id!=='selectedAction')el.value=project.meta[el.dataset.meta]??'';});
 document.querySelectorAll('[data-limit]').forEach(el=>el.value=project.limits[el.dataset.limit]??'');
 $('needsRows').innerHTML=S.map(st=>{const r=project.needs[st.id],at=k=>`data-need="${st.id}" data-field="${k}"`;return `<details><summary>${esc(st.name)} · 独立一级权重 ${st.stakeWeight}</summary><div class="grid">${text('主要诉求',at('text'),r.text)}${text('来源与记录依据',at('source'),r.source)}${input('参与者/抽样范围（避免填写敏感个人信息）',at('participants'),r.participants)}${input('识别日期',at('date'),r.date,'date')}${text('冲突、弱势人群与保留意见',at('conflicts'),r.conflicts)}</div></details>`;}).join('');
 $('metricRows').innerHTML=S.map(st=>`<h3>${esc(st.name)}（一级权重 ${st.stakeWeight}）</h3>`+st.indicators.map(i=>{const r=project.metrics[i.id],at=k=>`data-metric="${i.id}" data-field="${k}"`;return `<details id="metric-${i.id}"><summary>${esc(i.name)} · 三级权重 ${i.w} · <span data-metric-summary="${i.id}">${fmt(r.baseline)}</span></summary><p class="muted">${esc(i.desc)} 换算口径另案待确认。</p><div class="grid">${input('基准百分比（人工输入）',at('baseline')+' min="0" max="100" step="any"',r.baseline,'number')}${input('目标百分比',at('target')+' min="0" max="100" step="any"',r.target,'number')}${input('实测原始值与单位',at('raw'),r.raw)}${input('基准数据来源/证据位置',at('source'),r.source)}${input('观测日期',at('observedAt'),r.observedAt,'date')}${input('指标责任人',at('owner'),r.owner)}${text('换算方法及版本说明（尚待确认）',at('method'),r.method)}${quality(at('quality'),r.quality)}${input('目标截止日期',at('due'),r.due,'date')}${text('目标依据、资源安排与协商记录',at('targetReason'),r.targetReason)}${input('复评百分比',at('actual')+' min="0" max="100" step="any"',r.actual,'number')}${input('复评证据来源',at('actualSource'),r.actualSource)}${input('复评观测日期',at('actualDate'),r.actualDate,'date')}${quality(at('actualQuality'),r.actualQuality)}</div></details>`;}).join('')).join('');
 renderActions();update();
}
function renderActions(){
 $('actionRows').innerHTML=project.actions.map(a=>{const at=k=>`data-action="${a.id}" data-field="${k}"`;return `<details open><summary>${esc(a.name||'未命名方案')}</summary><div class="grid">${input('方案名称',at('name'),a.name)}${input('执行负责人',at('owner'),a.owner)}${input('预算成本（万元）',at('cost')+' min="0" step="any"',a.cost,'number')}${input('所需周期（月）',at('months')+' min="0" step="any"',a.months,'number')}${input('人力（人月）',at('staff')+' min="0" step="any"',a.staff,'number')}${input('计划开始',at('start'),a.start,'date')}${input('计划结束',at('end'),a.end,'date')}${text('措施、作用机制与证据来源',at('source'),a.source)}${text('预期效果依据、假设和不确定性',at('assumptions'),a.assumptions)}${text('风险、受损主体及补偿安排',at('risk'),a.risk)}</div><details><summary>各指标的行动后假设值（空白表示沿用基准，非自动推演）</summary><div class="grid">${S.flatMap(st=>st.indicators.map(i=>input(st.short+' · '+i.name,`data-action-target="${a.id}" data-metric-id="${i.id}" min="0" max="100" step="any"`,a.targets[i.id],'number'))).join('')}</div></details></details>`;}).join('');
 refreshSelect();
}
function refreshSelect(){const el=$('selectedAction');el.innerHTML='<option value="">尚未选择</option>'+project.actions.map(a=>`<option value="${a.id}">${esc(a.name||'未命名方案')}</option>`).join('');el.value=project.meta.selectedAction;}
function fmt(n){return n===null||n===undefined?'待补':n.toFixed(2)+'%';}
function update(){
 const e=C.evaluate(project),names=ids=>ids.map(id=>S.flatMap(s=>s.indicators).find(i=>i.id===id).name).join('、');
 $('scoreSummary').textContent=`基准加权核算：${fmt(e.baseline.total)}；目标：${fmt(e.target.total)}；复评：${fmt(e.actual.total)}。基准数值待补 ${e.baseline.missing.length} 项；基准证据待补或待核验 ${e.evidenceMissing.length} 项。${e.measurementStatus}。${C.band(e.baseline.total)}（仅书中分析区间）；五级未评级。`;
 $('groupResults').innerHTML=S.map(st=>{const b=e.baseline.groups[st.id],t=e.target.groups[st.id],a=e.actual.groups[st.id];return `<tr><td>${esc(st.name)}（${st.stakeWeight}）</td><td>${fmt(b)}</td><td>${fmt(t)}</td><td>${fmt(a)}</td><td>${a===null||t===null?'待补':(a-t).toFixed(2)}</td></tr>`;}).join('');
 document.querySelectorAll('[data-metric-summary]').forEach(el=>el.textContent=fmt(project.metrics[el.dataset.metricSummary].baseline));
 $('actionResults').innerHTML=project.actions.map(a=>{const r=C.actionEvaluation(project,a);return `<tr><td>${esc(a.name||'未命名方案')}</td><td>${r.feasible===null?'约束或资源数据待补':r.feasible?'在已填资源上限内':'超出已填资源上限'}</td><td>${r.delta===null?'基准数据待补':r.delta.toFixed(3)}</td><td>${S.map(st=>`${esc(st.short)} ${r.groupChanges[st.id]===null?'待补':r.groupChanges[st.id].toFixed(2)+'pp'+(r.groupChanges[st.id]<0?'（受损，须说明补偿）':'')}`).join('；')}</td></tr>`;}).join('');
 const below=C.metricIds.filter(id=>C.pct(project.metrics[id].actual)&&C.pct(project.metrics[id].target)&&project.metrics[id].actual<project.metrics[id].target);
 $('reviewSummary').textContent=`复评数据待补 ${e.actual.missing.length} 项；复评证据待补或待核验 ${e.actualMissing.length} 项。低于目标 ${below.length} 项：${below.length?names(below):'当前无已填数据偏差记录，仍须检查缺失项'}。${e.modelStatus}。`;
 $('decisionHistory').innerHTML=project.decisions.map(d=>`<details><summary>${esc(d.at)} · ${esc(d.reviewer)}</summary><p>${esc(d.reason)}</p><p class="muted">该决定绑定保存当时的完整台账快照。后续变更不自动获得本次确认；完整快照见导出档案。</p></details>`).join('')||'<p class="muted">尚未记录人工决定。</p>';
}
document.addEventListener('input',e=>{
 const el=e.target,d=el.dataset;if(!el.checkValidity()){$('saveStatus').textContent='输入超出范围，请先修正；该值尚未保存。';return;}
 if(d.meta){project.meta[d.meta]=el.value;}
 else if(d.limit)project.limits[d.limit]=numeric(el.value);
 else if(d.need)project.needs[d.need][d.field]=el.value;
 else if(d.metric)project.metrics[d.metric][d.field]=['baseline','target','actual'].includes(d.field)?numeric(el.value):el.value;
 else if(d.action){const a=project.actions.find(a=>a.id===d.action);a[d.field]=['cost','months','staff'].includes(d.field)?numeric(el.value):el.value;if(d.field==='name')refreshSelect();}
 else if(d.actionTarget){const a=project.actions.find(a=>a.id===d.actionTarget);if(el.value==='')delete a.targets[d.metricId];else a.targets[d.metricId]=Number(el.value);}
 else return;
 if(d.meta!=='decisionStatus' && project.meta.decisionStatus==='已人工确认'){project.meta.decisionStatus='待确认';document.querySelector('[data-meta="decisionStatus"]').value='待确认';}
 save();update();
});
$('addAction').onclick=()=>{project.actions.push({id:crypto.randomUUID(),name:'',owner:'',cost:null,months:null,staff:null,start:'',end:'',source:'',assumptions:'',risk:'',targets:{}});renderActions();save();update();};
function download(name,text,type){const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function validateVisible(){const invalid=document.querySelector('input:invalid,select:invalid,textarea:invalid');if(invalid){invalid.closest('details')?.setAttribute('open','');invalid.reportValidity();throw Error('请修正页面中的无效输入再继续');}}
$('exportJson').onclick=()=>{try{validateVisible();download('园区五步法档案-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify(project,null,2),'application/json');}catch(e){$('saveStatus').textContent=e.message;}};
$('importFile').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>5e6)throw Error('文件超过5MB');const next=valid(JSON.parse(await f.text()));if(!confirm('导入将替换当前浏览器中的工作台内容。请先导出当前档案。继续导入？'))return;project=next;save();render();}catch(err){$('saveStatus').textContent='未导入、原档案保留：'+err.message;}e.target.value='';};
$('recordDecision').onclick=()=>{try{validateVisible();const m=project.meta,a=project.actions.find(a=>a.id===m.selectedAction);if(!m.reviewer.trim()||!m.decisionDate||!m.decisionReason.trim())throw Error('请填写确认人、日期与理由');if(m.decisionStatus==='已人工确认'){
 if(!a)throw Error('请先选择具体行动方案');const r=C.actionEvaluation(project,a);if(r.feasible!==true)throw Error('资源数据待补或超限，请先调整方案');if(!a.owner.trim()||!a.source.trim()||!a.assumptions.trim()||!a.risk.trim())throw Error('请补齐行动负责人、措施依据、预期假设及风险安排');if(S.some(st=>!project.needs[st.id].text.trim()||!project.needs[st.id].source.trim()||!project.needs[st.id].date))throw Error('请先记录七方需求、来源与日期');if(!m.goalAgreement.trim()||!m.nextReview.trim())throw Error('请补齐目标协商记录和下一轮复评安排');if(C.evaluate(project).baseline.total===null)throw Error('基准数值尚未填齐');
 }
 const snapshot=JSON.parse(JSON.stringify({...project,decisions:undefined}));project.decisions.push({at:new Date().toISOString(),reviewer:m.reviewer,reason:m.decisionReason,snapshot});save();update();}catch(e){$('saveStatus').textContent=e.message;}};
$('exportReport').onclick=()=>{try{validateVisible();const e=C.evaluate(project);const lines=['园区五步法逐项记录',`生成：${new Date().toISOString()}`,`园区：${project.meta.park}；负责人：${project.meta.lead}`,`权重版本：${C.VERSION}；换算细则/五级阈值：待确认；X-Flow：未启用`,'状态：人工百分比加权核算及行动假设。无正式预测、无认证；确认人自填，不构成身份签名。',`基准：${fmt(e.baseline.total)}；目标：${fmt(e.target.total)}；复评：${fmt(e.actual.total)}`,`基准证据缺失/未核验：${e.evidenceMissing.length}项；复评证据缺失/未核验：${e.actualMissing.length}项`,JSON.stringify(project.meta,null,2),'一、七方需求',...S.map(st=>st.name+'\n'+JSON.stringify(project.needs[st.id],null,2)),'二、35项指标（原始值、单位、来源、时点、目标、责任人、换算说明、证据状态、复评）',...S.flatMap(st=>st.indicators.map(i=>st.name+' / '+i.name+` / 三级权重${i.w}\n`+JSON.stringify(project.metrics[i.id],null,2))),'三、资源约束',JSON.stringify(project.limits,null,2),'四、候选方案（人工效果假设，非因果预测）',...project.actions.map(a=>JSON.stringify({action:a,evaluation:C.actionEvaluation(project,a)},null,2)),'五、人工决定与当时台账快照',JSON.stringify(project.decisions,null,2),'书稿样本清洗口径300→291→286，未经原始数据复算；案例时间口径与外部认可尚待核验。'];download('园区五步法逐项报告.txt',lines.join('\n\n'),'text/plain;charset=utf-8');}catch(e){$('saveStatus').textContent=e.message;}};
render();
