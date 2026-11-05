const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

test('首页保留政府与园区入口并接通联系入口', () => {
  const current = read('index.html');
  assert.equal((current.match(/href="\/government-parks\/"/g) || []).length, 1);
  assert.ok(current.includes('/contact/?intent=review&amp;source=homepage'));
  for (const preserved of ['data-go="sandbox"', 'data-go="method"', 'data-go="thesis"', 'data-go="service"']) {
    assert.ok(current.includes(preserved), `首页应保留原有模块：${preserved}`);
  }
});

test('十大经营系统保持不变并保留政府与园区入口', () => {
  const current = read('management-os/index.html');
  assert.equal((current.match(/href="\/government-parks\/"/g) || []).length, 1);
  for (const marker of [
    '战略设计', '价值创造', '产品战略', '组织发展', '预算管理',
    '营销战略', '用户经营', '绩效管理', '财务管理', '资本管理',
    'https://sme-ai-operations.yiledai.chatgpt.site/'
  ]) assert.ok(current.includes(marker), `十大经营系统应保留：${marker}`);
});

test('其他既有公开页面与核心计算入口保持可用', () => {
  assert.ok(read('growth-os/index.html').includes('Growth OS'));
  assert.ok(read('empower/index.html').includes('OpenFlowOne 安全升级'));
  assert.ok(read('book-workbench.js').includes('BookCore'));
  assert.ok(read('book-core.js').includes('metricIds'));
  assert.ok(read('book-data.js').includes('stakeWeight'));
});

test('政府与园区模块保留建议、虚构与非报价边界', () => {
  const page = read('government-parks/index.html');
  for (const marker of [
    '建议版本 · 非正式采购文件',
    '不代表既有客户、合同或成效',
    '建议试点配置',
    '完全虚构演示',
    '合成数据',
    '不对应真实企业',
    '不构成经营建议',
    '人民币30万–60万元',
    '非正式报价',
    '不承诺因果成效'
  ]) assert.ok(page.includes(marker), `缺少真实性标记：${marker}`);
});

test('三层治理与高风险禁止用途完整', () => {
  const page = read('government-parks/index.html');
  for (const marker of ['企业层', '项目运营层', '政府层']) assert.ok(page.includes(marker));
  assert.ok(page.includes('企业原始财务、客户、战略和资本资料不自动进入政府端'));
  assert.ok(page.includes('不凭AI草案自动进行企业排名、补贴决定、授信判断、行政处罚或资源淘汰'));
});

test('公开建议模块不直接收集资料并将申请导向联系页', () => {
  const page = read('government-parks/index.html').toLowerCase();
  assert.ok(page.includes('noindex,nofollow'));
  assert.ok(page.includes('本网站不直接上传或保存填写内容'));
  assert.ok(!page.includes('<form'));
  assert.ok(!page.includes('fetch('));
  assert.ok(page.includes('/contact/?intent=review&amp;source=government-parks'));
  assert.ok(page.includes('/contact/?intent=materials&amp;source=government-parks'));
  assert.ok(!page.includes('尚未接通'));
  assert.ok(!page.includes('openflowone-city-pilot-proposal.yiledai.chatgpt.site'));
});

test('新模块提供内部返回路径并使用统一蓝色', () => {
  const page = read('government-parks/index.html').toLowerCase();
  assert.ok(page.includes('href="/"'));
  assert.ok(page.includes('href="/management-os/"'));
  assert.ok(page.includes('https://openflowone.hk/government-parks/'));
  assert.ok(page.includes('--blue: #38bdf8'));
  for (const oldColor of ['#48d7c6', '#45d6c4', '#34d399', '#8fe3c2']) {
    assert.ok(!page.includes(oldColor), `仍含旧品牌绿色：${oldColor}`);
  }
  assert.ok(fs.existsSync(path.join(root, 'government-parks', 'favicon.svg')));
});
