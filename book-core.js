/* Fixed book weights; no pending normalization, X-Flow equations or five-level thresholds. */
(function(root){
'use strict';
const stakes=typeof module!=='undefined'?require('./book-data.js'):root.BOOK_STAKES;
const VERSION='book-20261018';
const metricIds=stakes.flatMap(st=>st.indicators.map(i=>i.id));
const pct=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=100;
function score(values){
 const missing=metricIds.filter(id=>!pct(values?.[id]));
 const groups={};
 for(const st of stakes) groups[st.id]=st.indicators.every(i=>pct(values?.[i.id]))?st.indicators.reduce((a,i)=>a+values[i.id]*i.w,0):null;
 return {groups,missing,total:missing.length?null:stakes.reduce((a,st)=>a+groups[st.id]*st.stakeWeight,0),weightVersion:VERSION};
}
function band(value){ if(!pct(value))return '待补数据'; return value<45?'低于45%分析区间':value<60?'45%至不足60%分析区间':'60%及以上分析区间'; }
function completeAHP(answers){return Array.from({length:21},(_,i)=>answers?.[i]).every(v=>Number.isInteger(v)&&v!==0&&v!==-1&&Math.abs(v)<=9);}
function ahp(M){
 const n=M.length;
 if(n!==7||M.some((r,i)=>r.length!==n||r.some((v,j)=>!Number.isFinite(v)||v<=0||Math.abs(v*M[j]?.[i]-1)>1e-8||i===j&&Math.abs(v-1)>1e-8))) throw Error('需要完整、正值互反的7×7判断矩阵');
 let w=Array(n).fill(1/n),converged=false;
 for(let k=0;k<10000;k++){
  const aw=M.map(r=>r.reduce((a,v,j)=>a+v*w[j],0)),sum=aw.reduce((a,b)=>a+b,0),next=aw.map(v=>v/sum);
  if(Math.max(...next.map((v,i)=>Math.abs(v-w[i])))<1e-13){w=next;converged=true;break;} w=next;
 }
 if(!converged)throw Error('特征向量未收敛，请复核矩阵');
 const aw=M.map(r=>r.reduce((a,v,j)=>a+v*w[j],0)),lambdaMax=aw.reduce((a,v,i)=>a+v/w[i],0)/n;
 const CI=Math.max(0,(lambdaMax-n)/(n-1)),RI=1.32,CR=CI/RI;
 return {weights:w,lambdaMax,CI,RI,CR,consistent:CR<0.1};
}
function valuesOf(records,field){return Object.fromEntries(metricIds.map(id=>[id,records?.[id]?.[field]]));}
function evidenceGaps(records){return metricIds.filter(id=>{const r=records?.[id];return !r||!pct(r.baseline)||!r.source?.trim()||!r.observedAt||!r.owner?.trim()||!r.method?.trim()||!r.raw?.trim()||r.quality!=='已核验';});}
function evaluate(project){
 const baseline=score(valuesOf(project.metrics,'baseline')),target=score(valuesOf(project.metrics,'target')),actual=score(valuesOf(project.metrics,'actual'));
 const evidenceMissing=evidenceGaps(project.metrics);
 const actualMissing=metricIds.filter(id=>{const r=project.metrics[id];return !pct(r.actual)||!r.actualSource?.trim()||!r.actualDate||r.actualQuality!=='已核验';});
 return {baseline,target,actual,evidenceMissing,actualMissing,measurementStatus:'换算细则待作者确认；仅为已输入百分比的加权核算',modelStatus:'X-Flow方程与参数待确认，正式动态模拟未启用',gradeStatus:'五级评价阈值待确认，未评级'};
}
function actionEvaluation(project,action){
 const current=score(valuesOf(project.metrics,'baseline'));
 const after=score(Object.fromEntries(metricIds.map(id=>[id,pct(action.targets?.[id])?action.targets[id]:project.metrics[id].baseline])));
 const known=['cost','months','staff'].every(k=>Number.isFinite(action[k])&&action[k]>=0)&&['budget','months','staff'].every(k=>Number.isFinite(project.limits[k])&&project.limits[k]>=0);
 const feasible=known? action.cost<=project.limits.budget&&action.months<=project.limits.months&&action.staff<=project.limits.staff:null;
 const groupChanges=Object.fromEntries(stakes.map(st=>[st.id,current.groups[st.id]===null||after.groups[st.id]===null?null:after.groups[st.id]-current.groups[st.id]]));
 return {feasible,after,delta:current.total===null||after.total===null?null:after.total-current.total,groupChanges,scope:'人工目标假设的静态差额，不是因果预测或投入产出率'};
}
const api={VERSION,metricIds,pct,score,band,ahp,completeAHP,valuesOf,evaluate,actionEvaluation};
if(typeof module!=='undefined')module.exports=api;else root.BookCore=api;
})(typeof window!=='undefined'?window:globalThis);
