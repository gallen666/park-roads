const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const baseline = relative => execFileSync('git', ['show', `origin/main:${relative}`], { cwd: root, encoding: 'utf8' });

const homeLink = '    <a class="navlink" href="/government-parks/" role="link" aria-label="政府与园区建议版 — 城市中小企业经营改善方案">政府与园区</a>\n';
const managementLink = '<a href="/government-parks/">政府与园区</a>';

test('既有首页只新增一个政府与园区导航入口', () => {
  const current = read('index.html');
  assert.equal((current.match(/href="\/government-parks\/"/g) || []).length, 1);
  assert.equal(current.replace(homeLink, ''), baseline('index.html'));
});

test('十大经营系统只新增一个政府与园区导航入口', () => {
  const current = read('management-os/index.html');
  assert.equal((current.match(/href="\/government-parks\/"/g) || []).length, 1);
  assert.equal(current.replace(managementLink, ''), baseline('management-os/index.html'));
});

test('其他既有公开页面与核心计算文件保持字节级不变', () => {
  for (const relative of [
    'growth-os/index.html',
    'empower/index.html',
    'book-workbench.js',
    'book-core.js',
    'book-data.js'
  ]) {
    assert.equal(read(relative), baseline(relative), `${relative} 不应变化`);
  }
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

test('公开建议模块暂不收集资料或调用外部接口', () => {
  const page = read('government-parks/index.html').toLowerCase();
  assert.ok(page.includes('noindex,nofollow'));
  assert.ok(page.includes('本模块暂不采集联系信息'));
  assert.ok(!page.includes('<form'));
  assert.ok(!page.includes('fetch('));
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
