const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const privateRoot = 'https://sme-ai-operations.yiledai.chatgpt.site/';

test('首页只保留十大经营系统导航，不显示宣传区块', () => {
  const home = read('index.html');
  assert.ok(home.includes('href="/management-os/"'));
  assert.ok(home.includes('>十大经营系统</a>'));
  assert.ok(!home.includes('class="business-entry"'));
  assert.ok(!home.includes('OPENFLOWONE · AI MANAGEMENT DESIGN SYSTEM'));
  assert.ok(!home.includes('输入企业名称，形成可审核的十大经营底稿'));
});

test('独立页面完整展示十个模块与私有边界', () => {
  const page = read('management-os/index.html');
  const labels = ['战略设计', '价值创造', '产品战略', '组织发展', '预算管理', '营销战略', '用户经营', '绩效管理', '财务管理', '资本管理'];
  for (const label of labels) assert.ok(page.includes(label), `缺少模块：${label}`);
  assert.equal((page.match(/class="module-card"/g) || []).length, 10);
  assert.ok(page.includes('公开的是方法，私有的是企业经营'));
  assert.ok(page.includes('登录后仅显示你有权访问的企业数据'));
  assert.ok(page.includes(privateRoot));
  assert.ok(!page.includes('yiledai.chatgpt.site/growth-os'));
});

test('旧安全页和 Growth OS 不再把十大工作台指向错误子路径', () => {
  const retired = read('empower/index.html');
  const growth = read('growth-os/index.html');
  assert.ok(retired.includes(`href="${privateRoot}">进入十大经营工作台`));
  assert.ok(retired.includes('href="/management-os/">查看十大经营系统'));
  assert.ok(growth.includes('href="/management-os/">查看十大经营系统'));
});

test('公开产品页使用官网蓝色品牌体系并保留首页语义色', () => {
  const home = read('index.html').toLowerCase();
  const management = read('management-os/index.html').toLowerCase();
  const retired = read('empower/index.html').toLowerCase();
  const growth = read('growth-os/index.html').toLowerCase();

  assert.ok(management.includes('--accent: #38bdf8'));
  assert.ok(retired.includes('color:#38bdf8'));
  assert.ok(retired.includes('background:#38bdf8'));
  assert.ok(growth.includes('--blue: #38bdf8'));

  const retiredBrandColors = ['#48d7c6', '#49b9ff', '#8fe3c2', '#83eadf', '#45d6c4', '#9de8cf', 'rgba(72, 215, 198', 'rgba(52, 211, 153'];
  for (const color of retiredBrandColors) {
    assert.ok(!management.includes(color), `十大经营系统仍含旧品牌色：${color}`);
    assert.ok(!retired.includes(color), `安全页仍含旧品牌色：${color}`);
    assert.ok(!growth.includes(color), `Growth OS 仍含旧品牌色：${color}`);
  }

  assert.ok(home.includes('--good:#22c55e'));
  assert.ok(home.includes('--asset:#34d399'));
});
