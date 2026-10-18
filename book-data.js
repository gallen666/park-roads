(function(){
/* 书稿作者已确认修订：2026-10-18。换算细则另案待确认。 */
const STAKES = [
  { id:'gov', name:'地方政府', short:'政府', color:'var(--gov)', stakeWeight:0.257, indicators:[
    {id:'gov_env',  name:'数字经济发展环境指数',  w:0.444, def:50, desc:'测度行政机构优化区域数字经济环境的成效，含扶持性政策颁布频率、财政专项拨款额度、双创生态优化幅度。书稿第七章。'},
    {id:'gov_inf',  name:'数字基础设施建设指数',  w:0.249, def:50, desc:'解析行政主体对 5G 通讯、光纤网络、智慧城市硬件等的投入强度及成效。智能终端覆盖率与传输速率为重要观测维度。'},
    {id:'gov_tal',  name:'人才吸引和培养指数',    w:0.152, def:50, desc:'衡量行政单元在数字经济高端人才引进与培育方面的实践效果，依托高校与科研院所的产学研联动机制。'},
    {id:'gov_eco',  name:'数字经济生态体系指数',  w:0.101, def:50, desc:'映射行政机构构建维护产业生态的效能，含企业矩阵协同度、政产学研金服联动、孵化平台运营质量。'},
    {id:'gov_inn',  name:'创新与技术企业比例',    w:0.054, def:50, desc:'反映园区内高成长性企业的占比结构。研发投入强度与 PCT 国际专利申请量构成双重标尺。'},
  ]},
  { id:'asset', name:'资产持有方', short:'资产', color:'var(--asset)', stakeWeight:0.187, indicators:[
    {id:'a_appr', name:'资产增值率',         w:0.561, def:50, desc:'市场评估数据揭示园区资产价值变动轨迹。房地产价格与土地价值波动构成核心观测指标。书稿第七章。'},
    {id:'a_brnd', name:'品牌影响力指标',     w:0.122, def:50, desc:'行业知名度与品牌溢价能力。品牌认知、偏好与市场表现须分别核验，换算规则待确认。'},
    {id:'a_roi',  name:'投资回报率 ROI',     w:0.117, def:50, desc:'数字化投资回报关键指标。ROI = (收益 - 成本) / 成本，覆盖租金增量与资产增值。'},
    {id:'a_cost', name:'维护和运营成本比',   w:0.108, def:50, desc:'智能管理系统与自动化设备压缩运营开支。成本控制比率反映数字化转型的降本效能。'},
    {id:'a_lease',name:'租赁率和租金水平',   w:0.092, def:50, desc:'租赁市场动态数据映射数字化转型成效。租赁率与租金增长率双重观测。'},
  ]},
  { id:'ops', name:'园区运营方', short:'运营', color:'var(--ops)', stakeWeight:0.143, indicators:[
    {id:'o_sat',  name:'数字化服务满意度',     w:0.420, def:50, desc:'基于 SERVQUAL 模型的可靠性、响应性、保证性、同理心、有形性五维度评估。书稿第七章。'},
    {id:'o_eff',  name:'数字化运营效率提升率', w:0.267, def:50, desc:'对比转型前后生产周期、成本效益等核心运营参数，测算数字化技术对园区运营效能的真实提升幅度。'},
    {id:'o_inn',  name:'数字化服务创新指数',   w:0.160, def:50, desc:'衡量数字转型过程中新型服务质量与数量。结合创新项目数量、市场渗透率及用户评价数据。'},
    {id:'o_net',  name:'合作伙伴网络密度',     w:0.090, def:50, desc:'解析园区同数字技术供应商、研发机构等伙伴的协同效应。合作项目规模、合作方资质及成果产业化比率。'},
    {id:'o_cov',  name:'数字化应用覆盖率',     w:0.063, def:50, desc:'追踪信息安全事件频率、系统响应时效等核心参数，综合评价数字系统覆盖率与稳定性。'},
  ]},
  { id:'biz', name:'入驻企业', short:'企业', color:'var(--biz)', stakeWeight:0.120, indicators:[
    {id:'b_dx',   name:'数字化转型程度',         w:0.377, def:50, desc:'企业引入新技术、调整组织结构、优化业务流程的全面程度。书稿第七章。'},
    {id:'b_mk',   name:'市场竞争力指数',         w:0.221, def:50, desc:'通过技术创新与流程优化应对市场快速变化的能力。'},
    {id:'b_inn',  name:'数字化技术创新产出率',   w:0.153, def:50, desc:'通过新产品开发、专利申请等指标衡量企业的技术创新能力。'},
    {id:'b_cust', name:'客户体验满意度',         w:0.150, def:50, desc:'数字化触点的客户体验质量。'},
    {id:'b_skl',  name:'员工数字化技能提升率',   w:0.099, def:50, desc:'员工掌握数字化技术工具的能力增量。'},
  ]},
  { id:'res', name:'科研院所', short:'科研', color:'var(--research)', stakeWeight:0.110, indicators:[
    {id:'r_xfer', name:'科研成果转化率',         w:0.484, def:50, desc:'科研成果产业化的效率。书稿第七章，是该主体最重要的指标（权重几乎过半）。'},
    {id:'r_iur',  name:'产学研合作项目数量',     w:0.221, def:50, desc:'与产业界、政府的合作项目规模。'},
    {id:'r_aca',  name:'学术影响力指数',       w:0.156, def:50, desc:'学术发表、引用、影响因子等综合学术影响力。'},
    {id:'r_inn',  name:'数字化技术创新率',       w:0.094, def:50, desc:'数字化方向的原创技术创新比率。'},
    {id:'r_tal',  name:'人才培养贡献率',         w:0.045, def:50, desc:'科研机构对人才培养的贡献程度。'},
  ]},
  { id:'tal', name:'入驻企业员工', short:'员工', color:'var(--talent)', stakeWeight:0.093, indicators:[
    {id:'t_skl',  name:'技能提升与适应性',           w:0.521, def:50, desc:'员工对数字化转型的适应能力，以及在新工作场景中的技能提升幅度。书稿第七章，最重要指标。'},
    {id:'t_use',  name:'数字化工具使用熟练度',       w:0.238, def:50, desc:'员工对各类数字化工具与平台的实际操作熟练度。'},
    {id:'t_sat',  name:'工作满意度与效率提升',       w:0.114, def:50, desc:'数字化对员工工作满意度与单位时间产出的影响。'},
    {id:'t_inn',  name:'数字化创新参与度指数',       w:0.079, def:50, desc:'员工参与数字化创新项目的频次与贡献价值。'},
    {id:'t_dev',  name:'职业发展机会感知指数',       w:0.048, def:50, desc:'员工对数字化转型催生职业机会的认知程度。'},
  ]},
  { id:'com', name:'周边居民', short:'居民', color:'var(--community)', stakeWeight:0.090, indicators:[
    {id:'c_acc',  name:'数字化服务接入度指数',   w:0.503, def:50, desc:'居民获取园区公共数字服务的可获得性与覆盖密度。书稿第七章，最重要指标。'},
    {id:'c_qol',  name:'生活质量提升指数',       w:0.254, def:50, desc:'数字技术对日常生存质量的提升轨迹，含远程诊疗、教育、政务数字化等。'},
    {id:'c_eng',  name:'社区互动与参与度指数',   w:0.137, def:50, desc:'依托数字媒介评估居民联结强度与集体凝聚力。'},
    {id:'c_inc',  name:'社会包容度指数',         w:0.064, def:50, desc:'数字化转型对社会多元融合的促进效能。'},
    {id:'c_saf',  name:'公共安全度指数',         w:0.042, def:50, desc:'智能监控、数字化报警等系统对社区安全环境的提升作用。'},
  ]},
];
for(const st of STAKES){ for(const i of st.indicators) Object.freeze(i); Object.freeze(st.indicators); Object.freeze(st); }
Object.freeze(STAKES);
if(typeof module !== 'undefined') module.exports=STAKES; else window.BOOK_STAKES=STAKES;

})();
