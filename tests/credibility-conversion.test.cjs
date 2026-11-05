const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

test('主站移除占位身份与激进商业预测', () => {
  const home = read('index.html');
  for (const forbidden of [
    '某大学',
    'Dr. Jitao Dai',
    'University DBA',
    '5 年营收路径 ¥9.3 亿',
    '估值 ¥32 亿',
    '5 年累计 ¥9.3 亿',
    'A 轮 ¥1 亿'
  ]) assert.ok(!home.includes(forbidden), `主站不应包含：${forbidden}`);
  assert.ok(home.includes('OpenFlowOne · Hong Kong Bandgap Quantum Technology Limited'));
  assert.ok(home.includes('不公开预测营收、估值或融资金额'));
  assert.ok(home.includes('先证据，后规模'));
});

test('历史商业设计页退出搜索索引并显示醒目边界', () => {
  const radar = read('Park-ROADS-Radar.html');
  const architecture = read('Park-ROADS五系统产品架构.html');
  for (const page of [radar, architecture]) assert.ok(page.includes('noindex,nofollow'));
  assert.ok(radar.includes('历史内部研究页 · 不作为当前公开事实'));
  assert.ok(architecture.includes('历史内部假设 · 不作为当前产品、报价或预测'));
});

test('联系页生成可追踪邮件且不在网站保存输入', () => {
  const contact = read('contact/index.html');
  assert.ok(contact.includes('<form'));
  assert.ok(contact.includes('founder@bandgap.hk'));
  assert.ok(contact.includes('OF1-${type.toUpperCase()}-${date}-${code}'));
  assert.ok(contact.includes('navigator.clipboard.writeText'));
  assert.ok(contact.includes('window.location.href = mailto'));
  assert.ok(contact.includes("new Set(['review','materials','enterprise'])"));
  assert.ok(!contact.includes('fetch('));
  assert.ok(!contact.includes('localStorage'));
  assert.ok(!contact.includes('sessionStorage'));
  assert.ok(!contact.includes('document.cookie'));
});

test('联系页与隐私说明形成完整降级路径', () => {
  const contact = read('contact/index.html');
  const privacy = read('privacy/index.html');
  assert.ok(contact.includes('再次打开邮件应用'));
  assert.ok(contact.includes('复制申请内容'));
  assert.ok(contact.includes('href="/privacy/"'));
  assert.ok(privacy.includes('联系页不会把你填写的内容上传到 OpenFlowOne 网站服务器'));
  assert.ok(privacy.includes('一般不超过12个月'));
  assert.ok(privacy.includes('正式试点开始前'));
});
