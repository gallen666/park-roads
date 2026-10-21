/* Interactive teaching only. No writes to the sandbox, weights or project records. */
(function () {
  'use strict';
  const root = document.getElementById('thesis');
  if (!root || !window.BOOK_STAKES || !window.BookCore) return;
  const parties = window.BOOK_STAKES;
  const perspectives = [
    ['公共投入怎样转化为更好的发展环境？','把政务协同、基础设施与人才服务的实际障碍听清楚，区分政策供给与企业获得感。','约定需改善的具体服务、责任部门、观察周期及可核验的变化。','政策执行记录、服务办理数据与受益主体反馈相互印证。'],
    ['资产价值的增长，能否经得起长期检验？','关注长期出租、维护成本、资产使用质量与改造投入，听取运营与租户的约束。','把投入、预期收益、资金约束与核验时点写在同一份目标说明中。','租赁台账、维护支出、资产评估与投资记录，注明时间及口径。'],
    ['服务能力能否跟上园区的真实需求？','从企业与使用者的服务旅程出发，识别响应、协同和持续交付中的断点。','明确服务对象、交付内容、响应责任和复评方式，避免只以系统上线作为完成。','服务工单、运行记录、合作交付与使用者反馈共同支持判断。'],
    ['数字化能否帮助企业创造实际价值？','区分企业规模、行业与转型阶段，识别流程、市场、技术和技能需求。','由企业确认具体业务目标与实施约束，连接技术、人才及市场资源。','业务记录、技术产出、客户反馈和技能变化分别核验。'],
    ['知识如何成为园区可用的生产能力？','连接研究方向与产业问题，辨明合作、成果转化和人才培养中的真实需求。','约定合作对象、转化路径、成果责任与核验节点，不只追求合作数量。','合作及转化记录、学术产出与人才培养材料，分别对应指标。'],
    ['转型之后，员工的能力与机会是否增加？','直接听取岗位群体的体验，识别技能、工具使用、工作体验和职业发展障碍。','明确培训与应用场景、参与机制及复评安排，让员工能够反馈实施效果。','培训与实际应用记录、员工反馈及职业发展材料，保护个人信息。'],
    ['园区的发展，是否让周边生活更好？','识别不同年龄、能力与使用条件的服务障碍，不用“已上线”替代“可获得”。','明确可达的公共服务与参与渠道，关注生活质量、包容与公共安全。','服务接入记录、使用反馈、社区参与与安全资料，兼顾线下群体。']
  ];
  const list = root.querySelector('#bm-party-list');
  list.innerHTML = parties.map((p,i)=>`<button type="button" role="tab" id="bm-party-${i}" aria-controls="bm-party-detail" aria-selected="${i===0}" tabindex="${i===0?0:-1}" data-party="${i}" style="--party-color:${p.color}"><span>${p.name}</span><small>${(p.stakeWeight*100).toFixed(1)}%</small></button>`).join('');
  function showParty(i) {
    const p=parties[i], text=perspectives[i];
    list.querySelectorAll('button').forEach((b,j)=>{b.setAttribute('aria-selected',String(i===j));b.tabIndex=i===j?0:-1;});
    const detail=root.querySelector('#bm-party-detail');
    detail.setAttribute('aria-labelledby',`bm-party-${i}`);
    detail.innerHTML=`<div class="bm-detail-top"><h3 style="color:${p.color}">${p.name}</h3><span>一级权重 ${(p.stakeWeight*100).toFixed(1)}%</span></div><p class="bm-party-prompt">${text[0]}</p><div class="bm-detail-grid"><div><small>从需求走向目标</small><p>${text[1]}</p><p>${text[2]}</p></div><div><small>用什么支持判断</small><p>${text[3]}</p><p>以下为该方的正式指标。需求描述仍需由参与者讨论确认，不能从指标名称直接推定。</p></div></div><div class="bm-metric-chips">${p.indicators.map(m=>`<span>${m.name}</span>`).join('')}</div>`;
  }
  const steps=[
    ['识别需求','先让不同的期待与障碍被听见。','七方访谈、问卷与服务体验；分别记录当前感知、期待和事实依据。','形成需求图谱，保留分歧、代表范围及尚未被听见的群体。','把共同问题与分歧带入目标讨论。'],
    ['确立目标','把“想变好”转成能够共同检验的约定。','需求图谱与七方讨论；明确园区背景、约束和各方优先事项。','形成目标清单：基线、目标、责任、时间、资源及核验方式。','确定测什么、为什么测，以及用哪一版规则。'],
    ['指数评估','既看总体位置，也看七方差异。','在口径明确的前提下取得指标观测，记录来源、时间和缺失情况。','形成35项指标、七方一级指数及总指数，标明权重和数据版本。','以同一组基线与目标比较情景；缺失值不当作零。'],
    ['动态模拟','讨论反馈、时滞与可能的连锁影响。','明确的初始状态、目标、候选行动、约束及假设；区分静态比较与动态推演。','比较不同情景的受益分布、敏感因素和可行条件；预测需有可核验模型支持。','把值得试行的选择与不确定性带入行动安排。'],
    ['动态调整','让实际发生的变化改变下一轮选择。','行动记录、资源使用、交付情况及按一致口径取得的复评数据。','决定继续、调整或停止哪些行动，记录理由、责任与下次复评时间。','回到需求，检验目标是否仍然成立、谁的处境发生了变化。']
  ];
  const tabs=root.querySelector('#bm-cycle-tabs');
  tabs.innerHTML=steps.map((s,i)=>`<button type="button" role="tab" id="bm-step-${i}" aria-controls="bm-cycle-detail" aria-selected="${i===0}" tabindex="${i===0?0:-1}" data-step="${i}"><span>0${i+1} ${i<4?'→':'↺'}</span>${s[0]}</button>`).join('');
  function showStep(i){
    const s=steps[i];
    tabs.querySelectorAll('button').forEach((b,j)=>{b.setAttribute('aria-selected',String(i===j));b.tabIndex=i===j?0:-1;});
    const detail=root.querySelector('#bm-cycle-detail');detail.setAttribute('aria-labelledby',`bm-step-${i}`);
    detail.innerHTML=`<div><h3>${s[0]}</h3><p>${s[1]}</p></div><div><small>带着什么进入</small><p>${s[2]}</p></div><div><small>形成什么，交给下一步</small><p>${s[3]}</p><p style="color:#7dd3fc">→ ${s[4]}</p></div>`;
  }
  function wireTabs(parent,selector,render){
    parent.addEventListener('click',e=>{const b=e.target.closest('button');if(b)render(Number(b.dataset[selector]));});
    parent.addEventListener('keydown',e=>{
      const buttons=Array.from(parent.querySelectorAll('button'));let i=buttons.indexOf(e.target);
      if(i<0||!['ArrowRight','ArrowDown','ArrowLeft','ArrowUp','Home','End'].includes(e.key))return;
      e.preventDefault();i=e.key==='Home'?0:e.key==='End'?buttons.length-1:(i+(['ArrowRight','ArrowDown'].includes(e.key)?1:-1)+buttons.length)%buttons.length;
      render(i);buttons[i].focus();
    });
  }
  wireTabs(list,'party',showParty);wireTabs(tabs,'step',showStep);
  const scenarios={
    baseline:['全部35项指标设为50%。这是一组共同的教学基线，不是园区实测初值。','先有共同口径，才有可以讨论的比较。','35项指标均为50%。'],
    tradeoff:['在基线之上，将政府组“数字经济发展环境指数”设为60%，居民组“数字化服务接入度指数”设为25%；其余33项保持50%。','总指数几乎未变，居民的指数却下降了。这样的选择，能否仅凭总数作决定？','数字经济发展环境指数：50% → 60%。|数字化服务接入度指数：50% → 25%。|其余33项：50%。'],
    shared:['将政府组“数字经济发展环境指数”和居民组“数字化服务接入度指数”同时设为60%；其余33项保持50%。','两方都改善了，但这组目标能否实现、需要什么资源，仍须回到行动与证据。','数字经济发展环境指数：50% → 60%。|数字化服务接入度指数：50% → 60%。|其余33项：50%。']
  };
  function showScenario(id){
    const values=Object.fromEntries(window.BookCore.metricIds.map(m=>[m,50]));
    if(id!=='baseline'){values.gov_env=60;values.c_acc=id==='tradeoff'?25:60;}
    const result=window.BookCore.score(values), text=scenarios[id];
    root.querySelectorAll('[data-bm-scenario]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.bmScenario===id)));
    root.querySelector('#bm-total').innerHTML=`${result.total.toFixed(4)}<span>%</span>`;
    root.querySelector('#bm-scenario-description').textContent=text[0];root.querySelector('#bm-scenario-question').textContent=text[1];
    root.querySelector('#bm-bars').innerHTML=parties.map(p=>`<div class="bm-bar-row" style="--party-color:${p.color}"><span>${p.name}</span><div class="bm-bar-track" aria-hidden="true"><div class="bm-bar-fill" style="width:${result.groups[p.id]}%"></div></div><strong>${result.groups[p.id].toFixed(4)}%</strong></div>`).join('');
    root.querySelector('#bm-assumptions').innerHTML=`<ul>${text[2].split('|').map(t=>`<li>${t}</li>`).join('')}</ul>`;
  }
  root.querySelector('.bm-scenario-controls').addEventListener('click',e=>{const b=e.target.closest('[data-bm-scenario]');if(b)showScenario(b.dataset.bmScenario);});
  // In-page anchors belong to this module, not to the platform section router.
  root.querySelectorAll('a[href^="#bm-"]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();root.querySelector(a.getAttribute('href')).scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});}));
  showParty(0);showStep(0);showScenario('baseline');
})();
