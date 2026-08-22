'use strict';
/* ───────── 工具 ───────── */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;',
}[c]));
const root = () => document.getElementById('root');
const STATS_SCOPE = '当前企业全部承诺；状态按导出时点判定；页面筛选不影响导出。承诺金仅用于提醒与公示，不做扣款。';
const GENERATION_REVIEW_NOTICE = 'AI 诊断为经营草案；引用仅说明使用了哪些录入片段，企业事实、责任人和执行标准仍需人工核验确认。';

function readBootstrap() {
  const node = document.getElementById('app-bootstrap');
  if (!node) return {};
  try { return JSON.parse(node.textContent || '{}'); }
  catch { return {}; }
}

const BOOTSTRAP = readBootstrap();
/* 本地静态复刻：登录/退出改为本页自身，不接入任何外部身份服务。 */
const DEFAULT_SIGN_IN = './';
const DEFAULT_SIGN_OUT = './';

class ApiError extends Error {
  constructor(message, status, code, payload = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code || null;
    this.payload = payload && typeof payload === 'object' ? payload : {};
  }
}

function displayBrand(value) {
  return String(value ?? '')
    .replace(/deepseek-v4-flash/gi, '继涛博士')
    .replace(/DeepSeek/g, '继涛博士')
    .replace(/deepseek/gi, '继涛博士');
}

function showSessionExpired() {
  document.querySelectorAll('.modal').forEach(d => d.remove());
  S.user = null; S.companies = []; S.cid = null; S.renderSeq += 1;
  if (S.redirectingToSignIn) return;
  S.redirectingToSignIn = true;
  root().innerHTML = `<main class="auth-wrap"><section class="auth" aria-labelledby="session-title">
    <h2 id="session-title">登录状态已失效</h2><p class="s">请重新使用平台账号登录后继续。</p>
    <a class="cloud-signin" href="${esc(S.signInUrl)}">重新登录 <span aria-hidden="true">→</span></a></section></main>`;
  window.location.assign(S.signInUrl);
}

/*
 * 本地 继涛博士 接入（相对仓库 public/app.js 的改动）：
 * 改回同源 fetch，由 Desktop 目录的 local-api-server.mts 提供 /api。
 * 服务端导入仓库官方 handleApiRequest / 继涛博士 工厂，不再走 js/backend.js 模拟。
 */
const API_BASE = (typeof window !== 'undefined' && window.SME_API_BASE)
  ? String(window.SME_API_BASE).replace(/\/$/, '')
  : '';
function apiUrl(url) {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  return API_BASE + url;
}
async function api(url, opts = {}) {
  const isForm = typeof FormData !== 'undefined' && opts.body instanceof FormData;
  const r = await fetch(apiUrl(url), {
    method: opts.method || 'GET',
    headers: {
      ...(opts.body && !isForm ? { 'Content-Type': 'application/json' } : {}),
      ...(opts.headers || {}),
    },
    body: opts.body ? (isForm ? opts.body : JSON.stringify(opts.body)) : undefined,
    credentials: API_BASE ? 'omit' : 'same-origin',
  });
  const t = await r.text();
  let j = {}; try { j = t ? JSON.parse(t) : {}; } catch { j = { error: t.slice(0, 200) }; }
  if (!r.ok) {
    const e = new ApiError(j.error || j.message || `请求失败（${r.status}）`, r.status, j.code, j);
    if (r.status === 401 && opts.auth !== false) showSessionExpired();
    throw e;
  }
  return j && typeof j === 'object' && j.data !== undefined &&
    (j.ok === true || Object.keys(j).every(key => key === 'data' || key === 'ok')) ? j.data : j;
}

/* 本地 继涛博士 接入：打印报告改回官方 fetchDocument，读取同源 /api/.../report/print HTML。 */
async function fetchDocument(url) {
  const response = await fetch(apiUrl(url), {
    method: 'GET',
    headers: { Accept: 'text/html' },
    credentials: API_BASE ? 'omit' : 'same-origin',
  });
  const text = await response.text();
  if (!response.ok) {
    let payload = {};
    try { payload = text ? JSON.parse(text) : {}; } catch { payload = { error: text.slice(0, 200) }; }
    const error = new ApiError(payload.error || payload.message || `请求失败（${response.status}）`, response.status, payload.code, payload);
    if (response.status === 401) showSessionExpired();
    throw error;
  }
  return text;
}

const S = {
  user: BOOTSTRAP.user || null,
  companies: [],
  cid: null,
  meta: BOOTSTRAP.meta || null,
  signInUrl: BOOTSTRAP.signInUrl || DEFAULT_SIGN_IN,
  signOutUrl: BOOTSTRAP.signOutUrl || DEFAULT_SIGN_OUT,
  view: 'board', moduleNo: null, renderSeq: 0, redirectingToSignIn: false,
  researchAutoStart: false, researchRecovered: false,
  bootstrapAutoStart: false, bootstrapRecovered: false, bootstrapActionError: null,
};
const CURRENT_COMPANY_KEY = 'sme-ai-current-company';

function rememberCurrentCompany(companyId) {
  if (companyId === undefined || companyId === null) return;
  try { globalThis.sessionStorage?.setItem(CURRENT_COMPANY_KEY, String(companyId)); } catch { /* device preference unavailable */ }
}

function rememberedCurrentCompany() {
  try { return globalThis.sessionStorage?.getItem(CURRENT_COMPANY_KEY) || null; }
  catch { return null; }
}
const myRole = () => (S.companies.find(c => String(c.id) === String(S.cid)) || {}).role || 'owner';
const isRO = () => myRole() !== 'owner';
const ST = { done:['s-good','✓','已完成'], over:['s-crit','✕','已逾期'],
             soon:['s-warn','!','临期预警'], run:['s-run','○','进行中'] };

function renderServiceError(message) {
  root().innerHTML = `<div class="auth-wrap"><div class="auth">
    <h2>暂时无法连接服务</h2>
    <p class="s">请检查网络或稍后重试。你的本次页面操作没有提交。</p>
    <div class="msg msg-e" role="alert">${esc(message)}</div>
    <button class="btn" type="button" id="retry">重新连接</button>
  </div></div>`;
  $('#retry').onclick = () => boot();
}

function setMessage(el, message, tone = 'error') {
  if (!el) return;
  el.className = `msg ${tone === 'ok' ? 'msg-o' : tone === 'info' ? 'msg-i' : 'msg-e'}`;
  el.setAttribute('role', tone === 'error' ? 'alert' : 'status');
  el.textContent = message;
}

function replaceableCount(source) {
  const payload = source?.payload && typeof source.payload === 'object' ? source.payload : source;
  if (!payload || typeof payload !== 'object') return null;
  const confirmation = payload.confirmation && typeof payload.confirmation === 'object' && !Array.isArray(payload.confirmation)
    ? payload.confirmation : null;
  const raw = confirmation?.replaceable_count ?? payload.replaceable_count ?? payload.will_delete;
  if (raw === null || raw === undefined || raw === '') return null;
  const count = Number(raw);
  return Number.isInteger(count) && count >= 0 ? count : null;
}

function replacementConfirmation(source) {
  const payload = source?.payload && typeof source.payload === 'object' ? source.payload : source;
  const confirmation = payload?.confirmation;
  return confirmation && typeof confirmation === 'object' && !Array.isArray(confirmation) ? confirmation : null;
}

function isReplaceConfirmation(error) {
  if (error?.status !== 409) return false;
  return error.code === 'confirm_replace_required' ||
    error.payload?.code === 'confirm_replace_required' ||
    error.payload?.error === 'need_confirm';
}

function confirmReplacement(source) {
  const count = replaceableCount(source);
  const countText = count === null
    ? '服务端将在采用草案时重新核验本模块待替换的未完成 AI 承诺。'
    : `服务端刚刚核对：如稍后采用草案，将替换 ${count} 条未完成的 AI 承诺。`;
  const callText = S.meta?.llm?.mock !== false
    ? '本次只生成模拟演示，不会调用 继涛博士。'
    : '确认后将新发起 1 次 继涛博士 调用，可能产生模型费用；系统不会自动重复调用。';
  return confirm(`本次将先生成一份可完整预览的 AI 草案，不会立即覆盖正式诊断。${countText}\n\n只有人工点击“确认采用草案”后才会写入；已完成的 AI 承诺、手工承诺和全部批注都会保留。${callText}\n\n确定继续生成草案吗？`);
}

function confirmGenerationRecovery(kind, hasExistingResult = false, ask = confirm) {
  if (kind !== 'cost_uncertain' && kind !== 'conflict') return true;
  const isMock = S.meta?.llm?.mock === true;
  const reason = isMock
    ? `上一次模拟生成${kind === 'cost_uncertain' ? '状态仍不确定' : '因资料变化未写入'}。`
    : kind === 'cost_uncertain'
      ? '上一次 继涛博士 调用状态仍不确定，可能已经产生费用。'
      : '上一次 继涛博士 生成因资料变化未写入，但可能已经产生费用。';
  const nextCall = isMock
    ? '当前为模拟演示，继续不会产生 继涛博士 费用。'
    : '继续会创建新的调用记录，并可能再产生一次 继涛博士 费用。';
  const preservation = hasExistingResult
    ? '新结果完整生成前，当前诊断、已完成承诺、手工承诺和批注都会保留。'
    : '';
  return ask(`${reason}系统未自动重试，也不会自动清除上一次调用记录。\n\n${nextCall}${preservation}\n\n确定新发起一次生成吗？`);
}

const GENERATION_ATTEMPT_PREFIX = 'sme-ai-generation-attempt';

function generationAttemptStorageKey(companyId, moduleNo) {
  return `${GENERATION_ATTEMPT_PREFIX}:${companyId}:${moduleNo}`;
}

function validIdempotencyKey(value) {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{12,128}$/.test(value);
}

function storedGenerationAttemptKey(companyId, moduleNo) {
  try {
    const value = globalThis.sessionStorage?.getItem(generationAttemptStorageKey(companyId, moduleNo));
    return validIdempotencyKey(value) ? value : null;
  } catch { return null; }
}

function ensureGenerationAttemptKey(companyId, moduleNo) {
  const existing = storedGenerationAttemptKey(companyId, moduleNo);
  if (existing) return existing;
  const generated = globalThis.crypto?.randomUUID?.() || `generation-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  try { globalThis.sessionStorage?.setItem(generationAttemptStorageKey(companyId, moduleNo), generated); }
  catch { /* the in-memory caller still reuses the same key for this click */ }
  return generated;
}

function clearGenerationAttemptKey(companyId, moduleNo) {
  try { globalThis.sessionStorage?.removeItem(generationAttemptStorageKey(companyId, moduleNo)); }
  catch { /* device preference unavailable */ }
}

function normalizeGenerationMeta(value) {
  const source = value?.generation && typeof value.generation === 'object' ? value.generation
    : value && typeof value === 'object' ? value : {};
  const rawElapsed = source.elapsed_ms ?? source.ms;
  const elapsedMs = rawElapsed === null || rawElapsed === undefined || rawElapsed === ''
    ? null : Number(rawElapsed);
  return {
    ...source,
    status: String(source.status || '').toLowerCase(),
    mode: String(source.mode || '').toLowerCase(),
    model: source.model ? String(source.model) : '',
    job_id: source.job_id ? String(source.job_id) : '',
    elapsed_ms: Number.isFinite(elapsedMs) && elapsedMs >= 0 ? elapsedMs : null,
    already: source.already === true,
  };
}

function normalizeDraftGeneration(value) {
  const payload = value && typeof value === 'object' ? value : {};
  const draft = payload.draft_generation && typeof payload.draft_generation === 'object' &&
    !Array.isArray(payload.draft_generation) ? payload.draft_generation : null;
  if (!draft) return null;
  const generation = normalizeGenerationMeta(payload.generation || payload.meta || payload);
  const responseMeta = normalizeGenerationMeta(payload.meta || payload.generation || payload);
  const rawJobId = payload.job_id ?? generation.job_id ?? draft.job_id;
  const rawOutputHash = payload.output_hash ?? payload.generation?.output_hash ?? draft.output_hash;
  return {
    job_id: typeof rawJobId === 'string' ? rawJobId : '',
    output_hash: typeof rawOutputHash === 'string' ? rawOutputHash : '',
    error_point: String(draft.error_point || ''),
    framework: draft.framework && typeof draft.framework === 'object' && !Array.isArray(draft.framework)
      ? draft.framework : {},
    pledges: Array.isArray(draft.pledges)
      ? draft.pledges.filter(pledge => pledge && typeof pledge === 'object' && !Array.isArray(pledge)) : [],
    generation_basis: draft.generation_basis && typeof draft.generation_basis === 'object'
      ? draft.generation_basis : null,
    missing_information: Array.isArray(draft.missing_information) ? draft.missing_information : [],
    meta: {
      ...generation,
      ...responseMeta,
      status: generation.status || responseMeta.status || 'generated',
      job_id: typeof rawJobId === 'string' ? rawJobId : '',
    },
  };
}

function draftActionDescriptor(draft) {
  if (!draft || typeof draft !== 'object') return null;
  const jobId = typeof draft.job_id === 'string' ? draft.job_id : '';
  const outputHash = typeof draft.output_hash === 'string' ? draft.output_hash : '';
  if (!jobId.trim() || !outputHash.trim()) return null;
  return { job_id: jobId, body: { output_hash: outputHash } };
}

function createDraftActionGuard() {
  let busy = false;
  return async action => {
    if (busy) return { started: false };
    busy = true;
    try { return { started: true, value: await action() }; }
    finally { busy = false; }
  };
}

function generationIsMock(meta) {
  const generation = normalizeGenerationMeta(meta);
  if (generation.mode) return generation.mode === 'mock';
  return S.meta?.llm?.mock !== false;
}

function generationActionLabel(hasExisting = false) {
  if (S.meta?.llm?.mock !== false) return hasExisting ? '重新生成演示草案' : '生成演示草案';
  return hasExisting ? '重新使用 继涛博士 生成草案' : '使用 继涛博士 生成草案';
}

function generationStatusKind(value) {
  const generation = normalizeGenerationMeta(value);
  const status = generation.status;
  const code = String(generation.error_code || generation.code || '');
  if (code === 'generation_replay_stale' || status === 'stale_replay') return 'stale_replay';
  if (code === 'confirm_replace_changed' || status === 'confirm_stale') return 'confirm_stale';
  if (code === 'generation_output_mismatch' || status === 'draft_stale') return 'draft_stale';
  if (code === 'generation_draft_pending' || status === 'draft_pending') return 'draft_pending';
  if (code === 'user_rejected' || status === 'discarded') return 'discarded';
  if (status === 'generated' || status === 'draft_ready') return 'draft_ready';
  if (status === 'running' || status === 'in_progress') return 'in_progress';
  if (status === 'cost_uncertain') return 'cost_uncertain';
  if (status === 'conflict') return 'conflict';
  if (status === 'failed') return 'failed';
  if (status === 'applied' || status === 'succeeded' || status === 'completed') return 'succeeded';
  return '';
}

function generationErrorKind(error) {
  const code = String(error?.code || error?.payload?.code || '');
  if (code === 'generation_replay_stale') return 'stale_replay';
  if (code === 'confirm_replace_changed') return 'confirm_stale';
  if (code === 'generation_output_mismatch') return 'draft_stale';
  if (code === 'generation_draft_pending') return 'draft_pending';
  const status = generationStatusKind(error?.payload || error);
  if (status) return status;
  if (code === 'generation_cost_uncertain') return 'cost_uncertain';
  if (code === 'generation_in_progress') return 'in_progress';
  if (code === 'generation_conflict') return 'conflict';
  if (!error?.status || error.status === 429 || error.status >= 500) return 'cost_uncertain';
  return 'failed';
}

function generationControlsBlocked(value) {
  return ['in_progress', 'draft_ready', 'draft_pending', 'draft_stale', 'stale_replay', 'confirm_stale']
    .includes(generationStatusKind(value));
}

function generationShouldClearAttempt(value) {
  return ['succeeded', 'failed', 'discarded'].includes(generationStatusKind(value));
}

async function copyText(text) {
  let clipboardError = null;
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    try { await navigator.clipboard.writeText(text); return; }
    catch (e) { clipboardError = e; }
  }
  const field = document.createElement('textarea');
  field.value = text; field.setAttribute('readonly', ''); field.className = 'copy-fallback';
  document.body.appendChild(field); field.select();
  let copied = false;
  try { copied = document.execCommand('copy'); } catch { /* clipboard fallback failed */ }
  field.remove();
  if (!copied) throw new Error(clipboardError?.message || '浏览器未允许复制，请手动选中链接复制。');
}

function mountModal(d, focusSelector) {
  const previous = document.activeElement;
  document.body.appendChild(d);
  const close = () => {
    d.remove();
    if (previous && document.contains(previous)) previous.focus();
  };
  d.addEventListener('mousedown', e => { if (e.target === d) close(); });
  d.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key !== 'Tab') return;
    const focusable = [...d.querySelectorAll('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [href], [tabindex]:not([tabindex="-1"])')];
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  requestAnimationFrame(() => (d.querySelector(focusSelector) || d.querySelector('button, input, textarea, select'))?.focus());
  return close;
}

/* ───────── 外壳 ───────── */
function shell(inner) {
  const m = S.meta?.llm || { mock: true, model: null };
  return `<a class="skip-link" href="#view">跳到主要内容</a><div class="app">
    <nav class="side" aria-label="主导航">
      <div class="brand"><div class="brand-n">中小企业 AI 管理系统</div><div class="brand-s">${esc(S.user?.name || '当前用户')}</div></div>
      <div class="nav">
        <button type="button" class="navitem ${S.view === 'board' ? 'on' : ''}" data-v="board" ${S.view === 'board' ? 'aria-current="page"' : ''}><span class="dot"></span>承诺看板</button>
        <button type="button" class="navitem ${S.view === 'research' ? 'on' : ''}" data-v="research" ${S.view === 'research' ? 'aria-current="page"' : ''}><span class="dot"></span>AI 企业建档</button>
        <button type="button" class="navitem ${S.view === 'wbs' || S.view === 'detail' ? 'on' : ''}" data-v="wbs" ${S.view === 'wbs' || S.view === 'detail' ? 'aria-current="page"' : ''}><span class="dot"></span>十部工作台</button>
        <button type="button" class="navitem ${S.view === 'members' ? 'on' : ''}" data-v="members" ${S.view === 'members' ? 'aria-current="page"' : ''}><span class="dot"></span>成员与批注${S.openNotes ? `<span class="badge">${esc(S.openNotes)}</span>` : ''}</button>
        <div class="navlbl">账号</div>
        <button type="button" class="navitem" data-act="logout"><span class="dot"></span>退出登录</button>
      </div>
    </nav>
    <main class="main">
      <div class="topbar">
        <label class="sr-only" for="cosel">当前企业</label>
        <select id="cosel">${S.companies.map(c =>
          `<option value="${esc(c.id)}" ${String(c.id) === String(S.cid) ? 'selected' : ''}>${esc(c.name)}${c.role === 'consultant' ? '（顾问）' : ''}</option>`).join('')}</select>
        <button class="btn btn-g" type="button" id="newco">+ 新建企业</button>
        <button class="btn" type="button" id="exportsequoia-top">导出红杉融资BP</button>
        <span id="shellsequoiastatus" class="action-status" aria-live="polite"></span>
        <div class="sp">
          ${isRO() ? '<span class="rolepill">顾问 · 只读</span>' : ''}
          <span class="${m.mock ? 'mode-mock' : 'mode-live'}">●</span>
          <span>${m.mock ? '模拟模式（未配置 API Key）' : '模型：' + esc(displayBrand(m.model || '继涛博士'))}</span>
          ${S.meta?.research ? `<span class="research-mode-sep" aria-hidden="true">·</span><span>公开调研：${S.meta.research.enabled ? `${esc(displayBrand(S.meta.research.provider || '继涛博士'))}${S.meta.research.web_search ? ' + Web Search' : ''}` : '未连接'}</span>` : ''}
        </div>
      </div>
      <div id="view">${inner}</div>
    </main></div>`;
}
function bindShell() {
  root().querySelectorAll('.nav [data-v]').forEach(a => a.onclick = () => go(a.dataset.v));
  const lo = root().querySelector('[data-act="logout"]');
  if (lo) lo.onclick = () => {
    lo.disabled = true;
    window.location.assign(S.signOutUrl);
  };
  const sel = $('#cosel'); if (sel) sel.onchange = () => {
    const company = S.companies.find(c => String(c.id) === sel.value);
    S.cid = company?.id ?? sel.value; rememberCurrentCompany(S.cid); S.moduleNo = null; filt = 'all'; go('board');
  };
  const nc = $('#newco'); if (nc) nc.onclick = companyModal;
  const sequoiaTop = $('#exportsequoia-top');
  if (sequoiaTop) sequoiaTop.onclick = () => downloadSequoiaPptx(sequoiaTop, $('#shellsequoiastatus') || $('#boardactionstatus'));
}
function go(v, no) { S.view = v; if (no) S.moduleNo = no; render(); }

/* ───────── 新建企业 ───────── */
async function createCompanyAndBootstrap(companyName, planText, planFile) {
  const name = String(companyName || '').trim();
  if (!name) throw new Error('请输入企业完整名称。');
  const plan = String(planText || '').trim();
  const company = await api('/api/companies', { method: 'POST', body: { name } });
  const companyId = company.id ?? company.company?.id ?? company.company_id;
  if (companyId === undefined || companyId === null) throw new Error('企业已创建，但返回信息不完整，请刷新后继续。');
  if (planFile) {
    if (planFile.size > PLAN_FILE_MAX_BYTES) throw new Error('单文件最大 500MB');
    const form = new FormData();
    form.append('kind', 'business_plan');
    form.append('file', planFile);
    await api(`/api/companies/${encodeURIComponent(companyId)}/owner-documents`, {
      method: 'POST',
      body: form,
    });
  } else if (plan) {
    await api(`/api/companies/${encodeURIComponent(companyId)}/owner-documents`, {
      method: 'POST',
      body: { kind: 'business_plan', text: plan },
    });
  }
  S.bootstrapAutoStart = true;
  S.bootstrapActionError = null;
  await boot(companyId, 'research');
}


const PLAN_FILE_MAX_BYTES = 500 * 1024 * 1024;
const PLAN_CLIENT_EXTRACT_MAX_BYTES = 2 * 1024 * 1024;
const PLAN_FILE_ACCEPT = '.txt,.md,.pdf,.ppt,.pptx,text/plain,text/markdown,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation';

function formatPlanFileSize(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  if (bytes >= 1024) return `${Math.max(1, Math.round(bytes / 1024))}KB`;
  return `${bytes}B`;
}

function planFileNeedsMultipart(file) {
  const name = String(file?.name || '').toLowerCase();
  return name.endsWith('.pdf') || name.endsWith('.ppt') || name.endsWith('.pptx') || Number(file?.size || 0) > PLAN_CLIENT_EXTRACT_MAX_BYTES;
}

async function readBusinessPlanFile(file) {
  const name = String(file?.name || '').toLowerCase();
  if (name.endsWith('.pdf') || name.endsWith('.ppt') || name.endsWith('.pptx')) {
    throw new Error('该文件由服务器抽取，请直接提交，不要在浏览器读取');
  }
  if (name.endsWith('.txt') || name.endsWith('.md')) return file.text();
  throw new Error('仅支持 .txt、.md、.pdf、.ppt 或 .pptx');
}

async function bindPlanFileInput(input, textarea, statusEl) {
  if (!input) return;
  input.onchange = async () => {
    const file = input.files && input.files[0];
    if (!file) return;
    try {
      if (file.size > PLAN_FILE_MAX_BYTES) throw new Error('单文件最大 500MB');
      if (planFileNeedsMultipart(file)) {
        input._ownerUpload = file;
        if (textarea) textarea.value = '';
        setMessage(statusEl, `已收到，服务器抽取中。${file.name}（${formatPlanFileSize(file.size)}）只走服务器，不在浏览器读取。`, 'info');
        return;
      }
      input._ownerUpload = null;
      if (textarea) textarea.value = await readBusinessPlanFile(file);
      setMessage(statusEl, '已读取计划书文本，可再编辑后提交。', 'ok');
    } catch (error) {
      input.value = '';
      input._ownerUpload = null;
      setMessage(statusEl, error.message || '无法读取该文件，请另存为 pptx 或粘贴全文');
    }
  };
}

function companyModal() {
  const d = document.createElement('div'); d.className = 'modal';
  d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-labelledby', 'company-modal-title');
  d.innerHTML = `<div class="box"><h3 id="company-modal-title">新建企业档案</h3>
    <label class="f" for="cn">企业名称 *</label><input class="f" id="cn" autocomplete="organization" required maxlength="200" placeholder="例：华越精密制造有限公司">
    <label class="f" for="cnplan">商业计划书（可选）</label>
    <textarea class="f company-plan-text" id="cnplan" rows="8" maxlength="1500000" placeholder="粘贴商业计划书全文"></textarea>
    <label class="f" for="cnplanfile">上传 .txt / .md / .pdf / .ppt / .pptx（单文件最大 500MB）</label>
    <input class="f" id="cnplanfile" type="file" accept=".txt,.md,.pdf,.ppt,.pptx,text/plain,text/markdown,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation">
    <p class="research-create-note">有计划书则按十大工作台拆栏规划；没有则仍只采公开资料。计划书未确认前不写入企业事实库。单文件最大 500MB；ppt/pptx 和大文件由服务端抽取，不经过文本框。</p>
    <div class="row2"><button class="btn" type="button" id="save">创建并生成经营底稿</button>
      <button class="btn btn-g" type="button" id="cancel" style="width:110px;margin-top:20px">取消</button></div>
    <div id="cm" aria-live="polite"></div></div>`;
  const close = mountModal(d, '#cn');
  const planFile = d.querySelector('#cnplanfile');
  bindPlanFileInput(planFile, d.querySelector('#cnplan'), d.querySelector('#cm'));
  d.querySelector('#cancel').onclick = close;
  d.querySelector('#save').onclick = async () => {
    const b = d.querySelector('#save'); if (b.disabled) return;
    const name = String(d.querySelector('#cn').value || '').trim();
    if (!name) { setMessage(d.querySelector('#cm'), '请输入企业完整名称。'); d.querySelector('#cn').focus(); return; }
    const plan = String(d.querySelector('#cnplan')?.value || '').trim();
    const upload = planFile && planFile._ownerUpload;
    b.disabled = true; b.textContent = upload ? '已收到，服务器抽取中' : '创建中…';
    try {
      await createCompanyAndBootstrap(name, plan, upload);
      close();
    } catch (e) {
      if (e.status !== 401) { setMessage(d.querySelector('#cm'), e.message); b.disabled = false; b.textContent = '创建并生成经营底稿'; }
    }
  };
}

/* ───────── 看板 ───────── */
let filt = 'all';

function moduleName(no) {
  return ((S.meta?.modules || []).find(x => x.no === no) || {}).name || '';
}

function statusText(status) { return (ST[status] || ST.run)[2]; }

function pledgeRowsHtml(rows, { ro = false, printable = false } = {}) {
  if (!rows.length) return '<tr><td colspan="8" class="table-empty">当前筛选下没有承诺</td></tr>';
  return rows.map(p => {
    const [c, k, t] = ST[p.status] || ST.run;
    const mn = moduleName(p.module_no);
    const control = printable
      ? `<span aria-hidden="true">${p.done ? '✓' : '—'}</span>`
      : ro
        ? `<span class="ck ck-readonly ${p.done ? 'done' : ''}" role="img" aria-label="${p.done ? '已完成' : '未完成，仅企业主可修改'}"></span>`
        : `<button type="button" class="ck ${p.done ? 'done' : ''}" data-id="${esc(p.id)}" data-done="${p.done ? 1 : 0}" aria-pressed="${p.done ? 'true' : 'false'}" aria-label="${esc(`${p.title}：标记为${p.done ? '未完成' : '已完成'}`)}"></button>`;
    return `<tr class="${p.done ? 'done' : ''}">
      <td>${control}</td>
      <td><b>${esc(p.title)}</b><span class="mod">${esc(p.module_no)} ${esc(mn)}</span></td>
      <td style="color:var(--ink2)">${esc(p.standard)}</td>
      <td><span class="who"><span class="av">${esc((p.owner_name || '?')[0])}</span>${esc(p.owner_name)}</span></td>
      <td class="n">${esc(p.due_date)}</td><td class="n">￥${esc((Number(p.amount) || 0).toLocaleString())}</td>
      <td><span class="st ${esc(c)}"><span class="k">${esc(k)}</span>${esc(t)}</span></td>
      ${printable || ro ? '' : `<td class="row-actions"><button type="button" class="icon-btn" data-edit="${esc(p.id)}" aria-label="编辑承诺：${esc(p.title)}">编辑</button><button type="button" class="icon-btn danger" data-del="${esc(p.id)}" aria-label="删除承诺：${esc(p.title)}">删除</button></td>`}
    </tr>`;
  }).join('');
}

function csvCell(value) {
  let text = String(value ?? '');
  let first = 0;
  while (first < text.length) {
    const code = text.charCodeAt(first);
    if (code <= 31 || /\s/u.test(text[first])) first += 1;
    else break;
  }
  if ('=+-@'.includes(text[first])) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function exportBoardCsv(d) {
  const exportedAt = new Date().toLocaleString('zh-CN', { hour12: false });
  const s = d.summary;
  const lines = [
    ['企业', d.company.name],
    ['导出时间', exportedAt],
    ['统计口径', STATS_SCOPE],
    ['汇总', `承诺 ${s.total} 条；已完成 ${s.done} 条；临期 ${s.soon} 条；逾期 ${s.over} 条；兑现率 ${s.rate}%`],
    [],
    ['承诺ID', '模块编号', '模块', '核心事项', '完成标准', '责任人', '完成时间', '承诺金', '状态', '是否完成', '来源'],
    ...d.pledges.map(p => [p.id, p.module_no, moduleName(p.module_no), p.title, p.standard, p.owner_name,
      p.due_date, Number(p.amount) || 0, statusText(p.status), p.done ? '是' : '否', p.source || '']),
  ];
  const csv = `\uFEFF${lines.map(row => row.map(csvCell).join(',')).join('\r\n')}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const day = new Date().toISOString().slice(0, 10);
  const safeName = [...String(d.company.name || '企业').replace(/[\\/:*?"<>|]/g, '_')]
    .map(character => character.charCodeAt(0) <= 31 ? '_' : character).join('').slice(0, 60);
  a.href = url; a.download = `${safeName}_承诺看板_${day}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

async function openFullReport(button, status) {
  const cid = S.cid;
  const seq = S.renderSeq;
  const reportUrl = `/api/companies/${encodeURIComponent(cid)}/report/print`;
  let reportWindow = null;
  try { reportWindow = window.open('about:blank', '_blank'); } catch { /* handled as a blocked popup below */ }
  if (!reportWindow) {
    setMessage(status, '浏览器阻止了报告窗口。请允许此网站打开弹窗后重试。');
    return;
  }
  reportWindow.opener = null;
  try {
    reportWindow.document.title = '正在准备经营报告';
    reportWindow.document.body.textContent = '正在准备完整经营报告，请稍候…';
  } catch { /* the popup can still navigate even if its loading text is inaccessible */ }

  button.disabled = true;
  setMessage(status, '正在准备完整经营报告…', 'info');
  try {
    const html = await fetchDocument(reportUrl);
    if (seq !== S.renderSeq || cid !== S.cid) { reportWindow.close(); return; }
    const reportBlobUrl = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
    reportWindow.location.replace(reportBlobUrl);
    setTimeout(() => URL.revokeObjectURL(reportBlobUrl), 60_000);
    setMessage(status, '完整经营报告已在新窗口打开；请使用浏览器“打印”保存为 PDF。', 'ok');
  } catch (error) {
    try { reportWindow.close(); } catch { /* already closed by the user */ }
    if (error.status !== 401 && seq === S.renderSeq && cid === S.cid) {
      const message = error.status === 404
        ? '完整经营报告服务尚未就绪，当前无法生成 PDF，请稍后重试。'
        : `完整经营报告打开失败：${error.message || '请稍后重试'}`;
      setMessage(status, message);
    }
  } finally {
    if (document.contains(button)) button.disabled = false;
  }
}


async function downloadSequoiaPptx(button, status, fetchImpl = fetch, onSessionExpired = showSessionExpired) {
  const cid = S.cid;
  const seq = S.renderSeq;
  button.disabled = true;
  setMessage(status, '正在按红杉十页整理融资 PPT…', 'info');
  try {
    const response = await fetchImpl(`/api/companies/${encodeURIComponent(cid)}/report/sequoia-pptx`, {
      method: 'GET',
      headers: { Accept: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' },
      credentials: 'same-origin',
    });
    if (!response.ok) {
      const text = await response.text();
      let payload = {};
      try { payload = text ? JSON.parse(text) : {}; } catch { payload = { error: text.slice(0, 200) }; }
      const error = new ApiError(payload.error || payload.message || `请求失败（${response.status}）`, response.status, payload.code, payload);
      if (response.status === 401) onSessionExpired();
      throw error;
    }
    const blob = await response.blob();
    if (seq !== S.renderSeq || cid !== S.cid) return;
    const company = S.companies.find(item => String(item.id) === String(cid));
    const safeName = [...String(company?.name || '企业').replace(/[\\/:*?"<>|]/g, '_')]
      .map(character => character.charCodeAt(0) <= 31 ? '_' : character).join('').slice(0, 60);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `红杉融资BP-${safeName}.pptx`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    setMessage(status, '红杉融资 PPT 已下载；缺数页已标待取数，未编造融资额。', 'ok');
  } catch (error) {
    if (error.status !== 401 && seq === S.renderSeq && cid === S.cid) {
      setMessage(status, `红杉融资 PPT 下载失败：${error.message || '请稍后重试'}`);
    }
  } finally {
    if (document.contains(button)) button.disabled = false;
  }
}

async function viewBoard(seq) {
  const d = await api(`/api/companies/${S.cid}/dashboard`);
  if (seq !== S.renderSeq) return;
  const s = d.summary, ro = d.role !== 'owner';
  S.openNotes = s.annotations_open || 0;
  const rate = Math.max(0, Math.min(100, Number(s.rate) || 0));
  const fill = rate >= 70 ? 'var(--good)' : rate >= 50 ? 'var(--warn)' : 'var(--crit)';
  const owners = [...new Set(d.pledges.map(p => p.owner_name).filter(Boolean))];
  let rows = d.pledges.filter(p => filt === 'all' ||
    (filt.startsWith('m:') ? p.module_no === filt.slice(2) : p.owner_name === filt.slice(2)));
  const ord = { over: 0, soon: 1, run: 2, done: 3 };
  rows = rows.slice().sort((a, b) => ord[a.status] - ord[b.status]);

  const html = `
  <div class="screen-board">
  <div class="board-heading"><div>
    <div class="co"><h1>${esc(d.company.name)}</h1><span>${[d.company.industry, d.company.revenue && '年营收 ' + d.company.revenue, d.company.employees && '员工 ' + d.company.employees + ' 人'].filter(Boolean).map(esc).join(' · ')}</span></div>
    <div class="sub">承诺看板${ro ? ' · 顾问只读视图' : ''}</div>
  </div><div class="board-tools" aria-label="看板导出操作">
    <button class="btn btn-g" type="button" id="researchboard">AI 企业建档</button>
    <button class="btn btn-g" type="button" id="exportcsv">导出 CSV</button>
    <button class="btn btn-g" type="button" id="printboard">完整报告 / 保存 PDF</button>
    <button class="btn" type="button" id="exportsequoia">导出红杉融资BP</button>
  </div></div>
  <div id="boardactionstatus" class="action-status" aria-live="polite"></div>

  ${s.total === 0 ? `<div class="ph" style="padding:56px 20px">还没有任何承诺<br>
    <span style="font-size:12px">去「十部工作台」选一个模块，填写现状并生成</span><br>
    <button class="btn btn-g" type="button" id="tow" style="margin-top:18px">前往工作台 →</button></div>` : `
  <div class="hero">
    <div class="card">
      <div class="hero-lbl">承诺兑现率</div>
      <div class="hero-num">${esc(rate)}%</div>
      <div class="meter"><div class="meter-t" style="background:rgba(255,255,255,.09)"></div>
        <div class="meter-f" style="width:${esc(rate)}%;background:${fill}"></div></div>
      <div class="hero-note">${esc(s.done)} / ${esc(s.total)} 条承诺已兑现</div>
      <div style="margin-top:20px;border-top:1px solid var(--border);padding-top:15px;display:grid;gap:9px">
        ${[['已诊断模块', `${s.modules_diagnosed} / 10`], ['承诺金总额', `￥${s.amount_total.toLocaleString()}`],
           ['涉及责任人', `${s.owners.length} 人`]].map(r =>
          `<div style="display:flex;justify-content:space-between;font-size:12px">
            <span style="color:var(--muted)">${esc(r[0])}</span>
            <span style="color:var(--ink2);font-variant-numeric:tabular-nums">${esc(r[1])}</span></div>`).join('')}
      </div>
    </div>
    <div class="card"><h3>系统预警\u3000<span class="rulechip">字段级校验 · 3 条规则</span></h3>
      ${s.annotations_open ? `<div class="alert a-note"><div class="ic">✎</div><div>
          <div class="tt">顾问批注待处理</div><div class="bb">有 ${esc(s.annotations_open)} 条批注尚未标记为已处理
          <button type="button" class="link-btn lnk" id="tonotes">去查看 →</button></div></div></div>` : ''}
      ${d.alerts.length ? d.alerts.map(a => `
        <div class="alert ${a.level === 'critical' ? 'a-crit' : 'a-warn'}">
          <div class="ic">!</div><div><div class="tt">${esc(a.title)}</div>
          <div class="bb">${esc(a.detail)}</div></div></div>`).join('') : `
        <div class="alert a-warn" style="background:rgba(12,163,12,.08);border-color:rgba(12,163,12,.3)">
          <div class="ic" style="color:var(--good)">✓</div><div>
          <div class="tt" style="color:var(--good)">三条规则全部通过</div>
          <div class="bb">责任人负载均衡、截止日无堆积、每个错点都有承诺对应</div></div></div>`}
    </div>
  </div>

  <div class="tiles" style="margin-bottom:14px">
    <div class="tile"><div class="l">承诺总数</div><div class="v">${esc(s.total)}</div><div class="d">来自 ${esc(s.modules_covered)} 个模块</div></div>
    <div class="tile"><div class="l">已完成</div><div class="v" style="color:var(--good)">${esc(s.done)}</div><div class="d">✓ 已兑现</div></div>
    <div class="tile"><div class="l">临期预警</div><div class="v" style="color:var(--warn)">${esc(s.soon)}</div><div class="d">! 14天内到期</div></div>
    <div class="tile"><div class="l">已逾期</div><div class="v" style="color:var(--crit)">${esc(s.over)}</div><div class="d">✕ 需立即处理</div></div>
  </div>

  <div class="card" style="margin-bottom:14px"><h3>分模块兑现情况</h3>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:15px 22px">
    ${d.by_module.map(m => {
      if (!m.total) return `<div><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:5px">
        <span style="color:var(--muted)">${esc(m.no)} ${esc(m.name)}</span>
        <span style="font-size:11px;color:${m.diagnosed ? 'var(--crit)' : 'var(--muted)'}">${m.diagnosed ? '无承诺' : '未诊断'}</span></div>
        <div class="meter" style="height:5px;margin:0"><div class="meter-t" style="background:${m.diagnosed ? 'rgba(208,59,59,.22)' : 'rgba(255,255,255,.06)'}"></div></div></div>`;
      const r = Math.round(m.done / m.total * 100);
      const c = r >= 70 ? 'var(--good)' : r >= 50 ? 'var(--warn)' : 'var(--crit)';
      return `<div><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:5px">
        <span style="color:var(--ink2)">${esc(m.no)} ${esc(m.name)}${m.notes ? ` <span class="nb">✎${esc(m.notes)}</span>` : ''}</span>
        <span style="font-variant-numeric:tabular-nums;color:var(--muted)">${esc(m.done)}/${esc(m.total)}</span></div>
        <div class="meter" style="height:5px;margin:0"><div class="meter-t" style="background:rgba(255,255,255,.08)"></div>
        <div class="meter-f" style="width:${r}%;background:${c}"></div></div></div>`; }).join('')}
    </div></div>

  <div class="card"><h3>承诺明细</h3>
    <div class="filters">
      <button type="button" class="chip ${filt === 'all' ? 'on' : ''}" data-f="all" aria-pressed="${filt === 'all'}">全部</button>
      ${d.by_module.filter(m => m.total).map(m =>
        `<button type="button" class="chip ${filt === 'm:' + m.no ? 'on' : ''}" data-f="m:${esc(m.no)}" aria-pressed="${filt === 'm:' + m.no}">${esc(m.no)} ${esc(m.name)}</button>`).join('')}
      ${owners.length ? '<span style="width:1px;height:18px;background:var(--border2);margin:0 4px"></span>' : ''}
      ${owners.map(w => `<button type="button" class="chip ${filt === 'w:' + w ? 'on' : ''}" data-f="w:${esc(w)}" aria-pressed="${filt === 'w:' + w}">${esc(w)}</button>`).join('')}
    </div>
    <div class="table-scroll" tabindex="0" role="region" aria-label="承诺明细，可横向滚动"><table class="pledge-table"><thead><tr>
      <th style="width:34px"></th><th>核心事项</th><th>完成标准</th><th style="width:88px">责任人</th>
      <th style="width:98px">完成时间</th><th style="width:82px">承诺金</th><th style="width:96px">状态</th>
      ${ro ? '' : '<th style="width:128px">操作</th>'}
    </tr></thead><tbody>
    ${pledgeRowsHtml(rows, { ro })}
    </tbody></table></div>
    <div class="legend"><span>✓ 已完成</span><span>! 临期预警</span><span>✕ 已逾期</span><span>○ 进行中</span>
      <span style="margin-left:auto">承诺金为自愿设定，逾期仅提醒与公示，不做任何扣款</span></div>
  </div>`}</div>`;

  root().innerHTML = shell(html); bindShell();
  $('#researchboard').onclick = () => go('research');
  $('#exportcsv').onclick = () => {
    exportBoardCsv(d);
    $('#boardactionstatus').textContent = `已导出 ${d.pledges.length} 条承诺（不受当前筛选影响）`;
  };
  $('#printboard').onclick = () => openFullReport($('#printboard'), $('#boardactionstatus'));
  const exportSequoia = $('#exportsequoia'); if (exportSequoia) exportSequoia.onclick = () => downloadSequoiaPptx(exportSequoia, $('#boardactionstatus'));
  const tw = $('#tow'); if (tw) tw.onclick = () => go('wbs');
  const tn = $('#tonotes'); if (tn) tn.onclick = () => go('members');
  root().querySelectorAll('.chip').forEach(c => c.onclick = () => { filt = c.dataset.f; render(); });
  if (!ro) {
    root().querySelectorAll('.ck').forEach(c => c.onclick = async () => {
      c.disabled = true;
      try {
        await api(`/api/companies/${S.cid}/pledges/${c.dataset.id}`,
          { method: 'PATCH', body: { done: c.dataset.done !== '1' } });
        await render();
      } catch (e) { if (e.status !== 401) { c.disabled = false; setMessage($('#boardactionstatus'), e.message); } }
    });
    root().querySelectorAll('[data-edit]').forEach(x => x.onclick = () => {
      const pledge = d.pledges.find(p => String(p.id) === x.dataset.edit);
      if (pledge) pledgeModal(pledge.module_no, pledge);
    });
    root().querySelectorAll('[data-del]').forEach(x => x.onclick = async () => {
      if (!confirm('删除这条承诺？')) return;
      x.disabled = true;
      try {
        await api(`/api/companies/${S.cid}/pledges/${x.dataset.del}`, { method: 'DELETE' });
        await render();
      } catch (e) { if (e.status !== 401) { x.disabled = false; setMessage($('#boardactionstatus'), e.message); } }
    });
  }
}

/* ───────── 公司级 AI 经营建档 ───────── */
const BOOTSTRAP_STAGE_ORDER = [
  'created', 'researching', 'entity_review', 'fact_review', 'facts_committed',
  'drafting', 'draft_review', 'completed',
];
const BOOTSTRAP_TERMINAL_STATUSES = new Set([
  'needs_entity_confirmation', 'applied', 'partial', 'failed', 'cost_uncertain',
]);
const BOOTSTRAP_MODULE_NAMES = [
  '战略设计', '价值创造', '产品战略', '组织发展', '预算管理',
  '营销管理', '用户经营', '绩效管理', '财务管理', '资本管理',
];

function normalizeBootstrapEvidenceRecord(fact, fallbackClass = '') {
  return {
    id: fact?.id, fact_key: String(fact?.fact_key || ''), label: String(fact?.label || fact?.fact_key || '公开资料'),
    value: String(fact?.value || ''), period: String(fact?.period || ''), unit: String(fact?.unit || ''),
    confidence: normalizeConfidence(fact?.confidence), status: String(fact?.status || 'candidate'),
    evidence_class: String(fact?.evidence_class || fallbackClass),
    evidence: Array.isArray(fact?.evidence) ? fact.evidence : [],
    target_bindings: Array.isArray(fact?.target_bindings) ? fact.target_bindings : [],
    reason: String(fact?.reason || ''),
  };
}

function normalizeBootstrapReviewIds(values) {
  return [...new Set((Array.isArray(values) ? values : []).map(value => String(value)).filter(Boolean))];
}

function normalizeBootstrapReviewPreparation(run) {
  const nested = run?.review_preparation && typeof run.review_preparation === 'object'
    ? run.review_preparation : null;
  if (!nested && run?.prepared !== true) return null;
  const raw = nested || run;
  const resultHash = String(raw.result_hash || '');
  if (!resultHash) return null;
  return {
    status: String(raw.status || 'prepared'),
    source_result_hash: String(raw.source_result_hash || ''),
    result_hash: resultHash,
    accepted_fact_ids: normalizeBootstrapReviewIds(raw.accepted_fact_ids),
    accepted_signal_ids: normalizeBootstrapReviewIds(raw.accepted_signal_ids),
    staged_company: raw.staged_company && typeof raw.staged_company === 'object' ? raw.staged_company : {},
    staged_module_inputs: raw.staged_module_inputs && typeof raw.staged_module_inputs === 'object'
      ? raw.staged_module_inputs : {},
    external_calls: nonNegativeCount(raw.external_calls),
  };
}

function normalizeBootstrapOverview(payload) {
  const source = payload && typeof payload === 'object' ? payload : {};
  if (source.run === null || (!source.id && !source.run?.id)) return null;
  const run = source.run && typeof source.run === 'object' ? { ...source, ...source.run } : source;
  const progressSource = run.progress && typeof run.progress === 'object' ? run.progress : {};
  const entitySource = run.entity && typeof run.entity === 'object' ? run.entity : {};
  const modules = Array.isArray(S.meta?.modules) ? S.meta.modules : [];
  const moduleMetaByNo = new Map(modules.map(item => [String(item?.no || item?.module_no || ''), item]));
  const rawModules = Array.isArray(run.modules) ? run.modules : [];
  const rawByNo = new Map(rawModules.map(item => [String(item?.module_no || item?.no || ''), item]));
  const moduleOrder = Array.from({ length: 10 }, (_, index) => {
    const no = String(index + 1).padStart(2, '0');
    const meta = moduleMetaByNo.get(no) || {};
    const raw = rawByNo.get(no) || {};
    return { no, name: String(meta.name || meta.module_name || raw.name || raw.module_name || BOOTSTRAP_MODULE_NAMES[index]) };
  });
  const normalizedModules = moduleOrder.map(module => {
    const raw = rawByNo.get(module.no) || {};
    const rawError = raw.error && typeof raw.error === 'object' ? raw.error : {};
    const rawDraft = raw.draft && typeof raw.draft === 'object' ? raw.draft : {};
    return {
      module_no: module.no,
      name: String(raw.name || raw.module_name || module.name || moduleName(module.no) || '经营模块'),
      status: String(raw.status || 'queued'),
      verified_facts: Array.isArray(raw.verified_facts) ? raw.verified_facts
        : Array.isArray(rawDraft.verified_facts) ? rawDraft.verified_facts : [],
      owner_confirmable_signals: Array.isArray(raw.owner_confirmable_signals) ? raw.owner_confirmable_signals
        : Array.isArray(rawDraft.owner_confirmable_signals) ? rawDraft.owner_confirmable_signals : [],
      owner_confirmed_operating_inputs: Array.isArray(raw.owner_confirmed_operating_inputs) ? raw.owner_confirmed_operating_inputs
        : Array.isArray(rawDraft.owner_confirmed_operating_inputs) ? rawDraft.owner_confirmed_operating_inputs : [],
      external_context_hypotheses: Array.isArray(raw.external_context_hypotheses) ? raw.external_context_hypotheses
        : Array.isArray(rawDraft.external_context_hypotheses) ? rawDraft.external_context_hypotheses : [],
      hypotheses: Array.isArray(raw.hypotheses) ? raw.hypotheses
        : Array.isArray(raw.ai_hypotheses) ? raw.ai_hypotheses
          : Array.isArray(rawDraft.ai_hypotheses) ? rawDraft.ai_hypotheses : [],
      internal_questions: Array.isArray(raw.internal_questions) ? raw.internal_questions
        : Array.isArray(raw.internal_missing) ? raw.internal_missing : [],
      next_actions: Array.isArray(raw.next_actions) ? raw.next_actions
        : Array.isArray(raw.next_step) ? raw.next_step : [],
      error_point: String(raw.error_point || rawDraft.error_point || ''),
      framework: raw.framework && typeof raw.framework === 'object' ? raw.framework
        : rawDraft.framework && typeof rawDraft.framework === 'object' ? rawDraft.framework : {},
      pledges: Array.isArray(raw.pledges) ? raw.pledges
        : Array.isArray(rawDraft.pledges) ? rawDraft.pledges : [],
      output_hash: String(raw.output_hash || ''),
      error_code: String(raw.error_code || rawError.code || ''),
      error_message: String(raw.error_message || rawError.message || ''),
      cost_uncertain: Boolean(raw.cost_uncertain || rawError.cost_uncertain) || String(raw.status || '') === 'cost_uncertain',
    };
  });
  const legacyFacts = (Array.isArray(run.facts) ? run.facts : [])
    .map(fact => normalizeBootstrapEvidenceRecord(fact, 'direct_fact'))
    .filter(fact => fact.id !== undefined && fact.id !== null);
  const explicitSignals = (Array.isArray(run.public_signals) ? run.public_signals : [])
    .map(fact => normalizeBootstrapEvidenceRecord(fact, 'public_signal'))
    .filter(fact => fact.id !== undefined && fact.id !== null);
  const facts = legacyFacts.filter(fact => !bootstrapFactIsPublicSignal(fact));
  const signalIndex = new Map();
  for (const signal of [...explicitSignals, ...legacyFacts.filter(bootstrapFactIsPublicSignal)]) {
    const key = `${String(signal.id)}\u0000${signal.fact_key}\u0000${signal.value}`;
    if (!signalIndex.has(key)) signalIndex.set(key, { ...signal, evidence_class: 'public_signal' });
  }
  const reviewPreparation = normalizeBootstrapReviewPreparation(run);
  return {
    id: String(run.id),
    status: String(run.status || 'created'),
    stage: String(run.stage || 'created'),
    progress: {
      completed_steps: nonNegativeCount(progressSource.completed_steps),
      total_steps: nonNegativeCount(progressSource.total_steps),
      source_count: nonNegativeCount(progressSource.source_count),
      fact_count: nonNegativeCount(progressSource.fact_count),
      draft_count: nonNegativeCount(progressSource.draft_count),
    },
    entity: {
      status: entitySource.status == null ? null : String(entitySource.status),
      name: String(entitySource.name || ''),
      confidence: entitySource.confidence == null ? null : normalizeConfidence(entitySource.confidence),
      candidates: Array.isArray(entitySource.candidates) ? entitySource.candidates.map(candidate => ({
        id: String(candidate?.id || candidate?.candidate_id || ''),
        name: String(candidate?.name || candidate?.entity_name || ''),
        reason: String(candidate?.reason || ''), confidence: normalizeConfidence(candidate?.confidence),
        identifiers: candidate?.identifiers && typeof candidate.identifiers === 'object' ? candidate.identifiers : {},
        source_keys: Array.isArray(candidate?.source_keys) ? candidate.source_keys.map(String) : [],
      })).filter(candidate => candidate.id) : [],
    },
    topic_steps: Array.isArray(run.topic_steps) ? run.topic_steps.map(step => ({
      key: String(step?.key || step?.step_key || step?.topic_key || ''),
      label: String(step?.label || ''), status: String(step?.status || 'queued'),
      source_count: nonNegativeCount(step?.source_count), error_code: String(step?.error_code || ''),
      error_message: String(step?.error_message || ''), cost_uncertain: Boolean(step?.cost_uncertain),
    })).filter(step => step.key) : [],
    sources: Array.isArray(run.sources) ? run.sources : [],
    facts,
    public_signals: [...signalIndex.values()],
    modules: normalizedModules,
    result_hash: String(run.result_hash || ''),
    restart_allowed: Boolean(run.restart_allowed),
    reprocess_available: run.reprocess_available === true,
    revision_available: run.revision_available === true || run.repair_revision_available === true,
    official_supplement_available: run.official_supplement_available === true,
    owner_safe_path: run.owner_safe_path && typeof run.owner_safe_path === 'object' ? run.owner_safe_path : null,
    review_preparation: reviewPreparation,
    prepared: Boolean(reviewPreparation),
    accepted_fact_ids: reviewPreparation?.accepted_fact_ids || normalizeBootstrapReviewIds(run.accepted_fact_ids),
    accepted_signal_ids: reviewPreparation?.accepted_signal_ids || normalizeBootstrapReviewIds(run.accepted_signal_ids),
    error: run.error && typeof run.error === 'object' ? run.error : {
      code: String(run.error_code || ''), message: String(run.error_message || ''),
    },
  };
}

function bootstrapStageIndex(stage) {
  const index = BOOTSTRAP_STAGE_ORDER.indexOf(String(stage || ''));
  return index < 0 ? 0 : index;
}

function bootstrapEffectiveStageIndex(data) {
  let index = bootstrapStageIndex(data?.stage);
  const modules = Array.isArray(data?.modules) ? data.modules : [];
  const moduleStatuses = modules.map(module => String(module.status || ''));
  const hasModuleWork = nonNegativeCount(data?.progress?.draft_count) > 0 || modules.some(module =>
    Boolean(module.output_hash || module.error_point || Object.keys(module.framework || {}).length) ||
    ['running', 'draft_ready', 'ready_for_review', 'ready', 'generated', 'approved', 'rejected', 'stale', 'failed', 'cost_uncertain']
      .includes(String(module.status || '')));
  if ((data?.topic_steps || []).some(step => step.status !== 'queued') || nonNegativeCount(data?.progress?.source_count) > 0) {
    index = Math.max(index, bootstrapStageIndex('researching'));
  }
  if (data?.entity?.status === 'matched') index = Math.max(index, bootstrapStageIndex('entity_review'));
  if ((data?.facts || []).length || (data?.public_signals || []).length || nonNegativeCount(data?.progress?.fact_count) > 0) {
    index = Math.max(index, bootstrapStageIndex('fact_review'));
  }
  if (hasModuleWork) index = Math.max(index, bootstrapStageIndex('drafting'));
  if (data?.stage === 'draft_review' || (data?.status === 'ready_for_review' &&
    moduleStatuses.some(status => ['draft_ready', 'ready_for_review', 'ready', 'generated', 'approved'].includes(status)))) {
    index = Math.max(index, bootstrapStageIndex('draft_review'));
  }
  if (data?.status === 'applied' || data?.stage === 'completed') index = bootstrapStageIndex('completed');
  return index;
}

function bootstrapFinalReviewReady(data) {
  return data?.status === 'ready_for_review' &&
    (data?.stage === 'draft_review' || bootstrapEffectiveStageIndex(data) >= bootstrapStageIndex('draft_review'));
}

function bootstrapStatusLabel(status, stage = '') {
  if (status === 'ready_for_review' && stage !== 'draft_review') return '正在整理公司事实';
  return ({
    created: '准备开始', running: '正在构建', needs_entity_confirmation: '需要确认企业主体',
    ready_for_review: '等待统一审核', applied: '已进入正式系统', partial: '部分成果待处理',
    failed: '本次构建未完成', cost_uncertain: '调用状态待核查',
  })[String(status || '')] || '正在处理';
}

function bootstrapStepStatusLabel(status) {
  return ({ queued: '等待', running: '进行中', review_required: '待确认', succeeded: '已完成',
    partial: '部分完成', failed: '失败', cost_uncertain: '待核查' })[String(status || '')] || '等待';
}

function bootstrapFactModuleNos(fact) {
  const moduleNos = new Set();
  for (const binding of fact?.target_bindings || []) {
    const value = typeof binding === 'string'
      ? binding
      : String(binding?.target_key || binding?.key || binding?.module_no || '');
    const match = /(?:^|[^0-9])(\d{2})(?:[.:/]|$)/.exec(value);
    if (match) moduleNos.add(match[1]);
  }
  return [...moduleNos];
}

function bootstrapFactSafe(fact) {
  return !bootstrapFactIsPublicSignal(fact) && ['candidate', 'accepted'].includes(fact?.status) && fact?.confidence >= 80 &&
    Array.isArray(fact?.evidence) && fact.evidence.length > 0;
}

function bootstrapFactIsPublicSignal(fact) {
  return String(fact?.evidence_class || '') === 'public_signal' || normalizeConfidence(fact?.confidence) < 80;
}

function bootstrapSignalSafe(signal) {
  return bootstrapFactIsPublicSignal(signal) && signal?.status === 'candidate' &&
    Array.isArray(signal?.evidence) && signal.evidence.length > 0 &&
    Array.isArray(signal?.target_bindings) && signal.target_bindings.length > 0;
}

function bootstrapBindingLabel(binding) {
  const targetType = String(binding?.target_type || '');
  const targetKey = String(binding?.target_key || '');
  if (targetType === 'company') return ({
    industry: '企业概况 · 行业', revenue: '企业概况 · 年营收', employees: '企业概况 · 员工人数',
  })[targetKey] || `企业概况 · ${targetKey || '未命名字段'}`;
  const match = /^(\d{2})[.:/](.+)$/.exec(targetKey);
  if (!match) return targetKey || '经营输入';
  const businessModule = (S.meta?.modules || []).find(item => String(item.no) === match[1]);
  const field = businessModule?.fields?.find(item => String(item.key) === match[2]);
  return `${match[1]} ${businessModule?.name || moduleName(match[1]) || '经营模块'} · ${field?.label || match[2]}`;
}

function bootstrapSignalTargetLabels(signal) {
  return [...new Set((signal?.target_bindings || []).map(bootstrapBindingLabel).filter(Boolean))];
}

function bootstrapSignalTargetKeys(signal) {
  return [...new Set((signal?.target_bindings || []).map(binding =>
    `${String(binding?.target_type || '')}:${String(binding?.target_key || '')}`).filter(key => !key.endsWith(':')))];
}

function keepBootstrapSignalSelectionUnique(changed, inputs) {
  if (!changed?.checked) return;
  const targets = new Set(String(changed.dataset?.bootstrapTargetKeys || '').split(',').filter(Boolean));
  for (const input of inputs || []) {
    if (input === changed || !input.checked) continue;
    const overlaps = String(input.dataset?.bootstrapTargetKeys || '').split(',').some(key => targets.has(key));
    if (overlaps) input.checked = false;
  }
}

function selectUniqueBootstrapSignals(inputs) {
  const usedTargets = new Set();
  let count = 0;
  const ordered = [...(inputs || [])].sort((left, right) =>
    Number(right.dataset?.bootstrapConfidence || 0) - Number(left.dataset?.bootstrapConfidence || 0) ||
    Number(right.dataset?.bootstrapEvidenceCount || 0) - Number(left.dataset?.bootstrapEvidenceCount || 0));
  for (const input of inputs || []) input.checked = false;
  for (const input of ordered) {
    if (input.disabled) continue;
    const targets = String(input.dataset?.bootstrapTargetKeys || '').split(',').filter(Boolean);
    const selectable = targets.length > 0 && targets.every(key => !usedTargets.has(key));
    input.checked = selectable;
    if (!selectable) continue;
    targets.forEach(key => usedTargets.add(key)); count += 1;
  }
  return count;
}

function bootstrapModuleSignalIds(module) {
  const items = [
    ...(Array.isArray(module?.owner_confirmable_signals) ? module.owner_confirmable_signals : []),
    ...(Array.isArray(module?.owner_confirmed_operating_inputs) ? module.owner_confirmed_operating_inputs : []),
    ...(Array.isArray(module?.hypotheses) ? module.hypotheses : []),
  ];
  return [...new Set(items.flatMap(item => item && typeof item === 'object' && Array.isArray(item.signal_ids)
    ? item.signal_ids.map(String) : []).filter(Boolean))];
}

function bootstrapUniqueItems(items) {
  const seen = new Set();
  return (Array.isArray(items) ? items : []).filter(item => {
    const key = `${bootstrapItemText(item)}\u0000${JSON.stringify(item?.signal_ids || [])}\u0000${JSON.stringify(item?.source_keys || [])}`;
    if (!bootstrapItemText(item) || seen.has(key)) return false;
    seen.add(key); return true;
  });
}

function bootstrapModuleContent(module) {
  const hypotheses = Array.isArray(module?.hypotheses) ? module.hypotheses : [];
  const ownerSignals = bootstrapUniqueItems([
    ...(Array.isArray(module?.owner_confirmable_signals) ? module.owner_confirmable_signals : []),
    ...hypotheses.filter(item => item && typeof item === 'object' && item.kind === 'public_signal'),
  ]);
  const confirmedInputs = bootstrapUniqueItems(Array.isArray(module?.owner_confirmed_operating_inputs)
    ? module.owner_confirmed_operating_inputs : []);
  const externalContext = bootstrapUniqueItems([
    ...(Array.isArray(module?.external_context_hypotheses) ? module.external_context_hypotheses : []),
    ...hypotheses.filter(item => item && typeof item === 'object' && item.kind === 'external_context'),
  ]);
  const pending = bootstrapUniqueItems(hypotheses.filter(item => !item || typeof item !== 'object' ||
    !['public_signal', 'external_context', 'owner_confirmed_operating_input'].includes(String(item.kind || ''))));
  return { ownerSignals, confirmedInputs, externalContext, pending };
}

function bootstrapFactCounts(data) {
  const facts = [
    ...(Array.isArray(data?.facts) ? data.facts : []),
    ...(Array.isArray(data?.public_signals) ? data.public_signals : []),
  ];
  return {
    direct: facts.filter(fact => !bootstrapFactIsPublicSignal(fact)),
    reviewableDirect: facts.filter(bootstrapFactSafe),
    signals: facts.filter(bootstrapFactIsPublicSignal),
  };
}

function bootstrapModuleReviewable(module) {
  return ['draft_ready', 'ready_for_review', 'ready', 'generated'].includes(String(module?.status || '')) &&
    Boolean(module?.output_hash) && !module?.cost_uncertain;
}

function bootstrapModuleFactIds(module, knownFacts = []) {
  const known = new Set((knownFacts || []).map(fact => String(fact?.id)));
  return [...new Set((module?.verified_facts || []).map(fact => {
    if (!fact || typeof fact !== 'object') return '';
    return String(fact.fact_id ?? fact.id ?? '');
  }).filter(id => id && (!known.size || known.has(id))))];
}

function bootstrapFiveStepStatuses(data) {
  const stageIndex = bootstrapEffectiveStageIndex(data);
  const status = String(data?.status || '');
  const moduleStatuses = (data?.modules || []).map(module => module.status);
  const topicStatuses = (data?.topic_steps || []).map(step => step.status);
  const entity = status === 'needs_entity_confirmation' ? 'review_required'
    : data?.entity?.status === 'matched' ? 'succeeded'
    : data?.stage === 'researching' ? 'running' : 'queued';
  const research = topicStatuses.some(value => value === 'cost_uncertain') ? 'cost_uncertain'
    : topicStatuses.some(value => value === 'failed') ? 'partial'
    : stageIndex > bootstrapStageIndex('researching') ? 'succeeded'
    : data?.stage === 'researching' ? 'running' : 'queued';
  const facts = stageIndex >= bootstrapStageIndex('facts_committed') ? 'succeeded'
    : data?.stage === 'fact_review' ? 'running'
    : (data?.facts || []).length && ['partial', 'failed', 'cost_uncertain'].includes(status) ? 'partial' : 'queued';
  const modules = moduleStatuses.some(value => value === 'cost_uncertain') ? 'cost_uncertain'
    : moduleStatuses.some(value => value === 'running') || data?.stage === 'drafting' ? 'running'
    : moduleStatuses.some(value => value === 'failed') ? 'partial'
    : stageIndex >= bootstrapStageIndex('draft_review') ? 'succeeded' : 'queued';
  const review = status === 'applied' ? 'succeeded'
    : bootstrapFinalReviewReady(data) ? 'review_required' : 'queued';
  return [
    ['主体核验', entity], ['资料采集', research], ['事实整理', facts], ['模块生成', modules], ['统一审核', review],
  ];
}

function bootstrapJourneyHtml(data) {
  const stageIndex = bootstrapEffectiveStageIndex(data);
  const researchTopics = (data?.topic_steps || []).filter(step => step.key !== 'identity');
  const researchDone = researchTopics.length >= 5 && researchTopics.every(step =>
    ['succeeded', 'partial'].includes(step.status));
  const applied = data?.status === 'applied';
  const definitions = [
    ['1', '输入名称', true],
    ['2', '确认主体', data?.entity?.status === 'matched'],
    ['3', '主题采集', researchDone],
    ['4', '事实库', stageIndex >= bootstrapStageIndex('fact_review')],
    ['5', '十模块底稿', stageIndex >= bootstrapStageIndex('draft_review')],
    ['6', '统一审核', applied],
    ['7', '进入正式系统', applied],
  ];
  let activeAssigned = false;
  return `<ol class="bootstrap-journey" aria-label="AI 经营建档七步主链">${definitions.map(([no, label, done]) => {
    const active = !done && !activeAssigned;
    if (active) activeAssigned = true;
    return `<li class="${done ? 'done' : active ? 'active' : ''}"${active ? ' aria-current="step"' : ''}>
      <span>${esc(no)}</span><b>${esc(label)}</b></li>`;
  }).join('')}</ol>`;
}

function bootstrapProgressHtml(data) {
  const progress = data.progress || {};
  const factCounts = bootstrapFactCounts(data);
  const total = nonNegativeCount(progress.total_steps);
  const completed = total ? Math.min(total, nonNegativeCount(progress.completed_steps)) : 0;
  const percent = total ? Math.round(completed / total * 100) : 0;
  return `<section class="card bootstrap-progress-card" aria-labelledby="bootstrap-progress-title">
    <div class="bootstrap-progress-head"><div><span>真实任务进度</span><h2 id="bootstrap-progress-title">${esc(bootstrapStatusLabel(data.status, data.stage))}</h2></div>
      <b>${total ? `${esc(completed)} / ${esc(total)}` : '准备中'}</b></div>
    <div class="bootstrap-progress-track" role="progressbar" aria-label="建档总进度" aria-valuemin="0" aria-valuemax="${esc(total || 1)}" aria-valuenow="${esc(completed)}">
      <i style="width:${esc(percent)}%"></i></div>
    <ol class="bootstrap-five-steps">${bootstrapFiveStepStatuses(data).map(([label, stepStatus]) =>
      `<li class="${esc(stepStatus)}"><i aria-hidden="true"></i><span>${esc(label)}</span><b>${esc(bootstrapStepStatusLabel(stepStatus))}</b></li>`).join('')}</ol>
    <div class="bootstrap-live-counts" aria-live="polite">
      <span><b>${esc(progress.source_count)}</b> 个公开来源</span><span><b>${esc(factCounts.reviewableDirect.length)}</b> 条可审直接事实</span>
      <span><b>${esc(factCounts.signals.length)}</b> 条公开信号·待核验</span>
      <span><b>${esc(progress.draft_count)}</b> / 10 份模块底稿</span></div>
  </section>`;
}

function bootstrapTopicStepsHtml(data) {
  if (!data.topic_steps.length) return '';
  return `<details class="card bootstrap-topics" ${data.status === 'running' ? 'open' : ''}><summary>公开资料采集明细 <span>${esc(data.topic_steps.length)} 个主题</span></summary>
    <div>${data.topic_steps.map(step => `<article class="bootstrap-topic ${esc(step.status)}"><span>${esc(step.label || step.key)}</span>
      <b>${esc(bootstrapStepStatusLabel(step.status))}</b><small>${esc(step.source_count)} 个来源</small>
      ${step.error_message ? `<p>${esc(step.error_message)}</p>` : ''}</article>`).join('')}</div></details>`;
}

function bootstrapTopicReviewNoticeHtml(data) {
  const incomplete = data.topic_steps.filter(step => !['succeeded', 'partial'].includes(step.status));
  if (incomplete.length) {
    return `<div class="msg msg-e" role="alert">仍有 ${esc(incomplete.length)} 个公开资料主题未完成，不能把当前结果视为完整采集。请先返回处理这些步骤。</div>`;
  }
  const partial = data.topic_steps.filter(step => step.status === 'partial');
  return partial.length
    ? `<div class="msg msg-i" role="status">${esc(partial.length)} 个主题仅取得部分公开资料；相应未知内容已列为内部待补，不会被冒充为企业事实。</div>`
    : '';
}

function bootstrapEvidenceSourceKeys(fact) {
  return [...new Set((fact?.evidence || []).map(evidence => String(evidence?.source_key || '')).filter(Boolean))];
}

function bootstrapFactEvidenceHtml(fact, sourceIndex) {
  const evidence = Array.isArray(fact?.evidence) ? fact.evidence : [];
  if (!evidence.length) return '<span class="bootstrap-no-evidence">暂无可回链的证据摘录</span>';
  return `<details class="bootstrap-fact-evidence"><summary>查看 ${esc(evidence.length)} 条证据摘录（请打开来源核对）</summary><div>${evidence.map(item => {
    const key = String(item?.source_key || '');
    const index = sourceIndex.get(key);
    const quote = String(item?.quote || item?.exact_quote || item?.excerpt || '');
    return `<blockquote>${quote ? esc(quote) : '来源已记录，暂无可展示摘录。'}
      <cite>${index === undefined ? esc(key || '公开来源') : `<a href="#bootstrap-source-${index}">${esc(key)}</a>`}</cite></blockquote>`;
  }).join('')}</div></details>`;
}

function bootstrapFactValueHtml(fact) {
  const value = String(fact?.value || '');
  const unit = String(fact?.unit || '').trim();
  const period = String(fact?.period || '').trim();
  const compactValue = value.normalize('NFKC').replace(/\s+/g, '').toLocaleLowerCase();
  const alreadyContains = extra => compactValue.includes(extra.normalize('NFKC').replace(/\s+/g, '').toLocaleLowerCase());
  return `${esc(value)}${unit && !alreadyContains(unit) ? ` ${esc(unit)}` : ''}${period && !alreadyContains(period) ? `<small>${esc(period)}</small>` : ''}`;
}

function bootstrapFactsHtml(data, { review = false, readOnly = false } = {}) {
  const sourceIndex = new Map(data.sources.map((source, index) => [String(source.source_key), index]));
  const factCounts = bootstrapFactCounts(data);
  const facts = [...factCounts.direct, ...factCounts.signals];
  const applied = data.status === 'applied';
  const preparedFactIds = new Set((data.review_preparation?.accepted_fact_ids || []).map(String));
  const acceptedSignalIds = new Set((data.accepted_signal_ids || []).map(String));
  const preparedReview = review && Boolean(data.review_preparation);
  const selectableSignalCount = factCounts.signals.filter(bootstrapSignalSafe).length;
  const factLibraryTitle = applied ? '已确认公司事实库' : '公开资料分层库 · 待统一审核';
  if (!facts.length) return `<section class="card bootstrap-facts"><h2>${factLibraryTitle}</h2><p class="bootstrap-empty-copy">暂未形成可审直接事实或可追溯公开信号；系统不会用缺失信息冒充企业事实。</p></section>`;
  const factCards = records => records.map(fact => {
    const signal = bootstrapFactIsPublicSignal(fact);
    const safe = bootstrapFactSafe(fact);
    const selectable = review && (signal ? bootstrapSignalSafe(fact) : fact.status === 'candidate' && safe);
    const acceptedSignal = signal && (fact.status === 'accepted' || acceptedSignalIds.has(String(fact.id)));
    const checked = signal
      ? acceptedSignal
      : fact.status === 'accepted' || (preparedReview ? preparedFactIds.has(String(fact.id)) : selectable);
    const modules = bootstrapFactModuleNos(fact);
    const evidenceKeys = bootstrapEvidenceSourceKeys(fact);
    const targets = bootstrapSignalTargetLabels(fact);
    const targetKeys = bootstrapSignalTargetKeys(fact);
    return `<article class="bootstrap-fact ${esc(fact.status)}${signal ? ' public-signal' : ' direct-fact'}">
      ${review ? `<input type="checkbox" ${signal ? `data-bootstrap-signal-id="${esc(fact.id)}"` : `data-bootstrap-fact-id="${esc(fact.id)}"`} data-bootstrap-review-control
        ${signal ? `data-bootstrap-target-keys="${esc(targetKeys.join(','))}" data-bootstrap-confidence="${esc(fact.confidence)}" data-bootstrap-evidence-count="${esc((fact.evidence || []).length)}"` : ''}
        aria-label="${esc(signal ? `确认写入经营资料：${fact.label}` : `采纳事实：${fact.label}`)}" ${checked ? 'checked' : ''} ${readOnly || !selectable ? 'disabled' : ''}>` : ''}
      <div><div class="bootstrap-fact-head"><span class="bootstrap-fact-status">${esc(signal
        ? acceptedSignal ? '企业主已确认写入经营资料 · 不进入事实库' : '公开资料建议 · 可确认写入经营资料'
        : applied && fact.status === 'accepted' ? '已确认事实' : ({ accepted: '公开证据支持 · 待确认', rejected: '本次未采用', superseded: '已有更新', disputed: '来源值冲突 · 需先消歧', candidate: '公开证据支持 · 待确认' })[fact.status] || fact.status)}</span>
        <h3>${esc(fact.label)}</h3><b>置信度 ${esc(fact.confidence)}%</b></div>
        <p class="bootstrap-fact-value">${bootstrapFactValueHtml(fact)}</p>
        ${fact.reason ? `<p class="bootstrap-fact-reason">${esc(fact.reason)}</p>` : ''}
        ${signal && targets.length ? `<p class="bootstrap-signal-target"><b>确认后写入</b>${targets.map(target => `<span>${esc(target)}</span>`).join('')}</p>` : ''}
        <div class="bootstrap-fact-meta">${modules.length ? `<span>${signal ? '可确认写入' : '供'} ${modules.map(esc).join('、')} 模块${signal ? '经营输入，不进入事实库' : '使用'}</span>` : `<span>${signal ? '可确认写入企业概况，不进入事实库' : '企业概况事实'}</span>`}
          ${evidenceKeys.map(key => {
            const index = sourceIndex.get(key);
            return index === undefined ? `<span>${esc(key)}</span>` : `<a href="#bootstrap-source-${index}">${esc(key)}</a>`;
          }).join('')}</div>${bootstrapFactEvidenceHtml(fact, sourceIndex)}</div></article>`;
  }).join('');
  return `<section class="card bootstrap-facts" aria-labelledby="bootstrap-facts-title">
    <div class="bootstrap-section-head"><div><span>${applied ? '正式事实与待核验信号严格分层' : '统一审核前先区分证据强度'}</span><h2 id="bootstrap-facts-title">${factLibraryTitle}</h2>
      <p>${applied ? '直接事实进入事实库；企业主确认的公开资料建议只写入指定经营输入，并始终保留来源。' : '直接事实与公开资料建议分开审核。建议只有在企业主明确勾选后才写入指定经营输入，不会自动升级为公司事实。'}</p></div>
      <b>${esc(applied ? factCounts.direct.filter(fact => fact.status === 'accepted').length : factCounts.reviewableDirect.length)} 条直接事实 · ${esc(factCounts.signals.length)} 条资料建议</b></div>
    <div class="bootstrap-evidence-groups">
      <section class="bootstrap-evidence-group direct"><h3>直接事实候选 <span>${esc(factCounts.direct.length)}</span></h3>
        <p>只有置信度不低于 80%、带证据摘录的 candidate 事实可勾选。</p>
        <div class="bootstrap-fact-list">${factCards(factCounts.direct) || '<p class="bootstrap-empty-copy">暂无可审直接事实。</p>'}</div></section>
      <section class="bootstrap-evidence-group signals"><div class="bootstrap-signal-group-head"><div><h3>公开资料建议 · 企业主决定是否采用 <span>${esc(factCounts.signals.length)}</span></h3>
        <p>每条建议都标明写入位置。勾选只代表把它作为经营输入采用，不代表公开来源已被升级为公司事实。</p></div>
        ${review && !readOnly && selectableSignalCount ? '<button class="btn btn-g" type="button" id="bootstrapselectsignals">按字段选择证据最充分的建议</button>' : ''}</div>
        <div class="bootstrap-fact-list">${factCards(factCounts.signals) || '<p class="bootstrap-empty-copy">当前没有待核验公开信号。</p>'}</div></section>
    </div></section>`;
}

function bootstrapItemText(item) {
  if (typeof item === 'string') return item;
  if (!item || typeof item !== 'object') return '';
  if (item.label && item.value && String(item.label) !== String(item.value)) return `${item.label}：${item.value}`;
  return String(item.text || item.question || item.action || item.title || item.value || item.label || item.fact || '');
}

function bootstrapModuleListHtml(items, emptyText) {
  const values = (Array.isArray(items) ? items : []).map(item => {
    const text = bootstrapItemText(item);
    if (!text) return '';
    const detail = item && typeof item === 'object'
      ? String(item.why_needed || item.reason || item.standard || item.note || '') : '';
    const action = item && typeof item === 'object' ? String(item.collection_action || '') : '';
    const sourceKeys = item && typeof item === 'object' && Array.isArray(item.source_keys)
      ? [...new Set(item.source_keys.map(String).filter(Boolean))] : [];
    return `<li><span>${esc(text)}</span>${detail && detail !== text ? `<small>${esc(detail)}</small>` : ''}${action ? `<small>${esc(action)}</small>` : ''}
      ${sourceKeys.length ? `<small>证据来源 ${sourceKeys.map(esc).join('、')} · 待企业核验</small>` : ''}</li>`;
  }).filter(Boolean);
  return values.length ? `<ul>${values.join('')}</ul>` : `<p>${esc(emptyText)}</p>`;
}

function bootstrapQuestionStatus(item) {
  const status = String(item?.status || item?.evidence_status || '').trim();
  const fieldKey = String(item?.field_key || item?.key || '').trim();
  if (status === 'not_publicly_observable') {
    if (fieldKey === 'star') return { className: 'owner', label: '管理层判断 · 必须由企业主确认' };
    return { className: 'internal', label: '内部经营数据 · 必须用企业内部台账补齐' };
  }
  if (status === 'unknown') return { className: 'collectable', label: '本次公开采集未取得完整口径 · 请补充核验资料' };
  if (status === 'conflict') return { className: 'conflict', label: '资料存在冲突 · 需先核对口径' };
  if (status === 'partial') return { className: 'partial', label: '仅覆盖部分口径 · 仍需补齐' };
  return null;
}

function bootstrapInternalQuestionsHtml(items, emptyText) {
  const values = (Array.isArray(items) ? items : []).map(item => {
    const text = bootstrapItemText(item);
    if (!text) return '';
    const detail = item && typeof item === 'object'
      ? String(item.why_needed || item.reason || item.standard || item.note || '') : '';
    const action = item && typeof item === 'object' ? String(item.collection_action || '') : '';
    const status = bootstrapQuestionStatus(item);
    return `<li>${status ? `<em class="bootstrap-question-kind ${esc(status.className)}">${esc(status.label)}</em>` : ''}<span>${esc(text)}</span>${detail && detail !== text ? `<small>${esc(detail)}</small>` : ''}${action && action !== text ? `<small>${esc(action)}</small>` : ''}</li>`;
  }).filter(Boolean);
  return values.length ? `<ul>${values.join('')}</ul>` : `<p>${esc(emptyText)}</p>`;
}

function bootstrapFrameworkHtml(framework) {
  const items = Object.entries(framework || {}).map(([label, value]) => ({ label, value: bootstrapItemText(value) }));
  if (!items.length) return '';
  return `<dl class="bootstrap-framework">${items.map(item => `<div><dt>${esc(item.label)}</dt><dd>${esc(item.value)}</dd></div>`).join('')}</dl>`;
}

function bootstrapPledgesHtml(pledges) {
  if (!Array.isArray(pledges) || !pledges.length) return '';
  return `<details class="bootstrap-pledges"><summary>执行承诺草案 ${esc(pledges.length)} 条</summary>${bootstrapModuleListHtml(pledges, '')}</details>`;
}

function bootstrapModuleStatusLabel(status) {
  return ({ queued: '等待生成', running: '正在生成', blocked: '需要内部资料', draft_ready: 'AI 底稿待审核',
    ready_for_review: 'AI 底稿待审核', ready: 'AI 底稿待审核', generated: 'AI 底稿待审核', approved: '已确认可执行',
    rejected: '本次未采用', stale: '资料已变化', partial: '部分完成', failed: '生成失败', cost_uncertain: '费用状态待核查' })[status] || status || '等待生成';
}

function bootstrapModulesHtml(data, { review = false, readOnly = false, showModuleCta = false } = {}) {
  const applied = data.status === 'applied';
  const defaultFactIds = new Set(data.facts.filter(fact => fact.status === 'accepted' || bootstrapFactSafe(fact)).map(fact => String(fact.id)));
  return `<section class="bootstrap-modules" aria-labelledby="bootstrap-modules-title">
    <div class="bootstrap-section-head"><div><span>十大模块完整底稿</span><h2 id="bootstrap-modules-title">事实、草案、待补、下一步，一张卡看全</h2>
      <p>“有经营资料”不代表模块已完成；只有统一确认后的底稿才进入正式系统。</p></div>
      <b>${applied ? `${esc(data.modules.filter(module => module.status === 'approved').length)} 份已确认` : `${esc(data.modules.filter(module => bootstrapModuleReviewable(module)).length)} 份待审核`}</b></div>
    <div class="bootstrap-module-grid">${data.modules.map(module => {
      const reviewable = bootstrapModuleReviewable(module);
      const requiredFactIds = bootstrapModuleFactIds(module, data.facts);
      const dependenciesMet = requiredFactIds.every(id => defaultFactIds.has(id));
      const defaultSelected = reviewable && dependenciesMet;
      const facts = module.verified_facts.map(bootstrapItemText).filter(Boolean);
      const content = bootstrapModuleContent(module);
      const moduleSignalIds = bootstrapModuleSignalIds(module);
      const acceptedSignalIds = new Set((data.accepted_signal_ids || []).map(String));
      const acceptedModuleSignals = moduleSignalIds.filter(id => acceptedSignalIds.has(id));
      const noVerifiedFactsWithHypotheses = facts.length === 0 &&
        (content.ownerSignals.length > 0 || content.confirmedInputs.length > 0 || content.externalContext.length > 0 || content.pending.length > 0);
      const hypothesisOnly = reviewable && noVerifiedFactsWithHypotheses;
      const hasPublicSignals = content.ownerSignals.length > 0 || content.confirmedInputs.length > 0;
      const moduleStateLabel = module.status === 'approved' && acceptedModuleSignals.length
        ? `底稿已采用 · ${acceptedModuleSignals.length} 条经营输入已确认`
        : module.status === 'approved' && hasPublicSignals
          ? '底稿已采用 · 公开资料建议仍待确认'
        : module.status === 'approved' && noVerifiedFactsWithHypotheses ? '资料缺口底稿已采用' : bootstrapModuleStatusLabel(module.status);
      const reviewReadyLabel = hypothesisOnly
        ? hasPublicSignals ? '采用核验底稿（经营输入建议另行勾选）' : '采用资料缺口与采集计划底稿'
        : '纳入正式系统';
      const reviewReadyWithSignalsLabel = hasPublicSignals ? '采用底稿并写入已选经营资料' : reviewReadyLabel;
      const questions = module.internal_questions.map(bootstrapItemText).filter(Boolean);
      return `<article class="bootstrap-module ${esc(module.status)}" id="bootstrap-module-${esc(module.module_no)}">
        <header><div><span>${esc(module.module_no)}</span><h3>${esc(module.name)}</h3></div>
          ${review ? `<label class="bootstrap-module-choice"><input type="checkbox" data-bootstrap-module-no="${esc(module.module_no)}"
            data-bootstrap-review-control data-bootstrap-reviewable="${reviewable ? 'true' : 'false'}" data-bootstrap-readonly="${readOnly ? 'true' : 'false'}"
            data-bootstrap-required-facts="${esc(requiredFactIds.join(','))}" data-bootstrap-ready-label="${esc(reviewReadyLabel)}"
            data-bootstrap-signal-ids="${esc(moduleSignalIds.join(','))}" data-bootstrap-ready-with-signals-label="${esc(reviewReadyWithSignalsLabel)}"
            aria-label="采纳 ${esc(module.module_no)} ${esc(module.name)} 底稿" ${defaultSelected ? 'checked' : ''}
            ${readOnly || !reviewable || !dependenciesMet ? 'disabled' : ''}><span>${reviewable ? dependenciesMet ? reviewReadyLabel : '先确认所引用事实' : moduleStateLabel}</span></label>`
            : `<span class="bootstrap-module-state">${esc(moduleStateLabel)}</span>`}</header>
        <div class="bootstrap-module-block facts"><b>${applied && module.status === 'approved' ? '已确认事实' : '公开证据支持 · 待确认'} · ${esc(facts.length)}</b>
          ${bootstrapModuleListHtml(module.verified_facts, '暂无公开事实，不会编造。')}</div>
        ${content.confirmedInputs.length ? `<div class="bootstrap-module-block confirmed-inputs"><b>企业主已确认的经营输入 · ${esc(content.confirmedInputs.length)}</b>
          ${bootstrapModuleListHtml(content.confirmedInputs, '')}<p>这些内容将按来源记录写入对应现状字段，但不会被记入公司事实库。</p></div>` : ''}
        ${content.ownerSignals.length ? `<div class="bootstrap-module-block owner-signals"><b>可确认的经营输入建议 · ${esc(content.ownerSignals.length)}</b>
          ${bootstrapModuleListHtml(content.ownerSignals, '')}<p>请在上方“公开资料建议”逐条勾选；只有企业主明确确认的建议会写入对应现状字段。</p></div>` : ''}
        ${content.externalContext.length ? `<div class="bootstrap-module-block external-context"><b>公开经营背景 · 不等于企业内部现状 · ${esc(content.externalContext.length)}</b>
          ${bootstrapModuleListHtml(content.externalContext, '')}</div>` : ''}
        <div class="bootstrap-module-block draft"><b>AI 经营草案</b>
          ${module.error_point ? `<p class="bootstrap-error-point">错点：${esc(module.error_point)}</p>` : '<p>尚未形成可审核草案。</p>'}
          ${bootstrapFrameworkHtml(module.framework)}</div>
        ${content.pending.length ? `<div class="bootstrap-module-block hypotheses"><b>待验证判断 · 不构成企业事实 · ${esc(content.pending.length)}</b>
          ${bootstrapModuleListHtml(content.pending, '')}<p class="bootstrap-hypothesis-notice">采纳底稿只表示认可这些核验方向；只有上方单独勾选的经营输入建议才会写入现状字段。</p></div>` : ''}
        <div class="bootstrap-module-block missing"><b>资料缺口与内部待补 · ${esc(questions.length)}</b>
          ${bootstrapInternalQuestionsHtml(module.internal_questions, '当前没有必须补充的问题。')}</div>
        <div class="bootstrap-module-block next"><b>下一步</b>
          ${module.next_actions.length ? bootstrapModuleListHtml(module.next_actions, '')
            : `<p>${module.status === 'failed' ? '可只重试本模块，已成功底稿不受影响。' : module.cost_uncertain ? '先核查调用状态，不会自动重试。' : '等待统一审核。'}</p>`}
          ${bootstrapPledgesHtml(module.pledges)}
          ${module.error_message ? `<p class="bootstrap-module-error">${esc(module.error_message)}</p>` : ''}
          ${!review && !readOnly && module.status === 'failed' ? `<button class="btn btn-g" type="button" data-bootstrap-retry-step="module:${esc(module.module_no)}">只重试本模块</button>` : ''}
          ${module.cost_uncertain ? '<span class="bootstrap-cost-note">费用状态待核查，不提供自动重试。</span>' : ''}
          ${showModuleCta && module.status === 'approved' ? `<button class="btn btn-g" type="button" data-bootstrap-open-module="${esc(module.module_no)}">进入模块详情</button>` : ''}</div>
      </article>`;
    }).join('')}</div></section>`;
}

function bootstrapSourcesHtml(data) {
  return `<details class="card bootstrap-sources"><summary>查看公开证据来源 <span>${esc(data.sources.length)} 条</span></summary>
    ${data.sources.length ? `<div class="research-source-list">${data.sources.map((source, index) =>
      researchSourceHtml(source, index).replace(`id="research-source-${index}"`, `id="bootstrap-source-${index}"`)).join('')}</div>`
      : '<p class="research-empty">当前没有可核验公开来源。</p>'}</details>`;
}

function bootstrapReviewSelectionText() {
  const facts = root().querySelectorAll('[data-bootstrap-fact-id]:checked').length;
  const signals = root().querySelectorAll('[data-bootstrap-signal-id]:checked').length;
  const modules = root().querySelectorAll('[data-bootstrap-module-no]:checked').length;
  return { facts, signals, modules, text: `将确认 ${facts} 条直接事实、${signals} 条经营输入建议、${modules} 份模块底稿；资料建议不进入公司事实库` };
}

function bootstrapReviewIdSetsEqual(left, right) {
  const a = normalizeBootstrapReviewIds(left).sort();
  const b = normalizeBootstrapReviewIds(right).sort();
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function bootstrapReviewActionState(data, acceptedFactIds = [], acceptedSignalIds = []) {
  const preparation = data?.review_preparation;
  const matchesPreparation = Boolean(preparation) && preparation.status === 'prepared' &&
    preparation.result_hash === data?.result_hash &&
    bootstrapReviewIdSetsEqual(preparation.accepted_fact_ids, acceptedFactIds) &&
    bootstrapReviewIdSetsEqual(preparation.accepted_signal_ids, acceptedSignalIds);
  const needsPreparation = preparation
    ? !matchesPreparation
    : normalizeBootstrapReviewIds(acceptedSignalIds).length > 0;
  return {
    action: needsPreparation ? 'prepare' : 'apply',
    matchesPreparation,
    label: needsPreparation
      ? preparation ? '按新选择重新生成可审核底稿（0 次模型）' : '按所选资料重建十大模块底稿（0 次模型）'
      : preparation ? '确认采用新版底稿并进入正式系统' : '统一确认并进入正式系统',
  };
}

function bootstrapReviewPreparationHtml(data) {
  const preparation = data?.review_preparation;
  if (preparation?.status === 'prepared' && preparation.result_hash === data.result_hash) {
    return `<div class="msg msg-s bootstrap-preparation-ready" id="bootstrappreparationstatus" role="status"><b>新版底稿已准备好：</b>系统已按你选择的 ${esc(preparation.accepted_signal_ids.length)} 条经营输入建议，0 次模型调用重建十大模块底稿。请先逐项预览，再进行第二次确认；目前仍未写入正式经营系统。</div>`;
  }
  const signalCount = (data?.public_signals || []).filter(bootstrapSignalSafe).length;
  return signalCount ? `<div class="msg msg-i bootstrap-preparation-guide" id="bootstrappreparationstatus" role="status"><b>先重建，再正式采用：</b>勾选公开资料建议后，第一次点击只会在本地确定性重建十大模块底稿，0 次模型调用、不会产生 继涛博士 费用，也不会写入正式系统。预览新版底稿后再进行第二次确认。</div>` : '';
}

function bootstrapPreparedInputPreviewHtml(data) {
  const preparation = data?.review_preparation;
  if (!preparation || preparation.result_hash !== data.result_hash) return '';
  const items = [];
  for (const [targetKey, value] of Object.entries(preparation.staged_company || {})) {
    if (!String(value || '').trim()) continue;
    items.push({ label: bootstrapBindingLabel({ target_type: 'company', target_key: targetKey }), value });
  }
  for (const [moduleNo, values] of Object.entries(preparation.staged_module_inputs || {})) {
    if (!values || typeof values !== 'object') continue;
    for (const [fieldKey, value] of Object.entries(values)) {
      if (!String(value || '').trim()) continue;
      items.push({
        label: bootstrapBindingLabel({ target_type: 'module_input', target_key: `${moduleNo}.${fieldKey}` }), value,
      });
    }
  }
  if (!items.length) return '<div class="bootstrap-prepared-inputs empty"><b>本次没有新增经营输入</b><span>新版底稿只调整核验内容，不会填入空白字段。</span></div>';
  return `<section class="bootstrap-prepared-inputs" aria-labelledby="bootstrap-prepared-inputs-title">
    <div><span>正式采用后才会写入</span><h3 id="bootstrap-prepared-inputs-title">本次拟补充的经营现状 · ${esc(items.length)} 项</h3></div>
    <ul>${items.map(item => `<li><b>${esc(item.label)}</b><span>${esc(item.value)}</span></li>`).join('')}</ul>
    <p>这些内容来自公开资料并经企业主选择；它们保留来源与审核记录，但不会被记作公司直接事实。</p></section>`;
}

function bootstrapValueSummaryHtml(data) {
  const applied = data.status === 'applied';
  const factCounts = bootstrapFactCounts(data);
  const acceptedFacts = factCounts.direct.filter(fact => fact.status === 'accepted').length;
  const acceptedSignals = new Set((data.accepted_signal_ids || []).map(String));
  const confirmableSignals = factCounts.signals.filter(bootstrapSignalSafe).length;
  const reviewableDrafts = data.modules.filter(bootstrapModuleReviewable).length;
  const approvedDrafts = data.modules.filter(module => module.status === 'approved').length;
  const missingModules = data.modules.filter(module => module.internal_questions.length > 0 || module.status === 'blocked').length;
  return `<section class="bootstrap-value" aria-label="AI 建档成果摘要">
    <div><span>公开证据</span><b>${esc(data.sources.length)}</b><small>个可核验来源</small></div>
    <div><span>${applied ? '已确认直接事实' : '可审直接事实'}</span><b>${esc(applied ? acceptedFacts : factCounts.reviewableDirect.length)}</b><small>${applied ? '条已由企业确认' : '条可勾选确认'}</small></div>
    <div><span>${applied ? '已确认经营输入建议' : '可确认经营输入建议'}</span><b>${esc(applied ? acceptedSignals.size : confirmableSignals)}</b><small>${applied ? '条已写入指定字段，仍非公司事实' : '条可逐项勾选写入'}</small></div>
    <div><span>十大模块底稿</span><b>${esc(applied ? approvedDrafts : reviewableDrafts)}</b><small>${applied ? '份已进入正式系统' : '份可统一审核'}</small></div>
    <div><span>内部待补</span><b>${esc(missingModules)}</b><small>个模块有明确问题</small></div>
  </section>`;
}

function bootstrapCollectionChecklistItems(data) {
  const raw = Array.isArray(data?.collection_checklist) ? data.collection_checklist : [];
  const fromModules = (Array.isArray(data?.modules) ? data.modules : []).flatMap(module => {
    const items = Array.isArray(module.collection_checklist) ? module.collection_checklist : [];
    return items.map(item => ({
      ...item,
      module_no: item.module_no || module.module_no,
      module_name: item.module_name || module.name || module.module_name,
    }));
  });
  const merged = raw.length ? raw : fromModules;
  const seen = new Set();
  return merged.filter(item => {
    if (!item || typeof item !== 'object') return false;
    const key = `${item.module_no || ''}.${item.field_key || item.label || ''}`;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return Boolean(item.label || item.field_key);
  });
}

function bootstrapCollectionChecklistHtml(data) {
  const items = bootstrapCollectionChecklistItems(data);
  if (!items.length) return '';
  return `<section class="card bootstrap-collection-checklist" aria-labelledby="bootstrap-collection-checklist-title">
    <div class="bootstrap-section-head"><div><span>资料缺口</span>
      <h2 id="bootstrap-collection-checklist-title">取数清单 · 空字段保持空白</h2>
      <p>以下字段本次没有可写入的公开证据。空输入栏保持空白，不写入取数方案；由对应负责人按指定文档补齐。</p></div>
      <b>${esc(items.length)} 项待补</b></div>
    <table class="bootstrap-collection-table"><thead><tr><th>模块字段</th><th>负责人</th><th>应提供文档</th></tr></thead>
      <tbody>${items.map(item => {
        const moduleLabel = [item.module_no, item.module_name].filter(Boolean).join(' ');
        const fieldLabel = item.label || item.field_key || '';
        return `<tr><td>${esc(moduleLabel)}${fieldLabel ? ` · ${esc(fieldLabel)}` : ''}</td>
          <td>${esc(item.owner || '模块负责人')}</td>
          <td>${esc(item.document || item.collection_action || '内部核验表')}</td></tr>`;
      }).join('')}</tbody></table></section>`;
}

function bootstrapReprocessAvailable(data, readOnly = false) {
  return !readOnly && (data?.reprocess_available === true || data?.revision_available === true);
}

function bootstrapReprocessHtml(data, readOnly = false) {
  if (!bootstrapReprocessAvailable(data, readOnly)) return '';
  const revision = data?.status === 'applied' || data?.stage === 'completed';
  return `<section class="card bootstrap-reprocess${revision ? ' revision' : ''}" aria-labelledby="bootstrap-reprocess-title">
    <div class="bootstrap-reprocess-head"><div><span>复用已保存公开资料</span>
      <h2 id="bootstrap-reprocess-title">${revision ? '从已保存公开资料创建新的待审核修订版' : '不再次调用模型，重新整理可审核成果'}</h2></div><b>0 次模型调用</b></div>
    <p>本操作只处理本次建档中已经保存的公开来源和证据，不会调用 继涛博士，也不会再产生 继涛博士 费用。</p>
    ${revision
      ? '<p><b>先创建待审核修订版：</b>现有正式结果保持不变；只有你在新修订版中再次统一确认后，才会替换现有正式结果。</p>'
      : '<p>重新提取的直接事实、可确认经营输入建议和十大模块底稿仍是待审核记录，不会写入正式经营系统；完成后页面会继续显示三类成果的实时进度。</p>'}
    ${data.owner_safe_path?.message ? `<p class="s">${esc(data.owner_safe_path.message)}</p>` : ''}
    <button class="btn" type="button" id="bootstrapreprocess">${revision ? '创建新的待审核修订版（不调用模型）' : '从已保存公开资料重新提取事实与信号（不调用模型）'}</button>
    <div id="bootstrapreprocessstatus" aria-live="polite" aria-atomic="true"></div></section>`;
}

function bootstrapIdempotencyKey(action, runId = '') {
  const storageKey = `sme-bootstrap:${S.cid}:${runId}:${action}`;
  try {
    const existing = globalThis.sessionStorage?.getItem(storageKey);
    if (existing) return { key: existing, storageKey };
    const key = globalThis.crypto?.randomUUID?.() || `bootstrap-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    globalThis.sessionStorage?.setItem(storageKey, key);
    return { key, storageKey };
  } catch {
    return { key: globalThis.crypto?.randomUUID?.() || `bootstrap-${Date.now()}-${Math.random().toString(36).slice(2)}`, storageKey: '' };
  }
}

function clearBootstrapIdempotencyKey(storageKey) {
  if (!storageKey) return;
  try { globalThis.sessionStorage?.removeItem(storageKey); } catch { /* storage unavailable */ }
}

function createBootstrapReprocessGate() {
  let submitted = false;
  return async action => {
    if (submitted) return { started: false };
    submitted = true;
    return { started: true, value: await action() };
  };
}

async function requestBootstrapReprocess(data, request = api) {
  const idempotency = bootstrapIdempotencyKey('reprocess', data.id);
  try {
    const response = await request(`/api/companies/${S.cid}/bootstrap/${encodeURIComponent(data.id)}/reprocess`, {
      method: 'POST', body: {}, headers: { 'Idempotency-Key': idempotency.key },
    });
    const next = normalizeBootstrapOverview(response);
    if (!next) throw new Error('重新提取任务返回为空，请刷新核查当前状态');
    clearBootstrapIdempotencyKey(idempotency.storageKey);
    return next;
  } catch (error) {
    if (Number(error?.status) >= 400 && Number(error?.status) < 500) {
      clearBootstrapIdempotencyKey(idempotency.storageKey);
    }
    throw error;
  }
}

function bootstrapReprocessErrorState(error, revision = false) {
  const status = Number(error?.status || 0);
  const uncertain = !status || status >= 500
    || ['timeout', 'network_error', 'cost_uncertain'].includes(String(error?.code || ''));
  return {
    uncertain,
    message: error?.message || (revision ? '待审核修订版创建状态待核查。' : '重新提取状态待核查。'),
    guidance: uncertain
      ? '系统没有自动重试；本次请求标识已保留，请刷新核查后再决定。'
      : '系统没有自动重试；本次请求已明确被拒绝，可刷新核对后重新提交。',
  };
}

function bootstrapReviewPreparationActionName(data, acceptedFactIds, acceptedSignalIds) {
  const facts = normalizeBootstrapReviewIds(acceptedFactIds).sort().join('-') || 'none';
  const signals = normalizeBootstrapReviewIds(acceptedSignalIds).sort().join('-') || 'none';
  return `prepare-review:${String(data?.result_hash || '').slice(0, 20)}:f-${facts}:s-${signals}`;
}

async function requestBootstrapReviewPreparation(data, acceptedFactIds, acceptedSignalIds, request = api) {
  const idempotency = bootstrapIdempotencyKey(
    bootstrapReviewPreparationActionName(data, acceptedFactIds, acceptedSignalIds), data.id,
  );
  try {
    const response = await request(`/api/companies/${S.cid}/bootstrap/${encodeURIComponent(data.id)}/prepare-review`, {
      method: 'POST',
      body: {
        result_hash: data.result_hash,
        accepted_fact_ids: acceptedFactIds,
        accepted_signal_ids: acceptedSignalIds,
      },
      headers: { 'Idempotency-Key': idempotency.key },
    });
    const next = normalizeBootstrapOverview(response);
    if (!next?.review_preparation || next.review_preparation.result_hash !== next.result_hash) {
      throw new Error('新版底稿准备结果不完整，请刷新核查；系统没有写入正式经营数据');
    }
    clearBootstrapIdempotencyKey(idempotency.storageKey);
    return next;
  } catch (error) {
    if (Number(error?.status) >= 400 && Number(error?.status) < 500) {
      clearBootstrapIdempotencyKey(idempotency.storageKey);
    }
    throw error;
  }
}

function setBootstrapReprocessLocked(locked) {
  const panel = $('.bootstrap-reprocess');
  if (panel) panel.setAttribute('aria-busy', locked ? 'true' : 'false');
  root().querySelectorAll('button,input,select,textarea').forEach(control => {
    if (locked) {
      if (control.dataset.bootstrapReprocessWasDisabled === undefined) {
        control.dataset.bootstrapReprocessWasDisabled = control.disabled ? 'true' : 'false';
      }
      control.disabled = true;
    } else if (control.dataset.bootstrapReprocessWasDisabled !== undefined) {
      control.disabled = control.dataset.bootstrapReprocessWasDisabled === 'true';
      delete control.dataset.bootstrapReprocessWasDisabled;
    }
  });
}

async function reprocessBootstrapRun(data) {
  const cid = S.cid;
  const seq = ++S.renderSeq;
  const revision = data?.status === 'applied' || data?.stage === 'completed';
  const button = $('#bootstrapreprocess');
  const status = $('#bootstrapreprocessstatus');
  setBootstrapReprocessLocked(true);
  if (button) button.textContent = revision ? '正在创建待审核修订版…' : '正在重新提取…';
  setMessage(status, revision
    ? '正在从已保存公开资料创建新的待审核修订版；0 次模型调用、不产生 继涛博士 费用，现有正式结果保持不变。'
    : '正在读取已保存公开资料；本次不会调用 继涛博士，也不会写入正式经营系统。', 'info');
  try {
    const next = await requestBootstrapReprocess(data);
    S.bootstrapActionError = null;
    if (seq === S.renderSeq && String(cid) === String(S.cid) && S.view === 'research') {
      await advanceBootstrapFlow(next, { automatic: true });
    }
  } catch (error) {
    if (error.status === 401 || seq !== S.renderSeq) return;
    S.bootstrapActionError = bootstrapReprocessErrorState(error, revision);
    setMessage(status, `${S.bootstrapActionError.message} ${S.bootstrapActionError.guidance}`,
      S.bootstrapActionError.uncertain ? 'info' : 'error');
  }
}

async function loadBootstrapOverview() {
  try {
    return { supported: true, data: normalizeBootstrapOverview(await api(`/api/companies/${S.cid}/bootstrap`)) };
  } catch (error) {
    if ([404, 405, 501].includes(error.status)) return { supported: false, data: null };
    throw error;
  }
}

function bootstrapHasActiveStep(data) {
  return data.topic_steps.some(step => step.status === 'running') || data.modules.some(module => module.status === 'running');
}

function bootstrapHasBlockingStep(data) {
  return data.topic_steps.some(step => ['failed', 'cost_uncertain'].includes(step.status)) ||
    data.modules.some(module => ['failed', 'cost_uncertain'].includes(module.status));
}

function bootstrapHasQueuedWork(data) {
  return data.topic_steps.some(step => ['queued', 'running'].includes(step.status)) ||
    data.modules.some(module => ['queued', 'running'].includes(module.status));
}

function bootstrapShouldStop(data) {
  if (bootstrapHasQueuedWork(data) && !bootstrapHasBlockingStep(data) && data.stage !== 'entity_review') {
    return false;
  }
  return BOOTSTRAP_TERMINAL_STATUSES.has(data.status) || bootstrapFinalReviewReady(data) ||
    ['entity_review', 'completed', 'partial', 'failed', 'cost_uncertain'].includes(data.stage) ||
    bootstrapHasBlockingStep(data);
}

function bootstrapAdvanceRequestBody(stepKey = '', confirmCostUncertain = false, entityHint = '') {
  const key = String(stepKey || '').trim();
  if (!key) return {};
  const hint = String(entityHint || '').trim();
  return {
    step_key: key,
    ...(confirmCostUncertain ? { confirm_cost_uncertain: true } : {}),
    ...(confirmCostUncertain && key === 'identity' && hint ? { entity_hint: hint } : {}),
  };
}

function createBootstrapRetryGate(onConfirm) {
  let expanded = false;
  let submitted = false;
  return {
    get expanded() { return expanded; },
    get submitted() { return submitted; },
    open() {
      if (submitted) return false;
      expanded = true;
      return true;
    },
    cancel() {
      if (submitted) return false;
      expanded = false;
      return true;
    },
    confirm(...args) {
      if (!expanded || submitted) return false;
      submitted = true;
      onConfirm(...args);
      return true;
    },
  };
}

function renderBootstrapWorking(data, message = 'AI 正在构建企业经营底稿…') {
  root().innerHTML = shell(`<section class="bootstrap-screen"><div class="bootstrap-heading"><div>
    <span class="bootstrap-kicker">公司级 AI 经营建档</span><h1>${esc(data?.entity?.name || (S.companies.find(c => String(c.id) === String(S.cid)) || {}).name || '企业经营底稿')}</h1>
    <p>${esc(message)} 已完成结果会立即保存，可安全离开后再继续。</p></div>
    <span class="research-status">${esc(bootstrapStatusLabel(data?.status || 'running', data?.stage || ''))}</span></div>
    ${bootstrapJourneyHtml(data || { stage: 'created', status: 'created', entity: {}, modules: [] })}
    ${bootstrapProgressHtml(data || { status: 'running', stage: 'created', progress: {}, entity: {}, modules: [] })}
    ${data ? bootstrapTopicStepsHtml(data) : ''}
    <div class="bootstrap-working-note" role="status" aria-live="polite"><span class="spin" aria-hidden="true"></span>
      <div><b>${esc(message)}</b><span>系统不会要求你逐个模块点击生成。</span></div></div></section>`);
  bindShell();
}

async function advanceBootstrapFlow(initialData, {
  stepKey = '', automatic = true, confirmCostUncertain = false, entityHint = '',
} = {}) {
  const cid = S.cid;
  const seq = ++S.renderSeq;
  let data = initialData;
  let requestedStep = stepKey;
  const maxAdvances = automatic
    ? Math.max(32, Math.min(60, nonNegativeCount(data?.progress?.total_steps) + 3))
    : 1;
  for (let index = 0; index < maxAdvances; index += 1) {
    if (seq !== S.renderSeq || String(cid) !== String(S.cid) || S.view !== 'research') return;
    if (bootstrapShouldStop(data) && !requestedStep) break;
    if (bootstrapHasActiveStep(data)) {
      renderBootstrapWorking(data, '后台步骤正在执行，正在读取最新进度…');
      await new Promise(resolve => setTimeout(resolve, 2500));
      const latest = await loadBootstrapOverview();
      if (!latest.supported || !latest.data) break;
      data = latest.data;
      continue;
    }
    const actionName = requestedStep
      ? `${confirmCostUncertain ? 'retry-cost' : 'retry'}:${requestedStep}`
      : `advance:${data.stage}:${index}`;
    const idempotency = bootstrapIdempotencyKey(actionName, data.id);
    renderBootstrapWorking(data, requestedStep ? '正在恢复未完成步骤…' : '正在推进下一项公司级任务…');
    try {
      data = normalizeBootstrapOverview(await api(`/api/companies/${cid}/bootstrap/${encodeURIComponent(data.id)}/advance`, {
        method: 'POST', body: bootstrapAdvanceRequestBody(requestedStep, confirmCostUncertain, entityHint),
        headers: { 'Idempotency-Key': idempotency.key },
      })) || data;
      clearBootstrapIdempotencyKey(idempotency.storageKey);
      S.bootstrapActionError = null;
      requestedStep = '';
    } catch (error) {
      if (error.status === 401 || seq !== S.renderSeq) return;
      S.bootstrapActionError = {
        message: error.message || '任务推进状态待核查。',
        uncertain: !error.status || ['timeout', 'network_error', 'cost_uncertain'].includes(String(error.code || '')),
      };
      break;
    }
  }
  if (seq === S.renderSeq && String(cid) === String(S.cid) && S.view === 'research') await viewBootstrap(seq);
}

async function startBootstrapRun() {
  const cid = S.cid;
  const seq = ++S.renderSeq;
  S.bootstrapAutoStart = false;
  const idempotency = bootstrapIdempotencyKey('start');
  renderBootstrapWorking(null, '正在创建企业经营建档任务…');
  try {
    const data = normalizeBootstrapOverview(await api(`/api/companies/${cid}/bootstrap/start`, {
      method: 'POST', body: {}, headers: { 'Idempotency-Key': idempotency.key },
    }));
    clearBootstrapIdempotencyKey(idempotency.storageKey);
    S.bootstrapActionError = null;
    if (!data) throw new Error('建档任务返回为空');
    if (seq === S.renderSeq && String(cid) === String(S.cid) && S.view === 'research') {
      await advanceBootstrapFlow(data, { automatic: true });
    }
  } catch (error) {
    if (error.status === 401 || seq !== S.renderSeq) return;
    S.bootstrapActionError = {
      message: error.message || '任务创建状态待核查。',
      uncertain: !error.status || ['timeout', 'network_error', 'cost_uncertain'].includes(String(error.code || '')),
    };
    if (seq === S.renderSeq) await viewBootstrap(seq);
  }
}

async function submitBootstrapEntity(data) {
  const status = $('#bootstrapentitystatus');
  const selected = root().querySelector('[name="bootstrap-entity"]:checked');
  const hint = String($('#bootstrapentityhint')?.value || '').trim();
  if (!selected && !hint) {
    setMessage(status, '请选择一个候选企业，或补充地区、股票代码、统一社会信用代码、官网中的一项。');
    return;
  }
  const body = {};
  if (selected) body.candidate_id = selected.value;
  if (hint) body.entity_hint = hint;
  const idempotency = bootstrapIdempotencyKey(`entity:${selected?.value || 'hint'}`, data.id);
  const button = $('#bootstrapentityconfirm');
  button.disabled = true; button.textContent = '正在核验…';
  try {
    const next = normalizeBootstrapOverview(await api(`/api/companies/${S.cid}/bootstrap/${encodeURIComponent(data.id)}/advance`, {
      method: 'POST', body, headers: { 'Idempotency-Key': idempotency.key },
    }));
    clearBootstrapIdempotencyKey(idempotency.storageKey);
    S.bootstrapActionError = null;
    if (next) await advanceBootstrapFlow(next, { automatic: true });
  } catch (error) {
    if (error.status !== 401) {
      setMessage(status, error.message || '企业主体核验失败，请核对后重试。');
      button.disabled = false; button.textContent = '确认主体并继续';
    }
  }
}

function setBootstrapReviewLocked(locked) {
  const review = $('.bootstrap-review');
  if (!review) return;
  review.setAttribute('aria-busy', locked ? 'true' : 'false');
  root().querySelectorAll('button,input,select,textarea').forEach(control => {
    if (locked) {
      if (control.dataset.bootstrapWasDisabled === undefined) control.dataset.bootstrapWasDisabled = control.disabled ? 'true' : 'false';
      control.disabled = true;
    } else if (control.dataset.bootstrapWasDisabled !== undefined) {
      control.disabled = control.dataset.bootstrapWasDisabled === 'true';
      delete control.dataset.bootstrapWasDisabled;
    }
  });
}

function selectedBootstrapReviewIds() {
  const toId = value => /^\d+$/.test(String(value || '')) ? Number(value) : String(value || '');
  return {
    facts: [...root().querySelectorAll('[data-bootstrap-fact-id]:checked')]
      .map(input => toId(input.dataset.bootstrapFactId)),
    signals: [...root().querySelectorAll('[data-bootstrap-signal-id]:checked')]
      .map(input => toId(input.dataset.bootstrapSignalId)),
    modules: [...root().querySelectorAll('[data-bootstrap-module-no]:checked')]
      .map(input => input.dataset.bootstrapModuleNo),
  };
}

function updateBootstrapReviewSelection(data = null) {
  const selectedFactIds = new Set([...root().querySelectorAll('[data-bootstrap-fact-id]:checked')].map(input => String(input.dataset.bootstrapFactId)));
  const selectedSignalIds = new Set([...root().querySelectorAll('[data-bootstrap-signal-id]:checked')].map(input => String(input.dataset.bootstrapSignalId)));
  root().querySelectorAll('[data-bootstrap-module-no]').forEach(input => {
    if (input.dataset.bootstrapReviewable !== 'true' || input.dataset.bootstrapReadonly === 'true') return;
    const required = String(input.dataset.bootstrapRequiredFacts || '').split(',').filter(Boolean);
    const dependenciesMet = required.every(id => selectedFactIds.has(id));
    const label = input.closest('.bootstrap-module-choice');
    label?.classList.toggle('needs-facts', !dependenciesMet);
    const labelText = label?.querySelector('span');
    if (!dependenciesMet) {
      input.checked = false;
      input.disabled = true;
      if (labelText) labelText.textContent = '先确认所引用事实';
    } else {
      input.disabled = false;
      const signalIds = String(input.dataset.bootstrapSignalIds || '').split(',').filter(Boolean);
      const includesSelectedSignal = signalIds.some(id => selectedSignalIds.has(id));
      if (labelText) labelText.textContent = includesSelectedSignal
        ? input.dataset.bootstrapReadyWithSignalsLabel || '采用底稿并写入已选经营资料'
        : input.dataset.bootstrapReadyLabel || '纳入正式系统';
    }
  });
  const selection = bootstrapReviewSelectionText();
  const status = $('#bootstrapreviewselection');
  if (status) status.textContent = selection.text;
  const apply = $('#bootstrapapply');
  if (apply && apply.dataset.submitting !== 'true') {
    const action = bootstrapReviewActionState(data, [...selectedFactIds], [...selectedSignalIds]);
    apply.dataset.bootstrapReviewAction = action.action;
    apply.textContent = action.label;
    apply.disabled = selection.modules === 0;
    const preparationStatus = $('#bootstrappreparationstatus');
    if (preparationStatus) {
      if (data?.review_preparation && action.action === 'prepare') {
        preparationStatus.textContent = `审核选择已改变，当前预览还没有按这 ${selection.signals} 条经营输入建议更新。请先重新生成可审核底稿；0 次模型调用，正式经营数据不会改变。`;
      } else if (data?.review_preparation) {
        preparationStatus.textContent = `新版底稿已按 ${selection.signals} 条经营输入建议完成重建。请先逐项预览，再确认进入正式系统；目前仍未写入正式经营数据。`;
      } else if (selection.signals > 0) {
        preparationStatus.textContent = `已选择 ${selection.signals} 条经营输入建议。第一次点击只重建十大模块底稿供你预览；0 次模型调用，不产生 继涛博士 费用，也不写入正式系统。`;
      }
    }
  }
}

async function applyBootstrapReview(data) {
  const status = $('#bootstrapapplystatus');
  if (!data.result_hash) { setMessage(status, '审核版本缺失，请刷新读取当前成果。'); return; }
  const selected = selectedBootstrapReviewIds();
  const acceptedFactIds = selected.facts;
  const acceptedSignalIds = selected.signals;
  const acceptedModuleNos = selected.modules;
  if (!acceptedModuleNos.length) { setMessage(status, '请至少选择一份可审核模块底稿。'); return; }
  const reviewAction = bootstrapReviewActionState(data, acceptedFactIds, acceptedSignalIds);
  const button = $('#bootstrapapply');
  if (button.dataset.submitting === 'true') return;
  button.dataset.submitting = 'true';
  button.textContent = reviewAction.action === 'prepare' ? '正在重建可审核底稿…' : '正在统一确认…';
  setBootstrapReviewLocked(true);
  try {
    if (reviewAction.action === 'prepare') {
      setMessage(status, '正在按所选资料确定性重建十大模块底稿；0 次模型调用，不会产生 继涛博士 费用，也不会写入正式系统。', 'info');
      await requestBootstrapReviewPreparation(data, acceptedFactIds, acceptedSignalIds);
      S.bootstrapActionError = null;
      await boot(S.cid, 'research');
      return;
    }
    await api(`/api/companies/${S.cid}/bootstrap/${encodeURIComponent(data.id)}/apply`, {
      method: 'POST', body: {
        result_hash: data.result_hash, accepted_fact_ids: acceptedFactIds,
        accepted_signal_ids: acceptedSignalIds, accepted_module_nos: acceptedModuleNos,
      },
    });
    S.bootstrapActionError = null;
    await boot(S.cid, 'research');
  } catch (error) {
    if (error.status !== 401) {
      setBootstrapReviewLocked(false); button.dataset.submitting = 'false';
      button.textContent = bootstrapReviewActionState(data, acceptedFactIds, acceptedSignalIds).label;
      if (error.code === 'bootstrap_module_has_unconfirmed_facts') {
        const factIds = Array.isArray(error.payload?.fact_ids) ? error.payload.fact_ids.map(String) : [];
        root().querySelectorAll('[data-bootstrap-fact-id]').forEach(input => {
          if (factIds.includes(String(input.dataset.bootstrapFactId))) input.closest('.bootstrap-fact')?.classList.add('needs-selection');
        });
        const moduleNo = String(error.payload?.module_no || '所选模块');
        setMessage(status, `${moduleNo} 模块引用了尚未确认的公开事实。请勾选标出的事实，或取消该模块后再确认。`);
        root().querySelector('.bootstrap-fact.needs-selection input')?.focus();
      } else if (['bootstrap_signal_conflict', 'bootstrap_signal_stale', 'bootstrap_signal_not_reviewable',
        'bootstrap_signal_target_stale', 'bootstrap_signal_not_public', 'bootstrap_fact_target_conflict'].includes(error.code)) {
        const signalIds = Array.isArray(error.payload?.signal_ids) ? error.payload.signal_ids.map(String) : [];
        root().querySelectorAll('[data-bootstrap-signal-id]').forEach(input => {
          if (!signalIds.length || signalIds.includes(String(input.dataset.bootstrapSignalId))) {
            input.closest('.bootstrap-fact')?.classList.add('needs-selection');
          }
        });
        setMessage(status, error.message || '所选经营输入建议已变化、重复或与现有录入冲突。请刷新核对，不会自动覆盖。');
        root().querySelector('.bootstrap-fact.needs-selection input')?.focus();
      } else if (['bootstrap_review_not_prepared', 'bootstrap_review_preparation_mismatch',
        'bootstrap_version_conflict', 'bootstrap_module_stale'].includes(error.code)) {
        setMessage(status, error.message || '新版底稿或审核选择已变化，请刷新后重新准备；系统没有写入正式经营数据。');
      } else {
        const unknown = !error.status || ['timeout', 'network_error'].includes(String(error.code || ''));
        setMessage(status, `${error.message || (reviewAction.action === 'prepare' ? '新版底稿准备状态待核查。' : '统一确认失败。')}${unknown ? ' 系统没有自动重试；请刷新核查。' : ''}`);
      }
      updateBootstrapReviewSelection(data);
    }
  }
}

function bootstrapEntityReviewHtml(data, readOnly) {
  const candidates = data.entity.candidates;
  return `<section class="card bootstrap-entity-review" aria-labelledby="bootstrap-entity-title">
    <span class="bootstrap-kicker">需要你确认一次</span><h2 id="bootstrap-entity-title">请选择正确的企业主体</h2>
    <p>公开资料出现同名或近似企业。只有确认唯一主体后，系统才会继续建立事实库和十大模块底稿。</p>
    ${candidates.length ? `<fieldset><legend>可能的企业主体</legend>${candidates.map(candidate => {
      const identifiers = Object.values(candidate.identifiers || {}).filter(Boolean).join(' · ');
      return `<label class="bootstrap-entity-option"><input type="radio" name="bootstrap-entity" value="${esc(candidate.id)}" ${readOnly ? 'disabled' : ''}>
        <span><b>${esc(candidate.name)}</b><small>${esc([identifiers, `置信度 ${candidate.confidence}%`].filter(Boolean).join(' · '))}</small>
          ${candidate.reason ? `<p>${esc(candidate.reason)}</p>` : ''}
          ${candidate.source_keys.length ? `<span class="bootstrap-entity-sources">${candidate.source_keys.map(key => `<span>证据 ${esc(key)}</span>`).join('')}</span>` : ''}</span></label>`;
    }).join('')}</fieldset>` : '<div class="msg msg-i">当前没有可直接选择的候选，请补充一个可核验线索。</div>'}
    ${readOnly ? '<div class="msg msg-i">顾问账号为只读，只有企业主可以确认主体并继续。</div>' : `
      <label class="f" for="bootstrapentityhint">也可以补充识别线索</label>
      <input class="f" id="bootstrapentityhint" maxlength="500" placeholder="所在城市 / 股票代码 / 18位统一社会信用代码 / 官网 https://…">
      <button class="btn" type="button" id="bootstrapentityconfirm">确认主体并继续</button>
      <div id="bootstrapentitystatus" aria-live="polite"></div>`}</section>`;
}

function bootstrapRecoveryHtml(data, readOnly) {
  const failedSteps = data.topic_steps.filter(step => step.status === 'failed' && !step.cost_uncertain);
  const uncertainSteps = [
    ...data.topic_steps.filter(step => step.cost_uncertain).map(step => ({ key: step.key, label: step.label || step.key })),
    ...data.modules.filter(module => module.cost_uncertain).map(module => ({
      key: `module:${module.module_no}`, label: `${module.module_no} ${module.name}`,
    })),
  ];
  const uncertain = data.status === 'cost_uncertain' || data.topic_steps.some(step => step.cost_uncertain) ||
    data.modules.some(module => module.cost_uncertain);
  const identityUncertain = uncertainSteps.some(step => step.key === 'identity');
  const message = data.error?.message || (uncertain
    ? '至少一个模型调用的费用或完成状态尚不确定。系统不会自动重试。'
    : '部分步骤没有完成；已成功保存的事实和模块底稿不会丢失。');
  return `<section class="card bootstrap-recovery ${uncertain ? 'uncertain' : ''}" aria-labelledby="bootstrap-recovery-title">
    <span class="bootstrap-kicker">${uncertain ? '先核查，再决定' : '局部恢复'}</span>
    <h2 id="bootstrap-recovery-title">${esc(uncertain ? '调用状态待核查' : data.status === 'failed' ? '本次构建未完成' : '部分成果已保留')}</h2>
    <p>${esc(message)}</p>
    ${S.bootstrapActionError ? `<div class="msg ${S.bootstrapActionError.uncertain ? 'msg-i' : 'msg-e'}">${esc(S.bootstrapActionError.message)}</div>` : ''}
    ${readOnly ? '<div class="msg msg-i">顾问账号可以查看已保存成果，但不能重试或推进任务。</div>' : `<div class="bootstrap-recovery-actions">
      <button class="btn btn-g" type="button" id="bootstraprefresh">只刷新核查状态</button>
      ${identityUncertain ? `<label class="f bootstrap-retry-hint" for="bootstrapretryhint">主体线索（若上次使用过，请再次填写同一线索）
        <input class="f" id="bootstrapretryhint" maxlength="500" placeholder="所在城市 / 股票代码 / 统一社会信用代码 / 官网 https://…"></label>` : ''}
      ${uncertainSteps.map((step, index) => `<div class="bootstrap-retry-confirmation">
        <button class="btn" type="button" data-bootstrap-retry-uncertain="${esc(step.key)}" aria-expanded="false" aria-controls="bootstrap-retry-confirm-${index}">核查后只重试：${esc(step.label)}</button>
        <div class="bootstrap-cost-confirm" id="bootstrap-retry-confirm-${index}" data-bootstrap-cost-confirm hidden role="group" aria-label="确认重新调用 ${esc(step.label)}">
          <p><b>请确认费用风险</b>：上一次调用可能已经产生费用。继续只会重新调用“${esc(step.label)}”，并可能再次产生一次 继涛博士 费用。</p>
          <div><button class="btn" type="button" data-bootstrap-retry-confirm>确认重新调用</button>
            <button class="btn btn-g" type="button" data-bootstrap-retry-cancel>取消</button></div>
        </div></div>`).join('')}
      ${uncertain ? '<small class="bootstrap-cost-note">重新调用可能再次产生一次 继涛博士 费用；只有你明确确认后才会执行。</small>'
        : failedSteps.map(step => `<button class="btn btn-g" type="button" data-bootstrap-retry-step="${esc(step.key)}">只重试：${esc(step.label || step.key)}</button>`).join('')}
      ${!uncertain && data.status === 'partial' && !failedSteps.length && data.restart_allowed
        ? '<button class="btn" type="button" id="bootstraprestart">重新建档并再次采集</button><small>将创建一份新的建档记录，并重新产生 继涛博士 调用费用；旧记录与已保存资料不会丢失。</small>'
        : !uncertain && data.status === 'partial' && !failedSteps.length
          ? '<button class="btn" type="button" id="bootstrapcontinue">继续处理未完成步骤</button>' : ''}
    </div>`}</section>`;
}

function bootstrapLaunchHtml(companyName, readOnly) {
  return `<section class="bootstrap-launch card" aria-labelledby="bootstrap-launch-title">
    <span class="bootstrap-kicker">公司级 AI 经营建档</span><h1 id="bootstrap-launch-title">为 ${esc(companyName)} 生成完整经营底稿</h1>
    <p>系统将自动核验主体、采集公开资料、建立统一事实库并构建十大模块底稿。你不需要逐个模块点击生成。</p>
    <div class="bootstrap-launch-flow"><span>公开证据</span><i>→</i><span>公司事实库</span><i>→</i><span>十大模块底稿</span><i>→</i><span>统一确认</span></div>
    ${S.bootstrapActionError ? `<div class="msg ${S.bootstrapActionError.uncertain ? 'msg-i' : 'msg-e'}">${esc(S.bootstrapActionError.message)} 系统没有自动重试。</div>` : ''}
    ${readOnly ? '<div class="msg msg-i">顾问账号可以查看已有结果，但只有企业主可以启动公司级建档。</div>'
      : '<button class="btn" type="button" id="bootstrapstart">开始生成 AI 经营底稿</button>'}</section>`;
}

async function viewBootstrap(seq) {
  const company = S.companies.find(item => String(item.id) === String(S.cid)) || {};
  const readOnly = isRO();
  const loaded = await loadBootstrapOverview();
  if (seq !== S.renderSeq || S.view !== 'research') return;
  if (!loaded.supported) {
    if (S.bootstrapAutoStart) { S.bootstrapAutoStart = false; S.researchAutoStart = true; }
    await viewResearch(seq);
    return;
  }
  if (S.bootstrapAutoStart && !readOnly && !loaded.data) {
    S.bootstrapAutoStart = false;
    await startBootstrapRun();
    return;
  }
  const data = loaded.data;
  if (!data) {
    root().innerHTML = shell(`<section class="bootstrap-screen">${bootstrapLaunchHtml(company.name || '当前企业', readOnly)}</section>`);
    bindShell();
    const start = $('#bootstrapstart'); if (start) start.onclick = () => startBootstrapRun();
    return;
  }

  const review = bootstrapFinalReviewReady(data);
  const applied = data.status === 'applied';
  const entityReview = data.status === 'needs_entity_confirmation';
  const uncertainOrFailed = ['partial', 'failed', 'cost_uncertain'].includes(data.status) ||
    bootstrapHasBlockingStep(data);
  const activelyRunning = data.status === 'running' && bootstrapHasActiveStep(data);
  let content = '';
  if (entityReview) {
    content = `${bootstrapEntityReviewHtml(data, readOnly)}${bootstrapFactsHtml(data)}${bootstrapModulesHtml(data, { readOnly })}${bootstrapSourcesHtml(data)}`;
  } else if (review) {
    content = `<section class="bootstrap-review" aria-labelledby="bootstrap-review-title">
      <div class="card bootstrap-review-intro"><span class="bootstrap-kicker">第 6 步 · 统一人工审核</span>
        <h2 id="bootstrap-review-title">一次确认公司事实库和十大模块底稿</h2>
        <p>直接事实可确认进入事实库；公开资料建议可另行勾选写入指定经营输入。两类内容始终分开记录，AI 假设不会被自动写入。</p>
        ${bootstrapReviewPreparationHtml(data)}${bootstrapPreparedInputPreviewHtml(data)}</div>
      ${bootstrapValueSummaryHtml(data)}${bootstrapCollectionChecklistHtml(data)}${bootstrapTopicReviewNoticeHtml(data)}${bootstrapTopicStepsHtml(data)}
      ${bootstrapFactsHtml(data, { review: true, readOnly })}
      ${bootstrapModulesHtml(data, { review: true, readOnly })}
      <div class="bootstrap-applybar"><div><b>统一确认后才进入正式系统</b>
        <span id="bootstrapreviewselection" role="status" aria-live="polite" aria-atomic="true"></span></div>
        ${readOnly ? '<span class="rolepill">顾问 · 只读，不能确认</span>'
          : '<button class="btn" type="button" id="bootstrapapply">统一确认并进入正式系统</button>'}</div>
      <div id="bootstrapapplystatus" aria-live="polite"></div></section>${bootstrapSourcesHtml(data)}`;
  } else if (applied) {
    content = `<section class="card bootstrap-complete"><div class="research-success" aria-hidden="true">✓</div>
      <span class="bootstrap-kicker">第 7 步已完成</span><h2>公司事实与模块底稿已进入正式系统</h2>
      <p>只有你在统一审核中确认的事实、经营输入建议和模块底稿被采用；未确认内容继续保留在建档记录中。</p>
      <button class="btn" type="button" id="bootstrapworkbench">进入十大模块正式工作台</button>
      <button class="btn" type="button" id="exportsequoia">导出红杉融资BP</button></section>
      ${bootstrapValueSummaryHtml(data)}${bootstrapFactsHtml(data)}${bootstrapModulesHtml(data, { readOnly, showModuleCta: true })}${bootstrapSourcesHtml(data)}`;
  } else {
    content = `${uncertainOrFailed ? bootstrapRecoveryHtml(data, readOnly) : `<section class="bootstrap-running-summary card">
      <span class="bootstrap-kicker">AI 正在自动推进</span><h2>${esc(activelyRunning ? '当前步骤正在执行' : '已保存阶段成果')}</h2>
      <p>${esc(activelyRunning ? '系统会自动构建所有具备公开依据的模块底稿，不需要逐个点击。' : '如果你是刷新后回来，可以从当前耐久状态继续，不会重做已完成步骤。')}</p>
      ${!readOnly && !activelyRunning ? '<button class="btn" type="button" id="bootstrapcontinue">继续公司级生成</button>' : ''}</section>`}
      ${uncertainOrFailed ? bootstrapValueSummaryHtml(data) : ''}${bootstrapTopicStepsHtml(data)}${data.facts.length || data.public_signals.length ? bootstrapFactsHtml(data) : ''}${bootstrapModulesHtml(data, { readOnly })}${bootstrapSourcesHtml(data)}`;
  }

  root().innerHTML = shell(`<section class="bootstrap-screen"><div class="bootstrap-heading"><div>
    <span class="bootstrap-kicker">公司级 AI 经营建档</span><h1>${esc(data.entity.name || company.name || '企业经营底稿')}</h1>
    <p>公开证据、公司事实、AI 草案和内部待补信息严格分层。</p></div>
    <div class="board-tools"><button class="btn" type="button" id="exportsequoia">导出红杉融资BP</button>
      <span class="research-status">${esc(bootstrapStatusLabel(data.status, data.stage))}</span></div></div>
    ${bootstrapJourneyHtml(data)}${bootstrapProgressHtml(data)}
    ${bootstrapReprocessHtml(data, readOnly)}
    ${S.bootstrapRecovered && !applied ? '<div class="msg msg-i bootstrap-restored">已恢复上次保存的建档进度；已完成步骤不会重做。</div>' : ''}
    ${S.bootstrapActionError && !uncertainOrFailed ? `<div class="msg ${S.bootstrapActionError.uncertain ? 'msg-i' : 'msg-e'}">${esc(S.bootstrapActionError.message)} 系统没有自动重试，请先刷新核查。</div>` : ''}
    ${content}</section>`);
  bindShell();
  const start = $('#bootstrapstart'); if (start) start.onclick = () => startBootstrapRun();
  const entityConfirm = $('#bootstrapentityconfirm'); if (entityConfirm) entityConfirm.onclick = () => submitBootstrapEntity(data);
  const continueButton = $('#bootstrapcontinue'); if (continueButton) continueButton.onclick = () => advanceBootstrapFlow(data, { automatic: true });
  const restartButton = $('#bootstraprestart'); if (restartButton) restartButton.onclick = () => {
    if (!confirm('本次没有形成可审核底稿。确认新建一次调研任务并重新产生 继涛博士 调用费用吗？旧记录与已保存资料会保留。')) return;
    startBootstrapRun();
  };
  const refresh = $('#bootstraprefresh'); if (refresh) refresh.onclick = () => { S.bootstrapActionError = null; render(); };
  const reprocess = $('#bootstrapreprocess'); if (reprocess) {
    const gate = createBootstrapReprocessGate();
    reprocess.onclick = () => gate(() => reprocessBootstrapRun(data));
  }
  const apply = $('#bootstrapapply'); if (apply) apply.onclick = () => applyBootstrapReview(data);
  const selectSignals = $('#bootstrapselectsignals'); if (selectSignals) selectSignals.onclick = () => {
    const count = selectUniqueBootstrapSignals(root().querySelectorAll('[data-bootstrap-signal-id]'));
    selectSignals.textContent = `已选择 ${count} 条无冲突建议`;
    updateBootstrapReviewSelection(data);
  };
  const workbench = $('#bootstrapworkbench'); if (workbench) workbench.onclick = () => go('wbs');
  const bootstrapSequoia = $('#exportsequoia'); if (bootstrapSequoia) bootstrapSequoia.onclick = () => downloadSequoiaPptx(bootstrapSequoia, $('#bootstrapapplystatus') || $('#boardactionstatus'));
  root().querySelectorAll('[data-bootstrap-fact-id],[data-bootstrap-module-no]').forEach(input =>
    input.addEventListener('change', () => updateBootstrapReviewSelection(data)));
  root().querySelectorAll('[data-bootstrap-signal-id]').forEach(input => input.addEventListener('change', () => {
    keepBootstrapSignalSelectionUnique(input, root().querySelectorAll('[data-bootstrap-signal-id]'));
    updateBootstrapReviewSelection(data);
  }));
  if (review) updateBootstrapReviewSelection(data);
  root().querySelectorAll('[data-bootstrap-retry-step]').forEach(button => {
    button.onclick = () => advanceBootstrapFlow(data, { stepKey: button.dataset.bootstrapRetryStep, automatic: false });
  });
  root().querySelectorAll('[data-bootstrap-retry-uncertain]').forEach(button => {
    const wrapper = button.closest('.bootstrap-retry-confirmation');
    const panel = wrapper?.querySelector('[data-bootstrap-cost-confirm]');
    const confirmButton = wrapper?.querySelector('[data-bootstrap-retry-confirm]');
    const cancelButton = wrapper?.querySelector('[data-bootstrap-retry-cancel]');
    if (!wrapper || !panel || !confirmButton || !cancelButton) return;
    const gate = createBootstrapRetryGate(() => {
      const stepKey = button.dataset.bootstrapRetryUncertain;
      if (!stepKey) return;
      button.disabled = true;
      confirmButton.disabled = true;
      cancelButton.disabled = true;
      confirmButton.textContent = '正在重新调用…';
      const entityHint = stepKey === 'identity' ? String($('#bootstrapretryhint')?.value || '').trim() : '';
      advanceBootstrapFlow(data, { stepKey, automatic: false, confirmCostUncertain: true, entityHint });
    });
    const setExpanded = expanded => {
      button.setAttribute('aria-expanded', String(expanded));
      panel.hidden = !expanded;
      (expanded ? confirmButton : button).focus();
    };
    button.onclick = () => {
      if (!button.dataset.bootstrapRetryUncertain || !gate.open()) return;
      setExpanded(true);
    };
    cancelButton.onclick = () => {
      if (!gate.cancel()) return;
      setExpanded(false);
    };
    confirmButton.onclick = () => gate.confirm();
  });
  root().querySelectorAll('[data-bootstrap-open-module]').forEach(button => {
    button.onclick = () => go('detail', button.dataset.bootstrapOpenModule);
  });
  if (activelyRunning) setTimeout(() => {
    if (seq === S.renderSeq && S.view === 'research' && String(S.cid) === String(company.id)) render();
  }, 2500);
}

/* ───────── 兼容旧版 AI 公开调研 ───────── */
function normalizeResearch(payload) {
  const source = payload && typeof payload === 'object' ? payload : {};
  const job = source.job && typeof source.job === 'object' ? source.job : null;
  const rawProposals = Array.isArray(source.proposals) ? source.proposals : [];
  const proposals = rawProposals.length
    ? rawProposals
    : Array.isArray(job?.candidates) ? job.candidates : [];
  const appliedProposalIds = Array.isArray(source.applied_proposal_ids) ? source.applied_proposal_ids : [];
  return {
    job,
    sources: Array.isArray(source.sources) ? source.sources : [],
    proposals,
    connections: source.connections && typeof source.connections === 'object' ? source.connections : {},
    stats: source.stats && typeof source.stats === 'object' ? source.stats : {},
    appliedProposalIds,
    applied_proposal_ids: appliedProposalIds,
    coverage: normalizeResearchCoverage(source.coverage, proposals, appliedProposalIds),
  };
}

function nonNegativeCount(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.round(number)) : fallback;
}

function researchProposalModuleNo(proposal) {
  if (!['module_input', 'module'].includes(String(proposal?.target_type || ''))) return '';
  return /^(\d{2})[.:/]/.exec(String(proposal?.target_key || ''))?.[1] || '';
}

function normalizeResearchCoverage(value, proposals = [], appliedProposalIds = []) {
  const raw = value && typeof value === 'object' ? value : {};
  const rawCompany = raw.company && typeof raw.company === 'object' ? raw.company : {};
  const rawModules = Array.isArray(raw.modules) ? raw.modules : [];
  const applied = new Set(appliedProposalIds.map(id => String(id)));
  const modules = Array.isArray(S.meta?.modules) ? S.meta.modules : [];
  const rawByNo = new Map(rawModules.map(item => [String(item?.module_no || item?.no || ''), item]));
  const moduleOrder = modules.length ? modules : rawModules.map(item => ({
    no: String(item?.module_no || item?.no || ''), name: String(item?.module_name || item?.name || ''), fields: [],
  }));
  const companyProposals = proposals.filter(proposal => proposal?.target_type === 'company');

  const normalizeEntry = (entry, itemProposals, defaultTotal, fields = []) => {
    const missingKeys = Array.isArray(entry?.missing_field_keys) ? entry.missing_field_keys.map(String) : [];
    const suppliedMissingLabels = Array.isArray(entry?.missing_field_labels) ? entry.missing_field_labels.map(String) : [];
    const missingLabels = suppliedMissingLabels.length ? suppliedMissingLabels : missingKeys.map(key =>
      fields.find(field => String(field.key) === key)?.label || key);
    const total = nonNegativeCount(entry?.total, defaultTotal);
    const filledFallback = Array.isArray(entry?.missing_field_keys) ? Math.max(0, total - missingKeys.length) : 0;
    return {
      filled: Math.min(total, nonNegativeCount(entry?.filled, filledFallback)),
      total,
      missing_field_keys: missingKeys,
      missing_field_labels: missingLabels,
      proposal_count: nonNegativeCount(entry?.proposal_count, itemProposals.length),
      applied_count: nonNegativeCount(entry?.applied_count,
        itemProposals.filter(proposal => applied.has(String(proposal?.id))).length),
    };
  };

  const companyFields = [
    { key: 'industry', label: '行业' }, { key: 'revenue', label: '年营收' }, { key: 'employees', label: '员工人数' },
  ];
  const company = normalizeEntry(rawCompany, companyProposals, 3, companyFields);
  const normalizedModules = moduleOrder.filter(module => module?.no).map(module => {
    const moduleNo = String(module.no);
    const entry = rawByNo.get(moduleNo) || {};
    const itemProposals = proposals.filter(proposal => researchProposalModuleNo(proposal) === moduleNo);
    return {
      module_no: moduleNo,
      module_name: String(entry.module_name || entry.name || module.name || moduleName(moduleNo) || '经营模块'),
      ...normalizeEntry(entry, itemProposals, Array.isArray(module.fields) && module.fields.length ? module.fields.length : 4,
        Array.isArray(module.fields) ? module.fields : []),
    };
  });
  return { company, modules: normalizedModules };
}

function normalizeConfidence(value) {
  const raw = Number(value);
  if (!Number.isFinite(raw)) return 0;
  return Math.max(0, Math.min(100, raw > 0 && raw <= 1 ? Math.round(raw * 100) : Math.round(raw)));
}

function proposalTargetKey(proposal) {
  return `${proposal?.target_type || 'unknown'}:${proposal?.target_key || ''}`;
}

function proposalPreselected(proposal, conflicting = false) {
  return !conflicting && Array.isArray(proposal?.source_keys) && proposal.source_keys.length > 0 &&
    normalizeConfidence(proposal?.confidence) >= 80 && !String(proposal?.current_value ?? '').trim();
}

function safeSourceUrl(value) {
  try {
    const parsed = new URL(String(value || ''));
    return parsed.protocol === 'https:' ? parsed.href : '';
  } catch {
    return '';
  }
}

function researchConnectionActive(value) {
  if (value === true) return true;
  if (value && typeof value === 'object') {
    return value.connected === true || value.enabled === true ||
      ['connected', 'enabled', 'available', 'ready'].includes(String(value.status || '').toLowerCase());
  }
  return ['connected', 'enabled', 'available', 'ready'].includes(String(value || '').toLowerCase());
}

function researchStatusLabel(status) {
  return ({
    queued: '等待开始', running: '正在调研', searching: '正在联网查询', extracting: '正在整理候选',
    review_required: '等待人工确认', ready: '等待人工确认', completed: '等待人工确认',
    ready_for_review: '等待人工确认', needs_entity_confirmation: '需要确认企业主体',
    partial: '公开资料不足', applied: '已写入系统', failed: '调研失败', cost_uncertain: '调用状态待核查',
  })[String(status || '')] || '尚未开始';
}

function entityNeedsHint(job) {
  return job?.status === 'needs_entity_confirmation'
    || ['ambiguous', 'multiple', 'needs_hint'].includes(String(job?.entity_status || '').toLowerCase());
}

function researchNeedsRecoveryHint(job) {
  const entityStatus = String(job?.entity_status || '').toLowerCase();
  return entityNeedsHint(job)
    || (String(job?.status || '').toLowerCase() === 'partial' && entityStatus !== 'matched');
}

function researchEntityCandidateCount(job) {
  if (Array.isArray(job?.candidates)) return job.candidates.length;
  if (Array.isArray(job?.entity_candidates)) return job.entity_candidates.length;
  return 0;
}

function researchRecoveryTitle(job) {
  if (String(job?.status || '').toLowerCase() === 'partial'
    || String(job?.entity_status || '').toLowerCase() === 'not_found') {
    return '还需要一个线索才能找到这家公司';
  }
  return String(job?.entity_status || '').toLowerCase() === 'ambiguous'
    && researchEntityCandidateCount(job) > 1
    ? '发现多个可能的企业主体'
    : '企业主体仍需进一步确认';
}

function runResearchWithRequiredHint(value, runner = runResearch) {
  const hint = String(value || '').trim();
  if (!hint) return false;
  runner(hint);
  return true;
}

function hasResearchConflicts(job) {
  if (Array.isArray(job?.conflicts)) return job.conflicts.length > 0;
  return Boolean(job?.conflicts);
}

function researchNeedsAttention(job) {
  if (!job || typeof job !== 'object') return false;
  if (researchNeedsRecoveryHint(job)) return true;
  return new Set([
    'queued', 'running', 'searching', 'extracting', 'ready', 'ready_for_review',
    'review_required', 'completed', 'needs_entity_confirmation', 'ambiguous', 'partial', 'cost_uncertain',
  ]).has(String(job.status || '').toLowerCase());
}

function researchRunningIsStale(job, now = Date.now()) {
  if (String(job?.status || '').toLowerCase() !== 'running' || !job?.created_at) return false;
  const raw = String(job.created_at);
  const timestamp = Date.parse(raw.includes('T') ? raw : `${raw.replace(' ', 'T')}Z`);
  return Number.isFinite(timestamp) && now - timestamp > 15 * 60 * 1000;
}

function researchSummary(job) {
  if (typeof job?.summary === 'string') return job.summary;
  if (job?.summary && typeof job.summary === 'object') return job.summary.text || job.summary.message || '';
  return typeof job?.error_message === 'string' ? job.error_message : '';
}

function researchTargetLabel(proposal) {
  const companyLabels = { industry: '企业概况 · 行业', revenue: '企业概况 · 年营收', employees: '企业概况 · 员工人数' };
  const key = String(proposal?.target_key || '');
  if (proposal?.target_type === 'company') return companyLabels[key] || `企业概况 · ${key || '未命名字段'}`;
  const match = /^(\d{2})[.:/](.+)$/.exec(key);
  const moduleNo = match?.[1] || key.slice(0, 2);
  const fieldKey = match?.[2] || key.replace(/^\d{2}[.:/]?/, '');
  const businessModule = (S.meta?.modules || []).find(module => module.no === moduleNo);
  const field = businessModule?.fields?.find(candidate => candidate.key === fieldKey);
  return `${moduleNo || '十部'} ${businessModule?.name || '经营模块'} · ${field?.label || fieldKey || '未命名字段'}`;
}

function researchConflictState(data) {
  const keys = new Set();
  const counts = new Map();
  for (const proposal of data.proposals) {
    const key = proposalTargetKey(proposal);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  for (const [key, count] of counts) if (count > 1) keys.add(key);
  const proposalKeys = new Set(data.proposals.map(proposalTargetKey));
  const targetKeyMatches = new Map();
  for (const proposal of data.proposals) {
    const targetKey = String(proposal?.target_key || '');
    if (!targetKeyMatches.has(targetKey)) targetKeyMatches.set(targetKey, []);
    targetKeyMatches.get(targetKey).push(proposalTargetKey(proposal));
  }
  const supplied = data.job?.conflicts;
  let unmappedCount = 0;
  if (Array.isArray(supplied)) {
    supplied.forEach(conflict => {
      let key = '';
      if (typeof conflict === 'string') {
        const value = conflict.trim();
        if (proposalKeys.has(value)) key = value;
        else if (value.startsWith('module:') && proposalKeys.has(`module_input:${value.slice(7)}`)) {
          key = `module_input:${value.slice(7)}`;
        } else {
          const matches = targetKeyMatches.get(value) || [];
          if (matches.length === 1) key = matches[0];
        }
      } else if (conflict && typeof conflict === 'object') {
        const targetType = conflict.target_type === 'module' ? 'module_input' : conflict.target_type || 'module_input';
        const candidate = `${targetType}:${conflict.target_key || ''}`;
        if (proposalKeys.has(candidate)) key = candidate;
      }
      if (key) keys.add(key);
      else unmappedCount += 1;
    });
  }
  return {
    keys,
    hasUnmapped: unmappedCount > 0,
    count: keys.size + unmappedCount,
  };
}

function safeResearchProposalIds(data) {
  const conflictState = researchConflictState(data);
  if (conflictState.hasUnmapped) return [];
  return data.proposals.filter(proposal => proposal?.id !== undefined &&
    proposalPreselected(proposal, conflictState.keys.has(proposalTargetKey(proposal)))).map(proposal => proposal.id);
}

function researchReviewStats(data) {
  const conflictState = researchConflictState(data);
  const modules = new Set(data.proposals.map(researchProposalModuleNo).filter(Boolean));
  const backendConflictCount = nonNegativeCount(data.stats?.conflict_count, 0);
  return {
    sources: data.sources.length,
    proposals: data.proposals.length,
    safe: safeResearchProposalIds(data).length,
    conflicts: Math.max(conflictState.count, backendConflictCount),
    modules: modules.size,
  };
}

function researchSelectionStats(data, selectedIds) {
  const selected = new Set((Array.isArray(selectedIds) ? selectedIds : []).map(id => String(id)));
  const proposals = data.proposals.filter(proposal => selected.has(String(proposal?.id)));
  return {
    count: proposals.length,
    modules: new Set(proposals.map(researchProposalModuleNo).filter(Boolean)).size,
  };
}

function researchStatsHtml(data) {
  const stats = researchReviewStats(data);
  const items = [
    ['公开来源', stats.sources, '条'], ['候选建议', stats.proposals, '条'], ['安全预选', stats.safe, '条'],
    ['冲突字段', stats.conflicts, '处'], ['涉及模块', stats.modules, '/ 10'],
  ];
  return `<section class="research-stats" aria-label="本次调研概览">${items.map(([label, value, unit], index) =>
    `<div class="research-stat ${index === 3 && value ? 'warn' : ''}"><span>${esc(label)}</span><b>${esc(value)}</b><small>${esc(unit)}</small></div>`).join('')}</section>`;
}

function researchCoverageHtml(data, { applied = false } = {}) {
  const coverage = data.coverage || { company: {}, modules: [] };
  const company = coverage.company || {};
  const missingText = item => {
    const labels = Array.isArray(item?.missing_field_labels) ? item.missing_field_labels.filter(Boolean) : [];
    if (labels.length) return `仍需内部补充：${labels.join('、')}`;
    const remaining = Math.max(0, nonNegativeCount(item?.total) - nonNegativeCount(item?.filled));
    return remaining ? `仍有 ${remaining} 项需内部补充` : '经营资料已齐';
  };
  const stateText = item => item.applied_count > 0 ? `本次写入 ${item.applied_count} 项`
    : item.proposal_count > 0 ? `发现 ${item.proposal_count} 条待确认建议`
    : '本次公开资料未覆盖';
  const companyCard = `<article class="research-coverage-card company ${company.applied_count ? 'applied' : company.proposal_count ? 'proposed' : ''}">
    <div class="research-coverage-card-head"><div><span class="research-coverage-no">企业</span><h4>企业概况</h4></div>
      <b>${esc(company.filled || 0)} / ${esc(company.total || 3)}</b></div>
    <p>${esc(stateText(company))}</p><small>${esc(missingText(company))}</small>
    ${!applied && company.proposal_count ? '<a href="#research-company-proposals">查看企业候选 →</a>' : ''}</article>`;
  const moduleCards = (coverage.modules || []).map(module => {
    const changed = nonNegativeCount(module.applied_count) > 0;
    const proposed = nonNegativeCount(module.proposal_count) > 0;
    return `<article class="research-coverage-card ${changed ? 'applied' : proposed ? 'proposed' : ''}">
      <div class="research-coverage-card-head"><div><span class="research-coverage-no">${esc(module.module_no)}</span><h4>${esc(module.module_name)}</h4></div>
        <b>${esc(module.filled)} / ${esc(module.total)}</b></div>
      <p>${esc(stateText(module))}</p><small>${esc(missingText(module))}</small>
      ${applied && changed
        ? `<button type="button" class="research-module-cta" data-research-module="${esc(module.module_no)}">进入模块详情 →</button>`
        : !applied && proposed ? `<a href="#research-module-${esc(module.module_no)}">查看模块候选 →</a>` : ''}</article>`;
  }).join('');
  return `<section class="card research-coverage" aria-labelledby="research-coverage-title">
    <div class="research-coverage-heading"><div><h3 id="research-coverage-title">企业概况与十大模块覆盖</h3>
      <p>只把公开来源直接支持的事实列为候选；未覆盖项明确留给企业内部补充。</p></div>
      <span class="rulechip">经营资料覆盖</span></div>
    <div class="research-coverage-grid">${companyCard}${moduleCards}</div></section>`;
}

function researchSourceTypeLabel(value) {
  return ({ government: '政府公开信息', regulator: '监管机构', exchange: '交易所披露',
    company_official: '企业官网', commercial_database: '商业数据库', media: '公开媒体', other: '其他公开来源' })[String(value || '')] || value || '';
}

function researchSourceHtml(source, index) {
  const url = safeSourceUrl(source?.url);
  let host = String(source?.host || '');
  if (!host && url) {
    try { host = new URL(url).hostname; } catch { host = ''; }
  }
  const title = String(source?.title || host || '未命名公开来源');
  const meta = [researchSourceTypeLabel(source?.source_type), host, source?.published_at && `发布 ${source.published_at}`,
    source?.retrieved_at && `检索 ${source.retrieved_at}`].filter(Boolean);
  const titleHtml = url
    ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(title)} <span aria-hidden="true">↗</span></a>`
    : `<span>${esc(title)}</span>`;
  return `<article class="research-source" id="research-source-${index}">
    <div class="research-source-title">${titleHtml}</div>
    <div class="research-source-meta">${meta.map(esc).join(' · ') || '公开来源'}</div>
    ${source?.excerpt ? `<p>${esc(source.excerpt)}</p>` : ''}
  </article>`;
}

function researchConnectionsHtml(data) {
  const configured = S.meta?.research || {};
  const deepseek = data.connections.deepseek ?? configured.enabled;
  const connectors = configured.connectors || {};
  const items = [
    ['继涛博士 Web Search', deepseek],
    ['天眼查', data.connections.tianyancha ?? connectors.tianyancha],
    ['Choice', data.connections.choice ?? connectors.choice],
  ];
  return `<div class="research-connections" aria-label="公开资料连接状态">${items.map(([name, value]) => {
    const active = researchConnectionActive(value);
    return `<span class="research-connection ${active ? 'on' : 'off'}"><i aria-hidden="true"></i>${esc(name)}：${active ? '已连接' : '未连接'}</span>`;
  }).join('')}</div>`;
}

function researchSourcesSection(data) {
  return `<section class="card research-sources" aria-labelledby="research-sources-title">
    <h3 id="research-sources-title">公开资料来源 <span class="rulechip">${esc(data.sources.length)} 条</span></h3>
    ${data.sources.length
      ? `<div class="research-source-list">${data.sources.map(researchSourceHtml).join('')}</div>`
      : '<p class="research-empty">当前没有可核验的公开来源。</p>'}
  </section>`;
}

function researchEntityCandidatesHtml(job) {
  const candidates = Array.isArray(job?.candidates)
    ? job.candidates
    : Array.isArray(job?.entity_candidates) ? job.entity_candidates : [];
  if (!candidates.length) return '';
  return `<div class="research-entity-candidates" aria-label="可能的企业主体">${candidates.map(candidate => {
    const label = typeof candidate === 'string' ? candidate : candidate.entity_name || candidate.name || candidate.hint || '候选企业';
    const detail = typeof candidate === 'object'
      ? [candidate.confidence !== undefined && `置信度 ${normalizeConfidence(candidate.confidence)}%`, candidate.reason || candidate.summary || candidate.region]
        .filter(Boolean).join(' · ')
      : '';
    return `<article class="research-entity-candidate">
      <b>${esc(label)}</b>${detail ? `<span>${esc(detail)}</span>` : ''}</article>`;
  }).join('')}</div>`;
}

function researchProposalHtml(data, { readOnly = false } = {}) {
  const conflictState = researchConflictState(data);
  const conflicts = conflictState.keys;
  const sourceIndex = new Map(data.sources.map((source, index) => [String(source.source_key), index]));
  const targetGroups = new Map();
  for (const proposal of data.proposals) {
    const key = proposalTargetKey(proposal);
    if (!targetGroups.has(key)) targetGroups.set(key, []);
    targetGroups.get(key).push(proposal);
  }
  let groupIndex = 0;
  const fieldsetHtml = ([key, proposals]) => {
    const conflicting = conflicts.has(key) || proposals.length > 1;
    return `<fieldset class="research-field ${conflicting ? 'has-conflict' : ''}">
      <legend>${esc(researchTargetLabel(proposals[0]))}${conflicting ? '<span class="research-conflict">存在冲突，请只选一项</span>' : ''}</legend>
      ${proposals.map(proposal => {
        const confidence = normalizeConfidence(proposal.confidence);
        const tone = confidence >= 80 ? 'high' : confidence >= 60 ? 'medium' : 'low';
        const sourceKeys = Array.isArray(proposal.source_keys) ? proposal.source_keys : [];
        const inputType = conflicting ? 'radio' : 'checkbox';
        const safe = proposalPreselected(proposal, conflicting || conflictState.hasUnmapped);
        const checked = safe && !readOnly ? ' checked' : '';
        const disabled = readOnly || !sourceKeys.length;
        const moduleNo = researchProposalModuleNo(proposal);
        return `<label class="research-proposal">
          <input type="${inputType}" name="research-field-${groupIndex}" data-proposal-id="${esc(proposal.id)}"
            data-safe-proposal="${safe ? 'true' : 'false'}" data-module-no="${esc(moduleNo)}" data-research-control${checked}${disabled ? ' disabled' : ''}>
          <span class="research-proposal-body"><span class="research-proposal-value">${esc(proposal.proposed_value)}</span>
            ${String(proposal.current_value ?? '').trim() ? `<span class="research-current">当前值：${esc(proposal.current_value)}</span>` : ''}
            <span class="research-confidence ${tone}">置信度 ${confidence}%</span>
            ${proposal.reason ? `<span class="research-reason">${esc(proposal.reason)}</span>` : ''}
            <span class="research-citations">${sourceKeys.length ? sourceKeys.map(keyValue => {
              const index = sourceIndex.get(String(keyValue));
              return index === undefined ? `<span>${esc(keyValue)}</span>` : `<a href="#research-source-${index}">${esc(keyValue)}</a>`;
            }).join(' ') : '<span class="missing">无来源，不建议写入</span>'}</span>
          </span>
        </label>`;
      }).join('')}${readOnly ? '<span class="sr-only">顾问只读，不能选择或写入</span>' : ''}
    </fieldset>`;
  };
  const companyGroups = [...targetGroups].filter(([, proposals]) => proposals[0]?.target_type === 'company');
  const moduleGroups = new Map();
  const otherGroups = [];
  for (const entry of targetGroups) {
    if (entry[1][0]?.target_type === 'company') continue;
    const moduleNo = researchProposalModuleNo(entry[1][0]);
    if (!moduleNo) { otherGroups.push(entry); continue; }
    if (!moduleGroups.has(moduleNo)) moduleGroups.set(moduleNo, []);
    moduleGroups.get(moduleNo).push(entry);
  }
  const orderedModuleNos = [
    ...(S.meta?.modules || []).map(module => String(module.no)),
    ...[...moduleGroups.keys()].filter(no => !(S.meta?.modules || []).some(module => String(module.no) === no)),
  ];
  const sections = [];
  if (companyGroups.length) {
    sections.push(`<section class="research-proposal-group" id="research-company-proposals">
      <div class="research-proposal-group-head"><div><span>企业概况</span><h3>企业基础资料候选</h3></div><b>${companyGroups.reduce((sum, [, items]) => sum + items.length, 0)} 条</b></div>
      <div class="research-proposal-list">${companyGroups.map(entry => { const html = fieldsetHtml(entry); groupIndex += 1; return html; }).join('')}</div></section>`);
  }
  for (const moduleNo of orderedModuleNos) {
    const entries = moduleGroups.get(moduleNo);
    if (!entries?.length) continue;
    sections.push(`<section class="research-proposal-group" id="research-module-${esc(moduleNo)}">
      <div class="research-proposal-group-head"><div><span>${esc(moduleNo)} 经营模块</span><h3>${esc(moduleName(moduleNo) || '经营资料')}候选</h3></div>
        <b>${entries.reduce((sum, [, items]) => sum + items.length, 0)} 条</b></div>
      <div class="research-proposal-list">${entries.map(entry => { const html = fieldsetHtml(entry); groupIndex += 1; return html; }).join('')}</div></section>`);
  }
  if (otherGroups.length) {
    sections.push(`<section class="research-proposal-group"><div class="research-proposal-group-head"><div><span>其他</span><h3>待核对候选</h3></div></div>
      <div class="research-proposal-list">${otherGroups.map(entry => { const html = fieldsetHtml(entry); groupIndex += 1; return html; }).join('')}</div></section>`);
  }
  return `<div class="research-proposal-sections">${sections.join('')}</div>`;
}

async function runResearch(entityHint = '') {
  const cid = S.cid;
  const seq = ++S.renderSeq;
  S.researchAutoStart = false;
  root().innerHTML = shell(`<section class="research-screen" aria-labelledby="research-title">
    <div class="co"><h1 id="research-title">AI 公开调研</h1><span>继涛博士 Web Search</span></div>
    <div class="research-progress" role="status" aria-live="polite"><span class="spin" aria-hidden="true"></span><div>
      <b>正在联网查询公开信息…</b><span>正在核对企业主体、公开披露和可对齐到十部经营模块的事实。</span></div></div>
    <p class="research-privacy">所有结果先进入候选区，未经你的明确确认不会写入企业档案。</p></section>`);
  bindShell();
  const hint = String(entityHint || '').trim();
  const idempotencyKey = globalThis.crypto?.randomUUID?.() || `research-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  try {
    await api(`/api/companies/${cid}/research/start`, {
      method: 'POST',
      body: hint ? { entity_hint: hint } : {},
      headers: { 'Idempotency-Key': idempotencyKey },
    });
    if (seq === S.renderSeq && String(cid) === String(S.cid) && S.view === 'research') await viewResearch(seq);
  } catch (error) {
    if (seq !== S.renderSeq || error.status === 401) return;
    const uncertain = ['timeout', 'network_error'].includes(String(error.code || ''));
    root().innerHTML = shell(`<section class="research-screen"><div class="co"><h1>AI 公开调研</h1></div>
      <div class="msg msg-e" role="alert">${esc(error.message || '公开调研暂时失败')}</div>
      <button class="btn btn-g" type="button" id="researchretry" style="margin-top:14px">${uncertain ? '查看调研记录' : '重新尝试'}</button></section>`);
    bindShell();
    $('#researchretry').onclick = () => uncertain ? render() : runResearch(hint);
  }
}

function selectedResearchProposalIds() {
  return [...root().querySelectorAll('[data-proposal-id]:checked')]
    .map(input => input.dataset.proposalId).filter(Boolean);
}

function updateResearchSelection(data) {
  const selectedIds = selectedResearchProposalIds();
  const selection = researchSelectionStats(data, selectedIds);
  const status = $('#researchselection');
  if (status) status.textContent = `已选择 ${selection.count} 条候选，覆盖 ${selection.modules} 个经营模块`;
  const apply = $('#researchapply');
  if (apply && apply.dataset.submitting !== 'true') apply.disabled = selection.count === 0;
}

function setResearchControlsLocked(locked) {
  const review = $('.research-review');
  if (!review) return;
  review.setAttribute('aria-busy', locked ? 'true' : 'false');
  root().querySelectorAll('button, input, select').forEach(control => {
    if (locked) {
      if (control.dataset.researchWasDisabled === undefined) {
        control.dataset.researchWasDisabled = control.disabled ? 'true' : 'false';
      }
      control.disabled = true;
    } else if (control.dataset.researchWasDisabled !== undefined) {
      control.disabled = control.dataset.researchWasDisabled === 'true';
      delete control.dataset.researchWasDisabled;
    }
  });
}

async function applyResearch(data) {
  const job = data.job;
  const status = $('#researchapplystatus');
  if (!job || entityNeedsHint(job)) {
    setMessage(status, '请先确认唯一企业主体，再写入系统。');
    return;
  }
  const proposalIds = selectedResearchProposalIds()
    .map(value => /^\d+$/.test(value) ? Number(value) : value);
  if (!proposalIds.length) {
    setMessage(status, '请至少勾选一条有来源的候选信息。');
    return;
  }
  if (!job.result_hash) {
    setMessage(status, '调研结果版本缺失，请重新调研后再确认。');
    return;
  }
  const button = $('#researchapply');
  button.dataset.submitting = 'true';
  setResearchControlsLocked(true);
  button.textContent = '正在写入…';
  try {
    await api(`/api/companies/${S.cid}/research/${encodeURIComponent(job.id)}/apply`, {
      method: 'POST', body: { proposal_ids: proposalIds, result_hash: job.result_hash },
    });
    await boot(S.cid, 'research');
  } catch (error) {
    if (error.status !== 401) {
      setMessage(status, error.message || '写入失败，请刷新后重试');
      setResearchControlsLocked(false);
      button.dataset.submitting = 'false';
      button.textContent = '确认写入已选信息';
      updateResearchSelection(data);
    }
  }
}

async function viewResearch(seq) {
  if (S.researchAutoStart && !isRO()) {
    S.researchAutoStart = false;
    await runResearch();
    return;
  }
  const payload = normalizeResearch(await api(`/api/companies/${S.cid}/research`));
  if (seq !== S.renderSeq || S.view !== 'research') return;
  const job = payload.job;
  const ro = isRO();
  const status = String(job?.status || '');
  const running = ['queued', 'running', 'searching', 'extracting'].includes(status);
  const recoveredRunning = running && S.researchRecovered;
  const staleRunning = researchRunningIsStale(job);
  const applied = status === 'applied';
  const needsRecoveryHint = researchNeedsRecoveryHint(job);
  const summary = researchSummary(job);
  const confidence = normalizeConfidence(job?.entity_confidence);

  let body = '';
  if (!job) {
    body = `<section class="card research-empty-state"><h2>用企业名称启动公开信息调研</h2>
      <p>继涛博士 将联网查询公开披露，形成带来源、置信度和当前值对照的候选信息。</p>
      ${ro ? '<div class="msg msg-i">顾问账号可以查看调研结果，但只有企业主可以启动和确认写入。</div>'
        : '<button class="btn" type="button" id="researchstart">启动 AI 公开调研</button>'}</section>`;
  } else if (running) {
    body = `<div class="research-progress" role="status" aria-live="polite"><span class="spin" aria-hidden="true"></span><div>
      <b>${esc(researchStatusLabel(status))}</b><span>${esc(summary || '正在检索、比对并整理公开信息，请稍候。')}</span></div></div>
      ${recoveredRunning ? '<div class="msg msg-i">已恢复刷新前的调研状态。系统只读取服务端进度，不会自动重复调用 继涛博士，避免产生重复费用。</div>' : ''}
      ${staleRunning ? '<div class="msg msg-e">该任务已长时间没有完成。确认重新发起可能产生新的模型调用费用，系统不会自动操作。</div>' : ''}
      <button class="btn btn-g" type="button" id="researchrefresh">刷新进度</button>
      ${staleRunning && !ro ? '<button class="btn btn-g" type="button" id="researchrestart" style="margin-left:8px">确认后重新发起</button>' : ''}`;
  } else if (needsRecoveryHint) {
    body = `<section class="card research-ambiguous" aria-labelledby="entity-match-title">
      <h2 id="entity-match-title">${esc(researchRecoveryTitle(job))}</h2>
      <p>${esc(summary || '现有公开证据不足。请补充一个可核验线索后重新查询。')}</p>
      ${researchEntityCandidatesHtml(job)}
      ${ro ? '<div class="msg msg-i">只有企业主可以补充线索并重新调研。</div>' : `<label class="f" for="entityhint">补充识别线索</label>
        <input class="f" id="entityhint" maxlength="500" aria-describedby="entityhinthelp" placeholder="所在城市 / 18位统一社会信用代码 / 股票代码 / 官网 https://…">
        <div class="sub" id="entityhinthelp">请手动填写所在城市、18位统一社会信用代码、股票代码或官网 HTTPS 地址中的至少一项。候选名称仅供查看，不会自动作为新线索；你的输入只用于再次公开核验，不会直接加入来源或写入企业资料。</div>
        <button class="btn" type="button" id="researchrefine">带线索重新调研</button>
        <div id="researchrefinestatus" aria-live="polite"></div>`}
      <div class="msg msg-e">主体未确认，当前禁止写入任何企业资料。</div>
    </section>${researchSourcesSection(payload)}`;
  } else if (applied) {
    const appliedCount = Math.max(nonNegativeCount(payload.stats?.applied_count), payload.appliedProposalIds.length,
      nonNegativeCount(payload.coverage?.company?.applied_count) + (payload.coverage?.modules || [])
        .reduce((sum, module) => sum + nonNegativeCount(module.applied_count), 0));
    const affectedModules = (payload.coverage?.modules || []).filter(module => module.applied_count > 0).length;
    body = `<section class="card research-applied"><div class="research-success" aria-hidden="true">✓</div>
      <h2>已按你的确认写入系统</h2><p>${esc(summary || '已选公开信息已对齐企业档案和十部经营输入，未选择的候选保持不变。')}</p>
      <div class="research-applied-count">本次写入 <b>${esc(appliedCount)}</b> 条资料${affectedModules ? `，更新 <b>${esc(affectedModules)}</b> 个经营模块` : ''}</div>
      ${ro ? '' : '<button class="btn btn-g" type="button" id="researchagain">重新调研</button>'}</section>
      ${researchCoverageHtml(payload, { applied: true })}
      ${researchSourcesSection(payload)}`;
  } else if (payload.proposals.length) {
    const reviewStats = researchReviewStats(payload);
    body = `<section class="research-review" aria-labelledby="research-review-title">
      <div class="card research-entity"><div><span class="research-eyebrow">企业主体匹配</span>
        <h2 id="research-review-title">${esc(job.entity_name || '企业名称待核对')}</h2>
        <p>${esc(summary || '请逐项检查候选值和公开来源。')}</p></div>
        <div class="research-score"><b>${confidence}%</b><span>主体置信度</span></div></div>
      ${hasResearchConflicts(job) ? '<div class="msg msg-i">部分公开来源存在冲突，冲突字段不会默认选择，请逐项核对。</div>' : ''}
      <div class="research-review-note">高置信且当前为空的字段已预选；已有值、低置信和冲突项默认不选。最终写入必须由你明确确认。</div>
      ${researchStatsHtml(payload)}
      ${researchCoverageHtml(payload)}
      <div class="research-candidate-heading"><div><h3>逐模块审核候选资料</h3><p>候选值按企业概况和经营模块分区，点击来源编号可核对原始公开资料。</p></div>
        <button class="btn btn-g" type="button" id="researchselectsafe" data-research-control
          ${ro || reviewStats.safe === 0 ? 'disabled' : ''}>勾选全部安全建议</button></div>
      <div class="research-selection" id="researchselection" role="status" aria-live="polite" aria-atomic="true"></div>
      ${researchProposalHtml(payload, { readOnly: ro })}
      <div class="research-applybar"><div><b>确认后才会写入</b><span>未勾选内容保持不变，来源记录会继续保留。</span></div>
        ${ro ? '<span class="rolepill">顾问 · 只读，不能选择或写入</span>' : '<button class="btn" type="button" id="researchapply" data-research-control>确认写入已选信息</button>'}</div>
      <div id="researchapplystatus" aria-live="polite"></div>
    </section>${researchSourcesSection(payload)}`;
  } else {
    const emptyTitle = status === 'partial' && job.entity_status === 'matched' ? '已确认主体，暂时没有可写入字段'
      : status === 'failed' ? '本次调研未完成'
      : status === 'cost_uncertain' ? '本次调用状态待核查' : '没有找到可安全写入的资料';
    body = `<section class="card research-empty-state"><h2>${emptyTitle}</h2>
      <p>${esc(summary || '系统没有形成同时具备公开来源和明确字段映射的候选信息，因此不会自动填写。')}</p>
      ${status === 'cost_uncertain' ? '<div class="msg msg-i">系统没有自动重试，避免同一次调研被重复计费。请先核查 继涛博士 调用记录，再决定是否重新发起。</div>' : ''}
      ${ro ? '' : `<button class="btn btn-g" type="button" id="researchagain">${status === 'cost_uncertain' ? '确认后重新调研' : '重新调研'}</button>`}</section>
      ${researchSourcesSection(payload)}`;
  }

  root().innerHTML = shell(`<section class="research-screen"><div class="research-heading"><div>
    <div class="co"><h1>AI 公开调研</h1><span>${esc(job?.entity_name || '联网核对企业公开信息')}</span></div>
    <div class="sub">公开信息仅供核对，确认前不会写入企业档案或十部输入</div></div>
    <span class="research-status">${esc(researchStatusLabel(status))}</span></div>
    ${researchConnectionsHtml(payload)}${body}</section>`);
  bindShell();
  const start = $('#researchstart'); if (start) start.onclick = () => runResearch();
  const refresh = $('#researchrefresh'); if (refresh) refresh.onclick = () => render();
  const restart = $('#researchrestart'); if (restart) restart.onclick = () => {
    if (confirm('当前任务可能已经产生费用。确认重新发起一次新的 继涛博士 公开调研吗？')) runResearch();
  };
  const again = $('#researchagain'); if (again) again.onclick = () => runResearch();
  const refine = $('#researchrefine'); if (refine) refine.onclick = () => {
    const input = $('#entityhint');
    if (!runResearchWithRequiredHint(input?.value)) {
      setMessage($('#researchrefinestatus'), '请先填写所在城市、18位统一社会信用代码、股票代码或官网 HTTPS 地址中的至少一项。');
      input?.focus();
    }
  };
  const apply = $('#researchapply'); if (apply) apply.onclick = () => applyResearch(payload);
  const selectSafe = $('#researchselectsafe'); if (selectSafe && !ro) selectSafe.onclick = () => {
    const safeIds = new Set(safeResearchProposalIds(payload).map(id => String(id)));
    root().querySelectorAll('[data-proposal-id]').forEach(input => {
      if (!input.disabled && safeIds.has(String(input.dataset.proposalId))) input.checked = true;
    });
    updateResearchSelection(payload);
  };
  root().querySelectorAll('[data-proposal-id]').forEach(input => {
    input.addEventListener('change', () => updateResearchSelection(payload));
  });
  if (payload.proposals.length && !applied) updateResearchSelection(payload);
  root().querySelectorAll('[data-research-module]').forEach(button => {
    button.onclick = () => go('detail', button.dataset.researchModule);
  });
  if (!running) S.researchRecovered = false;
  if (running) setTimeout(() => {
    if (seq === S.renderSeq && S.view === 'research' && String(S.cid) === String(job?.company_id ?? S.cid)) render();
  }, 2500);
}

/* ───────── 工作台列表 ───────── */
async function viewWbs(seq) {
  const d = await api(`/api/companies/${S.cid}/dashboard`);
  if (seq !== S.renderSeq) return;
  root().innerHTML = shell(`
    <div class="board-heading"><div>
    <div class="co"><h1>十部工作台</h1><span>${esc(d.company.name)}</span></div>
    <div class="sub">每个工作台产出一个错点 + 一张六列承诺表，不产出长篇报告</div>
    </div><div class="board-tools" aria-label="工作台导出">
      <button class="btn" type="button" id="exportsequoia">导出红杉融资BP</button>
    </div></div>
    <div id="boardactionstatus" class="action-status" aria-live="polite"></div>
    <div class="wbs">${d.by_module.map(m => `
      <button type="button" class="wb" data-m="${esc(m.no)}"><span class="no">${esc(m.no)}</span>
        <span class="nm">${esc(m.name)}${m.notes ? ` <span class="nb">✎${esc(m.notes)}</span>` : ''}</span><span class="sl">${esc(m.slogan)}</span>
        <span class="wb-progress"><span><b>经营资料</b>${esc(nonNegativeCount(m.inputs_filled))} / ${esc(nonNegativeCount(m.inputs_total, 4))}</span>
          <span><b>诊断</b>${m.diagnosed ? '已生成' : '未生成'}</span></span>
        <span class="fo">${m.diagnosed && m.total ? `${esc(m.done)}/${esc(m.total)} 条承诺已兑现`
          : m.diagnosed ? '<span style="color:var(--crit)">尚无承诺认领</span>'
          : '<span style="color:var(--muted)">补齐经营资料后生成诊断</span>'}</span></button>`).join('')}</div>`);
  bindShell();
  const exportSequoia = $('#exportsequoia'); if (exportSequoia) exportSequoia.onclick = () => downloadSequoiaPptx(exportSequoia, $('#boardactionstatus'));
  root().querySelectorAll('.wb').forEach(w => w.onclick = () => go('detail', w.dataset.m));
}

/* ───────── 工作台详情 ───────── */
function generationFieldNames(items, fields = []) {
  if (!Array.isArray(items)) return [];
  const labels = items.map(item => {
    const source = item && typeof item === 'object' ? item : {};
    const rawKey = typeof item === 'string' ? item : source.field_key ?? source.key ?? source.target_key;
    const rawText = String(rawKey ?? '');
    const key = rawText.split(/[.:/]/).filter(Boolean).at(-1) || '';
    const known = fields.find(field => String(field.key) === key);
    const companyLabel = rawText.startsWith('company.') ? ({
      industry: '企业行业', revenue: '营收情况', employees: '员工人数',
    })[key] : '';
    return String(source.label ?? source.field_label ?? known?.label ?? (companyLabel || key)).trim();
  }).filter(Boolean);
  return [...new Set(labels)].slice(0, 20);
}

function generationBasisHtml(basis, missing, fields, titleId = 'generation-basis-title') {
  const basisObject = basis && typeof basis === 'object' && !Array.isArray(basis) ? basis : {};
  const usedItems = Array.isArray(basis) ? basis : basisObject.used_fact_ids;
  const missingItems = [
    ...(Array.isArray(missing) ? missing : []),
    ...(Array.isArray(basisObject.missing_field_keys) ? basisObject.missing_field_keys : []),
  ];
  const used = generationFieldNames(usedItems, fields);
  const absent = generationFieldNames(missingItems, fields);
  const note = String(basisObject.note || '').trim();
  if (!used.length && !absent.length) return '';
  return `<section class="generation-basis" aria-labelledby="${esc(titleId)}">
    <h3 id="${esc(titleId)}">生成依据</h3>
    ${used.length ? `<div class="generation-basis-row"><b>已使用</b><span>${used.map(label => `<i>${esc(label)}</i>`).join('')}</span></div>` : ''}
    ${absent.length ? `<div class="generation-basis-row missing"><b>还缺少</b><span>${absent.map(label => `<i>${esc(label)}</i>`).join('')}</span></div>
      <p>当前结果为待补充草案；补齐信息后请重新生成。</p>` : ''}
    ${note ? `<p class="generation-basis-note">${esc(note)}</p>` : ''}
  </section>`;
}

function generationProvenance(meta, st) {
  const generation = normalizeGenerationMeta(meta);
  const hasRecordedMode = Boolean(generation.mode || generation.model);
  const isBootstrap = generation.mode === 'bootstrap' || generation.provenance === 'bootstrap';
  const isMock = hasRecordedMode ? generationIsMock(generation) : S.meta?.llm?.mock === true;
  const label = isBootstrap
    ? String(generation.provenance_label || 'AI企业建档（公开资料+企业主确认）')
    : isMock
    ? '模拟演示，不是 继涛博士 诊断'
    : hasRecordedMode
      ? `继涛博士${generation.model ? ` · ${displayBrand(generation.model)}` : ''}`
      : '历史结果 · 诊断来源待核对';
  const details = [];
  const recordedAt = generation.completed_at || generation.created_at || (!hasRecordedMode ? st.generated_at : '');
  if (recordedAt) details.push(`生成于 ${recordedAt}`);
  if (generation.elapsed_ms !== null) details.push(`${(generation.elapsed_ms / 1000).toFixed(1)} 秒`);
  if (Number(generation.attempt) > 1) details.push(`重试 ${Number(generation.attempt) - 1} 次`);
  if (generation.already) details.push('已恢复既有结果，未重复调用');
  return { label, details: details.join(' · '), tone: isMock ? 'mock' : hasRecordedMode ? 'live' : 'unknown' };
}

function pledgeSourceLabel(value, bootstrapDraftId = null) {
  const source = String(value || '').toLowerCase();
  if (source === 'manual') return '手工';
  if (source === 'ai' && bootstrapDraftId !== null && bootstrapDraftId !== undefined) return 'AI企业建档';
  if (source === 'ai') return 'AI（可能含历史版本）';
  return '来源待核对';
}

function normalizeModuleInputApplications(payload, moduleNo) {
  const records = Array.isArray(payload?.input_signal_applications) ? payload.input_signal_applications
    : Array.isArray(payload?.signal_applications) ? payload.signal_applications : [];
  const result = new Map();
  for (const record of records) {
    const rawKey = String(record?.target_key || record?.field_key || '');
    const match = /^(\d{2})[.:/](.+)$/.exec(rawKey);
    const fieldKey = match ? match[1] === String(moduleNo) ? match[2] : '' : rawKey;
    if (!fieldKey) continue;
    let sourceKeys = record?.source_keys;
    if (!Array.isArray(sourceKeys) && typeof record?.source_keys_json === 'string') {
      try { sourceKeys = JSON.parse(record.source_keys_json); } catch { sourceKeys = []; }
    }
    const normalizedSources = Array.isArray(record?.sources) ? record.sources.map(source => ({
      key: String(source?.source_key || source?.key || ''), title: String(source?.title || ''),
      url: safeSourceUrl(source?.url),
    })).filter(source => source.key || source.url) : safeSourceUrl(record?.evidence_url) ? [{
      key: String(record?.evidence_source_key || ''), title: String(record?.evidence_title || ''),
      url: safeSourceUrl(record.evidence_url),
    }] : [];
    result.set(fieldKey, {
      label: String(record?.label || record?.signal_label || '公开资料建议'),
      value: String(record?.value || ''),
      source_keys: Array.isArray(sourceKeys) ? sourceKeys.map(String).filter(Boolean)
        : record?.evidence_source_key ? [String(record.evidence_source_key)] : [],
      sources: normalizedSources,
      evidence_quote: String(record?.evidence_quote || record?.exact_quote || ''),
      review_id: String(record?.review_id || ''),
      signal_id: String(record?.signal_id || record?.fact_id || ''),
      confirmed_at: String(record?.confirmed_at || record?.created_at || ''),
    });
  }
  const objectSource = payload?.input_provenance && typeof payload.input_provenance === 'object'
    ? payload.input_provenance : payload?.state?.input_provenance && typeof payload.state.input_provenance === 'object'
      ? payload.state.input_provenance : {};
  for (const [fieldKey, record] of Object.entries(objectSource)) {
    if (!record || typeof record !== 'object') continue;
    const normalizedSources = Array.isArray(record.sources) ? record.sources.map(source => ({
      key: String(source?.source_key || source?.key || ''), title: String(source?.title || ''),
      url: safeSourceUrl(source?.url),
    })).filter(source => source.key || source.url) : safeSourceUrl(record.evidence_url) ? [{
      key: String(record.evidence_source_key || ''), title: String(record.evidence_title || ''),
      url: safeSourceUrl(record.evidence_url),
    }] : [];
    result.set(fieldKey, {
      label: String(record.label || '公开资料建议'), value: String(record.value || ''),
      source_keys: Array.isArray(record.source_keys) ? record.source_keys.map(String).filter(Boolean)
        : record.evidence_source_key ? [String(record.evidence_source_key)] : [],
      sources: normalizedSources,
      evidence_quote: String(record.evidence_quote || record.exact_quote || ''),
      review_id: String(record.review_id || ''),
      signal_id: String(record.signal_id || record.fact_id || ''),
      confirmed_at: String(record.confirmed_at || ''),
    });
  }
  return result;
}

function moduleInputProvenanceHtml(record) {
  if (!record) return '';
  const detail = [record.source_keys.length ? `来源 ${record.source_keys.join('、')}` : '',
    record.confirmed_at ? `确认于 ${record.confirmed_at}` : ''].filter(Boolean).join(' · ');
  return `<div class="module-input-provenance"><b>公开资料建议 · 企业主已确认</b>
    ${detail ? `<span>${esc(detail)}</span>` : ''}
    ${record.evidence_quote ? `<blockquote>${esc(record.evidence_quote)}</blockquote>` : ''}
    ${record.sources.length ? `<span class="module-input-source-links">${record.sources.map(source => source.url
      ? `<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title || source.key || '打开公开来源')}</a>`
      : `<span>${esc(source.title || source.key)}</span>`).join('')}</span>` : ''}
    <button class="module-input-audit-link" type="button" data-open-bootstrap-source="${esc(record.signal_id)}">查看建档来源与审核记录${record.review_id ? ' · 审核记录已保存' : ''}</button></div>`;
}

function moduleBootstrapContextHtml(payload) {
  const workpaper = payload?.bootstrap_workpaper && typeof payload.bootstrap_workpaper === 'object'
    ? payload.bootstrap_workpaper : payload?.workpaper && typeof payload.workpaper === 'object' ? payload.workpaper : null;
  if (!workpaper) return '';
  const external = Array.isArray(workpaper.external_context_hypotheses) ? workpaper.external_context_hypotheses : [];
  const confirmable = Array.isArray(workpaper.owner_confirmable_signals) ? workpaper.owner_confirmable_signals : [];
  if (!external.length && !confirmable.length) return '';
  return `<section class="module-public-context" aria-label="本模块公开资料背景">
    <div><b>公开资料已整理</b><span>经营背景不会冒充企业内部数据</span></div>
    ${external.length ? `<h4>公开经营背景</h4>${bootstrapModuleListHtml(external, '')}` : ''}
    ${confirmable.length ? `<h4>可在 AI 企业建档中确认的经营输入建议</h4>${bootstrapModuleListHtml(confirmable, '')}
      <button class="btn btn-g" type="button" id="openbootstrapreview">前往 AI 企业建档审核</button>` : ''}</section>`;
}

function moduleFieldGuidanceHtml(payload, fieldKey, hasValue = false) {
  const workpaper = payload?.bootstrap_workpaper && typeof payload.bootstrap_workpaper === 'object'
    ? payload.bootstrap_workpaper : payload?.workpaper && typeof payload.workpaper === 'object' ? payload.workpaper : null;
  if (!workpaper) return '';
  const questions = [
    ...(Array.isArray(workpaper.internal_questions) ? workpaper.internal_questions : []),
    ...(Array.isArray(workpaper.missing_information) ? workpaper.missing_information : []),
  ];
  const question = questions.find(item => String(item?.field_key || item?.key || '') === String(fieldKey));
  if (!question) return '';
  const text = bootstrapItemText(question);
  if (!text) return '';
  const action = String(question?.collection_action || '');
  const status = bootstrapQuestionStatus(question);
  const heading = status?.label || (hasValue ? '当前值只覆盖部分口径，仍需补齐' : '公开资料未找到完整口径，需内部补充');
  return `<div class="module-field-guidance${status ? ` ${esc(status.className)}` : ''}"><b>${esc(heading)}</b>
    <span>${esc(text)}</span>${action && action !== text ? `<small>${esc(action)}</small>` : ''}</div>`;
}

function renderGenerationDraft(box, draft, ro, locked = false, fields = []) {
  if (!box) return;
  if (!draft) { box.innerHTML = ''; return; }
  const provenance = generationProvenance(draft.meta, {});
  const slots = Object.entries(draft.framework || {});
  const action = draftActionDescriptor(draft);
  const actionsDisabled = locked || !action;
  box.innerHTML = `<section class="card generation-draft" id="generation-draft" tabindex="-1" aria-labelledby="generation-draft-title">
    <div class="generation-draft-heading"><div><span class="generation-draft-kicker">待人工审核</span>
      <h2 id="generation-draft-title">AI 草案（未写入）</h2></div><span class="generation-draft-state">不会自动覆盖正式结果</span></div>
    <div class="generation-provenance"><div class="generation-provenance-main"><b>草案来源</b>
      <span class="generation-mode ${provenance.tone}">${esc(provenance.label)}</span></div>
      ${provenance.details ? `<span>${esc(provenance.details)}</span>` : ''}</div>
    <p class="generation-draft-review">采用前请逐项核验：企业事实、责任人和执行标准必须由企业人工确认；点击采用后才会写入正式诊断。</p>
    ${generationBasisHtml(draft.generation_basis, draft.missing_information, fields, 'draft-generation-basis-title')}
    <div class="err"><div class="k">草案错点</div><div class="v">${esc(draft.error_point)}</div></div>
    <h3>草案框架填充</h3>
    <div class="fw">${slots.map(([key, value]) =>
      `<div class="fw-r"><div class="fw-k">${esc(key)}</div><div class="fw-v">${esc(value)}</div></div>`).join('')}</div>
    <h3>草案核心事项承诺表</h3>
    ${draft.pledges.length ? `<div class="table-scroll" tabindex="0" role="region" aria-label="AI 草案承诺表，可横向滚动"><table class="data-table module-result-table"><thead><tr><th>核心事项</th><th>完成标准</th><th style="width:70px">建议责任人</th>
      <th style="width:92px">建议完成时间</th><th style="width:78px">建议承诺金</th><th style="width:72px">来源</th></tr></thead><tbody>
      ${draft.pledges.map(pledge => `<tr><td><b>${esc(pledge.title)}</b></td><td style="color:var(--ink2)">${esc(pledge.standard)}</td>
        <td>${esc(pledge.owner_name)}</td><td class="n">${esc(pledge.due_date)}</td>
        <td class="n">￥${esc((Number(pledge.amount) || 0).toLocaleString())}</td><td><span class="pledge-source ai">AI 草案</span></td></tr>`).join('')}
      </tbody></table></div>` : '<div class="generation-draft-empty">草案没有提出承诺事项，采用前请先核验生成内容。</div>'}
    ${ro ? '<div class="generation-draft-readonly">顾问账号仅可查看草案，不能采用或放弃。</div>' : `
      <div class="generation-draft-actions" aria-label="AI 草案处理操作">
        <button class="btn" type="button" id="applydraft" ${actionsDisabled ? 'disabled' : ''}>确认采用草案</button>
        <button class="btn btn-g" type="button" id="discarddraft" ${actionsDisabled ? 'disabled' : ''}>暂不采用</button>
      </div>
      ${action ? '' : '<div class="msg msg-e" role="alert">草案校验信息不完整，请刷新读取后再处理。</div>'}`}
  </section>`;
}

function generationStatusContent(kind, detail = '') {
  if (kind === 'in_progress') return {
    title: '新版诊断正在生成',
    body: '完成前继续显示上一次诊断；系统不会重复发起调用。',
  };
  if (kind === 'cost_uncertain') return {
    title: '本次调用状态待核查',
    body: `页面继续保留原诊断，系统没有自动重试或重复计费。${detail ? ` ${detail}` : ''}`,
  };
  if (kind === 'conflict') return {
    title: '生成期间资料发生了变化',
    body: `新结果未覆盖原诊断，系统不会自动再调用 继涛博士。${detail ? ` ${detail}` : ''}`,
  };
  if (kind === 'stale_replay') return {
    title: '另一页面已应用新版诊断',
    body: '另一页面已应用新结果，必须刷新读取；刷新前不会保存、再次生成或自动调用 继涛博士。',
  };
  if (kind === 'confirm_stale') return {
    title: '覆盖确认已过期',
    body: '诊断或承诺已在另一页面发生变化，本次没有调用 继涛博士。必须刷新读取当前结果；刷新前不会保存或再次生成。',
  };
  if (kind === 'draft_ready') return {
    title: 'AI 草案等待人工审核',
    body: '草案已完整生成但尚未写入；正式诊断继续保留，也不会自动发起新的模型调用。',
  };
  if (kind === 'draft_pending') return {
    title: '已有 AI 草案待处理',
    body: '系统没有发起新的模型调用。必须刷新读取草案，再决定采用或暂不采用。',
  };
  if (kind === 'draft_stale') return {
    title: '草案校验信息已变化',
    body: '本次操作没有写入正式结果；必须刷新读取当前草案，系统不会自动重试或生成新草案。',
  };
  if (kind === 'discarded') return {
    title: 'AI 草案已暂不采用',
    body: '原正式诊断保持不变；如有需要，可以重新生成一份新草案。',
  };
  if (kind === 'failed') return {
    title: '生成失败，原诊断未改变',
    body: detail || '请核对当前信息后再决定是否重新生成。',
  };
  if (kind === 'succeeded') return {
    title: '新版诊断已完成',
    body: detail || '结果、诊断来源和信息缺口已更新。',
  };
  return null;
}

/* 与官方 lib/tianlong-framework.ts 01–10 四列一致；slot key 不得改。 */
const TIANLONG = {
  '01': {
    title: '天龙第一部 战略设计',
    keys: ['定标', '对标', '标准', '超标'],
    rows: {
      定标: { tool: '1、定标', method: '世界级 世界第一', practice: '世界级实效商学院' },
      对标: { tool: '2、对标', method: '世界第一标杆', practice: '1、美国哈佛商学院\n2、法国巴黎高等商学院' },
      标准: { tool: '3、标准', method: '研产供销服 缺什么补什么', practice: '1. 硬件：阶梯教室、图书馆、学习环境和场景\n2. 软件：研发、产品、教学、老师、品牌、渠道、服务' },
      超标: { tool: '4、超标', method: '创新、刷新', practice: '基于硬件和软件，重新定义标准，超越标准，指标量化。' },
    },
  },
  '02': {
    title: '天龙第二部 价值创造',
    keys: ['用户痛点', '标杆区隔点', '一个字眼', '一致性'],
    rows: {
      用户痛点: { tool: '1、找差异（三眼看天下）', method: '看用户（痛点）', practice: '细分区域行业龙头、上市公司\n一把手+经营管理团队\n痛点：业绩不增长、不盈利、不持续' },
      标杆区隔点: { tool: '1、找差异（三眼看天下）', method: '看标杆对手（间隔）', practice: '对手 VS 自己\n学历 VS 能力\n教授 VS 教练\n复杂 VS 极简' },
      一个字眼: { tool: '一个字眼', method: '实效（抓手）', practice: '使命：让实效教育改变世界\n愿景：加速企业迈向第一\n战略：世界级实效商学院\n研发：制片厂模式\n老师：讲自己所做\n教学：实效教学\n服务：现场落地\n管理：大道至简、行胜于言' },
      一致性: { tool: '2、做差距', method: '一致性、力出一孔', practice: '看行业（定位）：做价值创新战略，锁定高端' },
    },
  },
  '03': {
    title: '天龙第三部 产品战略',
    keys: ['一米宽', '千米深', '万米深', '十万米深'],
    rows: {
      一米宽: { tool: '1、一米宽', method: '聚焦拳头\n①战略大单品\n②断舍离', practice: '校长EMBA' },
      千米深: { tool: '2、一千米深', method: '用户第一（未买先卖）', practice: '1. 先市场后工厂，先用户后产品\n2. 砍掉亏损产品\n3. 砍掉复购率低产品\n4. 砍掉低收入产品' },
      万米深: { tool: '3、一万米深', method: '品质第一（全价值链）', practice: '1. 一把手负责，建立高品质标准\n2. 全面品质管理\n3. 零缺陷\n4. 持续改进' },
      十万米深: { tool: '4、十万米深', method: '品牌第一（赢得人心）', practice: '持续传播知名度\n课程/产品专题迭代\n极致用户体验，用复购和转介绍赢得忠诚度' },
    },
  },
  '04': {
    title: '天龙第四部 组织发展',
    keys: ['搭班子', '增人效', '建人梯', '师徒制'],
    rows: {
      搭班子: { tool: '1、搭班子', method: '组织架构', practice: '重新定义组织，重新定义岗位\n总裁：首席人才官 + 组织架构师\n供应链：研发、教学、IT\n人资：招选中心、军校\n财务：融资、投资、风控\n营销：品牌、渠道、大客户' },
      增人效: { tool: '2、强研发（研发中心）', method: '全球采购', practice: '鼻祖国家：美国、法国、瑞士\n标杆院校：哈佛商学院、巴黎高等商学院、瑞士IMD\n标杆公司：顺丰、希尔顿、复星、中国建材' },
      建人梯: { tool: '3、大营销（品牌中心）（渠道中心）', method: '梯队建设', practice: '新兵连：子公司总经理 + 政委 + 总监\n精兵营：集团学习官 + 人力资源副总 + 业务副总\n大将营：营销副总 + 人力资源副总\n将帅营：总裁 + 副总 + 老师团\n百帅 / 干将 / 万兵' },
      师徒制: { tool: '2、强研发', method: '用师者王', practice: '向鼻祖国家、标杆院校、标杆公司学，并把带教与晋升挂钩' },
    },
  },
  '05': {
    title: '天龙第六部 预算管理',
    keys: ['算', '路', '人', '网', '兵棋推演'],
    rows: {
      算: { tool: '1、算', method: '蓝图', practice: '十年规划：世界第一的收入与市值目标\n五年规划：拆到 IT、证券/资本、品牌、人力资源四条线' },
      路: { tool: '2、路', method: '地图', practice: '利润第一，现金为王\n新研发：提质提价\n新大客 / 新将才 / 新降本' },
      人: { tool: '3、人', method: '责任到人 施工图', practice: '总经理：利润、复购转介绍、新大客、人才净增长\n营销/人资/研发/财务副总：各领一条可验收指标' },
      网: { tool: '4、网', method: '时间图', practice: '一线：每天一个约见\n分公司总经理：每天一个提案\n专家和高管：每天一个客户服务' },
      兵棋推演: { tool: '5、兵棋推演', method: '先胜后战', practice: '红蓝军推演与通过标准（本页原表未列，先写本公司演练规则）' },
    },
  },
  '06': {
    title: '天龙第七部 营销管理',
    keys: ['定价委员会', '定价方法', '空军', '陆军', '海军'],
    rows: {
      定价委员会: { tool: '1、定价模式', method: '成立定价委员会（组织定价）', practice: '成立定价委员会（含总裁、副总、财务总监、研发、子公司总经理、销冠）' },
      定价方法: { tool: '2、战略定价法', method: '基于战略（标准创新）\n基于对手（卡位区隔）\n基于用户（十倍好）\n先定价，后产品', practice: '锁定高端、价值创新\n提质提价' },
      空军: { tool: '3、闪电战 · 空军', method: '品牌战', practice: '专人专岗提高知名度（传播指数、内容销量等）\n品牌美誉度、忠诚度管理' },
      陆军: { tool: '3、闪电战 · 陆军', method: '渠道战：推广地毯式轰炸，渠道饱和式进攻', practice: '人才净增长\n渠道负责人选拔培养\n极速 + 聚焦 + 并力的地面战役' },
      海军: { tool: '3、闪电战 · 海军', method: '线上战：互联网闪电式突破', practice: '用人工智能获取精准客户\n用模型助力销售业绩' },
    },
  },
  '07': {
    title: '天龙第八部 用户经营',
    keys: ['客户分层', '对接层级', '六脉神剑', '独孤九剑'],
    rows: {
      客户分层: { tool: '六脉神剑 · 画像', method: '画像（分类分级）', practice: '从副总到子公司总经理，精准大客户画像\n每年开发 300-500 家新大客户' },
      对接层级: { tool: '六脉神剑 · 一把手', method: '一把手参与（锁定式开发）\n大客户部', practice: '集团一号位负责\n每周将帅营：目标追踪、考核、奖罚' },
      六脉神剑: { tool: '六脉神剑（开发模式）', method: '1. 一把手参与（锁定式开发）\n2. 画像（分类分级）\n3. 大客户部\n4. SOP 标准作业流程\n5. 政策+机制\n6. 强关系', practice: '销售过程管理（SOP）\n交付品质管理（MOT）\n客户价值管理（复购率、转介绍）\n流程再造：开发作业流程、交付作业流程\n建立大客户激励与管理机制' },
      独孤九剑: { tool: '独孤九剑（价值交付）', method: '1. 战略升级\n2. 价值观升级\n3. 产品服务化', practice: '战略升级：帮助企业构建自己的行动管理模式\n价值观升级：用户第一\n产品服务化：从卖产品到卖服务，打造客户终身成长计划（浓缩 → 校长 → 咨询 → 教练陪跑）' },
    },
  },
    '09': {
    title: '天龙第九部 财务管理',
    keys: ['利润第一', '现金为王', '七宗罪自检', '对策'],
    rows: {
      利润第一: { tool: '1、三大报表（检测系统）', method: '利润表\n资产负债表\n现金流量表', practice: '产品：按利润、收入、增长做 A/B/C/D 排名\n渠道：各分子公司增长、利润排名\n人才：人数、人效、电网排名\n客户：大客户增长、行业用户开发增长\n标杆：总结标杆子公司增长和盈利方法' },
      现金为王: { tool: '2、现金流七大雷', method: '检测：亏损、库存、应收账款、固定资产、投资多元化、高利贷、财务不规范', practice: '降低占用现金流的七大指标\n利润第一，现金为王，收入第三' },
      七宗罪自检: { tool: '2、现金流七大雷', method: '亏损 / 库存 / 应收账款 / 固定资产 / 投资多元化 / 高利贷 / 财务不规范', practice: '逐项检测占用现金流的七大指标，缺数标待取数，不编' },
      对策: { tool: '3、方法', method: '董事长、高管必须精通财务，干部成为经营者', practice: '从集团1号位到子公司事业部1号位，财务专业通关考试\n每月子公司和集团总部召开财报分析会' },
    },
  },
  '10': {
    title: '天龙第十部 资本管理',
    keys: ['当前阶段', '对内', '对外', '时间表'],
    rows: {
      当前阶段: { tool: '1、股权（利润放大器）', method: '股权 = 第一商品', practice: '用经营基本面判断是否进入股权融资/上市准备，基本面不稳不加杠杆' },
      对内: { tool: '1、股权（利润放大器）', method: '股权 = 第一商品', practice: '财务规范、利润增长\n内部先把股权当作第一商品，写清激励对象与约束' },
      对外: { tool: '2、两个利润', method: '2个商品\n商品市场：净钱（经营利润）\n资本市场：生钱（股权放大）', practice: '股权融资\n分清商品市场利润与资本市场放大，不把愿景写成已完成融资' },
      时间表: { tool: '1、股权（利润放大器）', method: '设定上市时间和地点', practice: '成立上市工作组\n设定上市时间和地点\n财务规范、利润增长与节点对齐' },
    },
  },
    '08': {
    title: '天龙第五部 绩效管理',
    keys: ['机制', '电网', '方法', '检查', '奖罚'],
    rows: {
      机制: { tool: '1、机制设计', method: '底薪 + 高绩效 + 电网\n干部：底薪 + 利润提成 + 电网\n员工：底薪 + 毛利或消费 + 电网', practice: '最小单元利润设计：按区域、产品线、用户结构、产业链、项目制拆分\n岗位设计：一把手到业务单元按新增利润分成' },
      电网: { tool: '1、机制设计', method: '电网：每个岗位最低指标', practice: '每个岗位设立最低指标，低于电网即触发纠偏或退出' },
      方法: { tool: '2、方法', method: '把能力建在组织上\n1. 标杆 = 标准\n2. SOP 标准作业流程', practice: '把个人能力写成组织标准与作业流程（本页原表此格为空，先写本公司 SOP）' },
      检查: { tool: '3、检查', method: '月会：分子公司财务分析会\n周会：总裁对副总裁周绩效\n天会：经理对员工日志、晨夕会', practice: '每月检查经营报表\n每周检查领导干部周预算\n每天晨夕会三每三对照' },
      奖罚: { tool: '4、奖罚', method: '奖罚分明\n奖：心动；罚：心痛', practice: '电网制度：每个岗位设立最低指标' },
    },
  },
};

function renderResult(box, st, pledges, ro, meta, basis = [], missing = [], fields = [], slots = []) {
  const fw = st.framework && typeof st.framework === 'object' ? st.framework : {};
  const slotKeys = (Array.isArray(slots) ? slots : [])
    .map(s => (s && typeof s === 'object' ? s.key : s))
    .filter(Boolean);
  const keys = slotKeys.length ? slotKeys : Object.keys(fw);
  const provenance = generationProvenance(meta, st);
  const roAttr = ro ? ' readonly' : '';
  box.innerHTML = `<div class="card generation-result" id="generation-result" tabindex="-1">
    <div class="generation-result-heading">当前正式诊断</div>
    <div class="generation-provenance"><div class="generation-provenance-main"><b>诊断来源</b>
      <span class="generation-mode ${provenance.tone}">${esc(provenance.label)}</span></div>
      ${provenance.details ? `<span>${esc(provenance.details)}</span>` : ''}</div>
    <p class="generation-review-notice">${esc(GENERATION_REVIEW_NOTICE)}</p>
    ${generationBasisHtml(basis, missing, fields)}
    <div class="err"><div class="k">错\u3000点</div>
      <textarea class="f fw-edit" data-ep rows="4"${roAttr}>${esc(st.error_point || '')}</textarea></div>
    <h3>框架填充${TIANLONG[S.moduleNo] ? ' · ' + TIANLONG[S.moduleNo].title : ''}</h3>
    ${TIANLONG[S.moduleNo] ? `<div class="table-scroll" tabindex="0" role="region" aria-label="框架：工具、方法、行动实践、我的应用"><table class="data-table fw-tianlong"><thead><tr><th style="width:88px">工具</th><th>方法</th><th>行动实践</th><th>我的应用</th></tr></thead><tbody>
      ${TIANLONG[S.moduleNo].keys.map(k => {
        const row = TIANLONG[S.moduleNo].rows[k];
        return `<tr><td><b>${esc(row.tool)}</b></td><td>${esc(row.method)}</td><td class="fw-practice">${esc(row.practice)}</td>
          <td><textarea class="f fw-edit" data-fw="${esc(k)}" rows="5" placeholder="写本公司如何应用这一格"${roAttr}>${esc(fw[k] || '')}</textarea></td></tr>`;
      }).join('')}</tbody></table></div>` : `<div class="fw">${keys.map(k =>
      `<div class="fw-r"><div class="fw-k">${esc(k)}</div>
       <textarea class="f fw-edit" data-fw="${esc(k)}" rows="5"${roAttr}>${esc(fw[k] || '')}</textarea></div>`).join('')}</div>`}
    <h3>核心事项承诺表</h3>
    ${pledges.length ? `<div class="table-scroll" tabindex="0" role="region" aria-label="本模块承诺表，可横向滚动"><table class="data-table module-result-table"><thead><tr><th>核心事项</th><th>完成标准</th><th style="width:70px">责任人</th>
      <th style="width:92px">完成时间</th><th style="width:78px">承诺金</th><th style="width:142px">来源</th></tr></thead><tbody>
      ${pledges.map(p => `<tr class="${p.done ? 'done' : ''}"><td><b>${esc(p.title)}</b></td>
        <td style="color:var(--ink2)">${esc(p.standard)}</td><td>${esc(p.owner_name)}</td>
        <td class="n">${esc(p.due_date)}</td><td class="n">￥${esc((Number(p.amount) || 0).toLocaleString())}</td>
        <td><span class="pledge-source ${p.source === 'manual' ? 'manual' : 'ai'}">${esc(pledgeSourceLabel(p.source, p.bootstrap_draft_id))}</span></td></tr>`).join('')}
      </tbody></table></div>` : `<div style="border:1px dashed rgba(208,59,59,.5);background:rgba(208,59,59,.06);
        border-radius:8px;padding:22px;text-align:center">
        <div style="color:#ef7f7f;font-size:13px;font-weight:600;margin-bottom:6px">错点已诊断，但还没有人认领承诺</div>
        <div style="color:var(--ink2);font-size:12px">系统已在承诺看板高亮此模块</div></div>`}
    <div style="margin-top:16px;display:flex;gap:9px;align-items:center;flex-wrap:wrap">
      <button class="btn btn-g" type="button" id="tob">前往承诺看板 →</button>
      ${ro ? '' : '<button class="btn btn-g" type="button" id="addp">+ 手动添加一条承诺</button>'}
      ${ro ? '' : '<button class="btn" type="button" id="savefw">保存框架填充</button>'}
    </div>
    <div id="fwm" aria-live="polite"></div></div>`;
  const t = box.querySelector('#tob'); if (t) t.onclick = () => go('board');
  const ap = box.querySelector('#addp'); if (ap) ap.onclick = () => pledgeModal(S.moduleNo);
  const saveFw = box.querySelector('#savefw');
  if (saveFw) saveFw.onclick = async () => {
    if (saveFw.disabled) return;
    saveFw.disabled = true; saveFw.textContent = '保存中…';
    try {
      const framework = {};
      box.querySelectorAll('textarea[data-fw]').forEach(el => { framework[el.dataset.fw] = el.value; });
      const ep = box.querySelector('textarea[data-ep]');
      const body = { framework };
      if (ep) body.error_point = ep.value;
      await api(`/api/companies/${S.cid}/modules/${S.moduleNo}/framework`, { method: 'PUT', body });
      setMessage(box.querySelector('#fwm'), '已保存', 'ok');
    } catch (e) {
      if (e.status !== 401) setMessage(box.querySelector('#fwm'), e.message);
    }
    if (document.contains(saveFw)) { saveFw.disabled = false; saveFw.textContent = '保存框架填充'; }
  };
}

function pledgeModal(moduleNo, pledge = null) {
  const editing = Boolean(pledge);
  const amount = Number(pledge?.amount ?? 2000);
  const d = document.createElement('div'); d.className = 'modal';
  d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-labelledby', 'pledge-modal-title');
  d.innerHTML = `<div class="box"><h3 id="pledge-modal-title">${editing ? '编辑承诺' : '添加一条承诺'}</h3>
    <label class="f" for="t">核心事项 *</label><input class="f" id="t" value="${esc(pledge?.title || '')}">
    <label class="f" for="s">完成标准（要能用「做到了/没做到」判定）</label><textarea class="f" id="s" rows="2">${esc(pledge?.standard || '')}</textarea>
    <label class="f" for="o">责任人</label><input class="f" id="o" value="${esc(pledge?.owner_name || '')}" placeholder="真实姓名，不要写「相关人员」">
    <label class="f" for="dd">完成时间</label><input class="f" id="dd" value="${esc(pledge?.due_date || '')}" aria-describedby="due-hint" placeholder="YYYY-MM-DD 或 持续">
    <div class="tiny" id="due-hint">填写具体日期，周期性事项可填“持续”。</div>
    <label class="f" for="a">承诺金</label><select class="f" id="a"><option value="2000" ${amount === 2000 ? 'selected' : ''}>￥2,000</option>
      <option value="5000" ${amount === 5000 ? 'selected' : ''}>￥5,000</option><option value="0" ${amount === 0 ? 'selected' : ''}>不设承诺金</option></select>
    <div class="row2"><button class="btn" type="button" id="sv">${editing ? '保存修改' : '添 加'}</button>
      <button class="btn btn-g" type="button" id="cc" style="width:110px;margin-top:20px">取消</button></div>
    <div id="mm" aria-live="polite"></div></div>`;
  const close = mountModal(d, '#t');
  d.querySelector('#cc').onclick = close;
  d.querySelector('#sv').onclick = async () => {
    const b = d.querySelector('#sv'); if (b.disabled) return;
    b.disabled = true; b.textContent = editing ? '保存中…' : '添加中…';
    try {
      const body = { title: d.querySelector('#t').value, standard: d.querySelector('#s').value,
        owner_name: d.querySelector('#o').value, due_date: d.querySelector('#dd').value,
        amount: Number(d.querySelector('#a').value) };
      if (!editing) body.module_no = moduleNo;
      await api(editing ? `/api/companies/${S.cid}/pledges/${pledge.id}` : `/api/companies/${S.cid}/pledges`,
        { method: editing ? 'PATCH' : 'POST', body });
      close(); await render();
    } catch (e) {
      if (e.status !== 401) { setMessage(d.querySelector('#mm'), e.message); b.disabled = false; b.textContent = editing ? '保存修改' : '添 加'; }
    }
  };
}

async function viewDetail(seq) {
  const moduleNo = S.moduleNo;
  const annotationRequest = { targetType: 'module', targetKey: moduleNo };
  const [r, annotationPayload] = await Promise.all([
    api(`/api/companies/${S.cid}/modules/${moduleNo}`),
    api(annotationPageUrl(annotationRequest)),
  ]);
  if (seq !== S.renderSeq) return;
  const m = r.module, ro = isRO();
  let annotationPage = normalizeAnnotationPage(annotationPayload);
  let currentState = r.state, currentPledges = r.pledges;
  let currentMeta = r.result_generation || r.meta || null;
  let currentGeneration = normalizeGenerationMeta(r.generation || currentMeta);
  let currentDraft = normalizeDraftGeneration(r);
  if (currentDraft) {
    currentGeneration = {
      ...currentDraft.meta,
      status: draftActionDescriptor(currentDraft) ? 'generated' : 'draft_stale',
      job_id: currentDraft.job_id,
    };
  } else if (!currentDraft && generationStatusKind(currentGeneration) === 'draft_ready') {
    currentGeneration = { ...currentGeneration, status: 'draft_pending' };
  }
  let currentBasis = r.generation_basis && typeof r.generation_basis === 'object' ? r.generation_basis
    : currentMeta?.generation_basis && typeof currentMeta.generation_basis === 'object' ? currentMeta.generation_basis : null;
  let currentMissing = Array.isArray(r.missing_information) ? r.missing_information
    : Array.isArray(currentMeta?.missing_information) ? currentMeta.missing_information : [];
  const inputApplications = normalizeModuleInputApplications(r, moduleNo);
  const publicContextHtml = moduleBootstrapContextHtml(r);
  let hasExistingResult = Boolean(currentState.error_point || currentState.framework || currentPledges.some(p => p.source === 'ai'));
  const initialGenerationKind = generationStatusKind(currentGeneration);
  const initialGenerationBlocked = generationControlsBlocked(currentGeneration);
  if (generationShouldClearAttempt(currentGeneration)) {
    clearGenerationAttemptKey(S.cid, m.no);
  }
  root().innerHTML = shell(`
    <div style="margin-bottom:14px"><button class="btn btn-g" type="button" id="bk">← 返回工作台</button></div>
    <div class="co"><h1>${esc(m.no)} ${esc(m.name)}</h1><span>${esc(m.slogan)}</span></div>
    <div class="sub">第一步：填写企业现状（${esc(m.fields.length)} 个字段）→ 第二步：生成并人工审核 AI 草案</div>
    <div class="dt">
      <div class="card" id="module-input-card"><h3>企业现状录入</h3>
        <div class="module-input-boundary"><b>公开资料与内部资料分开</b><span>企业主在 AI 企业建档中确认的公开资料建议会自动写入对应字段；无法从公开来源确认的经营数据继续留空，由企业内部补充。</span></div>
        ${publicContextHtml}
        ${m.fields.map(f => {
          const inputValue = String(r.state.inputs[f.key] || '');
          return `<label class="f" for="field-${esc(f.key)}">${esc(f.label)}</label>
          <textarea class="f" id="field-${esc(f.key)}" rows="2" data-k="${esc(f.key)}" ${ro ? 'readonly' : initialGenerationBlocked ? 'disabled' : ''} placeholder="${esc(f.ph)}">${esc(inputValue)}</textarea>
          ${moduleInputProvenanceHtml(inputApplications.get(String(f.key)))}${moduleFieldGuidanceHtml(r, f.key, Boolean(inputValue.trim()))}`;
        }).join('')}
        ${ro ? '<div class="tiny" style="margin-top:16px">顾问账号为只读，不能修改企业录入或重新生成；但可以在右侧写批注。</div>' : `
        <button class="btn" type="button" id="gen" ${initialGenerationBlocked ? 'disabled aria-busy="true"' : ''}>${['stale_replay', 'confirm_stale', 'draft_pending', 'draft_stale'].includes(initialGenerationKind) ? '请先刷新读取' : initialGenerationKind === 'draft_ready' ? '草案待人工处理' : initialGenerationKind === 'in_progress' ? '生成任务进行中' : generationActionLabel(hasExistingResult)}</button>
        <button class="btn btn-g" type="button" id="save" style="width:100%;margin-top:9px" ${initialGenerationBlocked ? 'disabled' : ''}>仅保存，暂不生成</button>
        <div class="generation-mode-note">${S.meta?.llm?.mock !== false
          ? '当前模块只生成模拟演示，不会调用 继涛博士。'
          : '每次确认只发起一次 继涛博士 调用；系统不会自动重复调用。'}</div>`}
        <div id="gm" aria-live="polite"></div>
      </div>
      <div><div id="generationstatus" class="generation-status" role="status" aria-live="polite" aria-atomic="true" hidden></div>
      <div id="stalenotice" class="stale-notice" role="alert" ${r.state.stale ? '' : 'hidden'}>
        录入已更新，当前诊断已过期，请重新生成后再据此执行。
      </div><div id="out"></div><div id="draftout"></div><div id="annwrap" style="margin-top:14px"></div></div>
    </div>`);
  bindShell();
  $('#bk').onclick = () => go('wbs');
  const openBootstrapReview = $('#openbootstrapreview'); if (openBootstrapReview) openBootstrapReview.onclick = () => go('research');
  root().querySelectorAll('[data-open-bootstrap-source]').forEach(button => {
    button.onclick = () => go('research');
  });
  renderResult($('#out'), currentState, currentPledges, ro, currentMeta, currentBasis, currentMissing, m.fields, m.slots);
  renderGenerationDraft($('#draftout'), currentDraft, ro, generationStatusKind(currentGeneration) !== 'draft_ready', m.fields);
  const showGenerationStatus = (kind, detail = '') => {
    const statusBox = $('#generationstatus');
    const content = generationStatusContent(kind, detail);
    if (!statusBox || !content) {
      if (statusBox) { statusBox.hidden = true; statusBox.innerHTML = ''; }
      return;
    }
    statusBox.hidden = false;
    statusBox.className = `generation-status ${kind}`;
    statusBox.setAttribute('role', ['cost_uncertain', 'conflict', 'draft_pending', 'draft_stale', 'stale_replay', 'confirm_stale', 'failed'].includes(kind) ? 'alert' : 'status');
    statusBox.innerHTML = `<div class="generation-status-main">
      ${kind === 'in_progress' ? '<span class="spin" aria-hidden="true"></span>'
        : `<span class="generation-status-icon" aria-hidden="true">${['succeeded', 'discarded'].includes(kind) ? '✓' : '!'}</span>`}
      <div><b>${esc(content.title)}</b><span>${esc(content.body)}</span></div></div>
      ${['in_progress', 'cost_uncertain', 'conflict', 'draft_pending', 'draft_stale', 'stale_replay', 'confirm_stale'].includes(kind)
        ? `<button class="btn btn-g" type="button" id="generationrefresh">${['draft_pending', 'draft_stale', 'stale_replay', 'confirm_stale'].includes(kind) ? '刷新读取当前结果' : '刷新核查状态'}</button>` : ''}`;
    const refresh = $('#generationrefresh', statusBox);
    if (refresh) refresh.onclick = async () => {
      if (refresh.disabled) return;
      refresh.disabled = true;
      refresh.textContent = '正在刷新…';
      updateGenerationControls(true);
      await render();
    };
  };
  const updateGenerationControls = busy => {
    const card = $('#module-input-card');
    const generate = $('#gen'), save = $('#save');
    const blocked = busy || generationControlsBlocked(currentGeneration);
    if (card) card.setAttribute('aria-busy', blocked ? 'true' : 'false');
    root().querySelectorAll('textarea[data-k]').forEach(field => { field.disabled = blocked; });
    if (save) save.disabled = blocked;
    if (generate) {
      generate.disabled = blocked;
      generate.setAttribute('aria-busy', blocked ? 'true' : 'false');
      const kind = generationStatusKind(currentGeneration);
      generate.textContent = ['stale_replay', 'confirm_stale', 'draft_pending', 'draft_stale'].includes(kind) ? '请先刷新读取'
        : kind === 'draft_ready' ? '草案待人工处理'
        : blocked ? '生成任务进行中'
        : kind === 'cost_uncertain' ? '核查后重新发起'
          : kind === 'conflict' ? '确认后重新生成'
            : generationActionLabel(hasExistingResult);
    }
  };
  showGenerationStatus(initialGenerationKind, currentGeneration.error_message || '');
  updateGenerationControls(initialGenerationBlocked);
  const renderAnnotations = (draft = '', announcement = '') => {
    if (seq !== S.renderSeq || S.view !== 'detail' || S.moduleNo !== moduleNo) return;
    const wrap = $('#annwrap'); if (!wrap) return;
    wrap.innerHTML = annCard(annotationPage, 'module', m.no, { title: '本模块批注' });
    const body = $('#annbody', wrap); if (body) body.value = draft;
    bindAnn(() => render(), async currentDraft => {
      const continuation = annotationPage.next; if (!continuation) return;
      const before = annotationPage.items.length;
      const nextPayload = await api(annotationPageUrl({ ...annotationRequest, next: continuation }));
      if (seq !== S.renderSeq || S.view !== 'detail' || S.moduleNo !== moduleNo) return;
      annotationPage = mergeAnnotationPages(annotationPage, nextPayload);
      renderAnnotations(currentDraft, `已加载 ${annotationPage.items.length - before} 条批注。`);
    });
    if (announcement) {
      const pageStatus = $('#annpagestatus', wrap);
      pageStatus.textContent = announcement;
      pageStatus.focus();
    }
  };
  renderAnnotations();

  if (ro) return;

  const runDraftActionOnce = createDraftActionGuard();
  const renderDraftPanel = (forceLocked = false) => {
    const kind = generationStatusKind(currentGeneration);
    const locked = forceLocked || ['draft_pending', 'draft_stale', 'stale_replay', 'confirm_stale'].includes(kind);
    renderGenerationDraft($('#draftout'), currentDraft, false, locked, m.fields);
    const applyButton = $('#applydraft'), discardButton = $('#discarddraft');
    if (applyButton) applyButton.onclick = () => handleDraftAction('apply');
    if (discardButton) discardButton.onclick = () => handleDraftAction('discard');
  };
  const handleDraftAction = action => runDraftActionOnce(async () => {
    const descriptor = draftActionDescriptor(currentDraft);
    if (!descriptor) {
      currentGeneration = { ...currentGeneration, status: 'draft_stale' };
      showGenerationStatus('draft_stale');
      updateGenerationControls(false);
      renderDraftPanel(true);
      setMessage($('#gm'), '草案校验信息不完整，必须刷新读取后再处理。', 'info');
      return;
    }
    const applyButton = $('#applydraft'), discardButton = $('#discarddraft');
    [applyButton, discardButton].forEach(button => {
      if (!button) return;
      button.disabled = true;
      button.setAttribute('aria-busy', 'true');
    });
    const activeButton = action === 'apply' ? applyButton : discardButton;
    if (activeButton) activeButton.textContent = action === 'apply' ? '正在采用…' : '正在处理…';
    const actionSeq = S.renderSeq, actionCid = S.cid, actionModule = m.no;
    const isCurrentDraftView = () => actionSeq === S.renderSeq && actionCid === S.cid &&
      actionModule === S.moduleNo && S.view === 'detail';
    try {
      await api(`/api/companies/${S.cid}/modules/${m.no}/generations/${encodeURIComponent(descriptor.job_id)}/${action}`, {
        method: 'POST', body: descriptor.body,
      });
      if (!isCurrentDraftView()) return;
      clearGenerationAttemptKey(S.cid, m.no);
      currentDraft = null;
      setMessage($('#gm'), action === 'apply'
        ? '草案已采用，正在读取正式诊断。'
        : '草案已暂不采用，原正式诊断保持不变。', 'ok');
      await render();
    } catch (e) {
      if (e.status === 401 || !isCurrentDraftView()) return;
      const errorKind = generationErrorKind(e);
      const requiresRefresh = e.status === 409 || ['draft_stale', 'draft_pending', 'stale_replay', 'confirm_stale'].includes(errorKind);
      if (requiresRefresh) {
        const safeKind = ['draft_stale', 'draft_pending', 'stale_replay', 'confirm_stale'].includes(errorKind)
          ? errorKind : 'draft_stale';
        const errorMeta = normalizeGenerationMeta(e.payload || e);
        currentGeneration = { ...errorMeta, status: safeKind, error_message: e.message || '' };
        showGenerationStatus(safeKind, e.message || '');
        updateGenerationControls(false);
        renderDraftPanel(true);
        setMessage($('#gm'), '草案状态已变化，本次没有写入；必须刷新读取后再处理。', 'info');
      } else {
        renderDraftPanel(false);
        setMessage($('#gm'), `草案操作未完成，正式诊断未改变。${e.message ? ` ${e.message}` : ''}`);
      }
    }
  });
  renderDraftPanel();

  const collect = () => { const o = {};
    root().querySelectorAll('textarea[data-k]').forEach(t => o[t.dataset.k] = t.value.trim()); return o; };
  const setStaleNotice = stale => { const notice = $('#stalenotice'); if (notice) notice.hidden = !stale; };

  $('#save').onclick = async () => {
    const b = $('#save'); if (b.disabled) return;
    b.disabled = true; b.textContent = '保存中…';
    try { const saved = await api(`/api/companies/${S.cid}/modules/${m.no}/inputs`, { method: 'PUT', body: { inputs: collect() } });
      setStaleNotice(Boolean(saved.stale));
      setMessage($('#gm'), '已保存', 'ok');
    } catch (e) { if (e.status !== 401) setMessage($('#gm'), e.message); }
    if (document.contains(b)) { b.disabled = false; b.textContent = '仅保存，暂不生成'; }
  };

  $('#gen').onclick = async () => {
    const b = $('#gen');
    if (b.disabled) return;
    const inputs = collect();
    if (!Object.values(inputs).some(v => v)) { setMessage($('#gm'), '至少填写一个字段'); return; }
    const recoveryKind = generationStatusKind(currentGeneration);
    if (recoveryKind === 'cost_uncertain' || recoveryKind === 'conflict') {
      if (!confirmGenerationRecovery(recoveryKind, hasExistingResult)) return;
      clearGenerationAttemptKey(S.cid, m.no);
    }

    const out = $('#out'), messageBox = $('#gm');
    const actionSeq = S.renderSeq, actionCid = S.cid, actionModule = m.no;
    const isCurrent = () => actionSeq === S.renderSeq && actionCid === S.cid &&
      actionModule === S.moduleNo && S.view === 'detail';
    const previousGeneration = currentGeneration;
    const idempotencyKey = ensureGenerationAttemptKey(S.cid, m.no);
    currentGeneration = { ...currentGeneration, status: 'running' };
    updateGenerationControls(true);
    messageBox.innerHTML = '';
    showGenerationStatus('in_progress');
    try {
      const body = { inputs, confirm_replace: false };
      const requestGeneration = () => api(`/api/companies/${S.cid}/modules/${m.no}/generate`, {
        method: 'POST', body, headers: { 'Idempotency-Key': idempotencyKey },
      });
      let g;
      try { g = await requestGeneration(); }
      catch (e) {
        if (!isReplaceConfirmation(e)) throw e;
        const confirmation = replacementConfirmation(e);
        if (!confirmation) throw e;
        if (!isCurrent()) return;
        if (!confirmReplacement(confirmation)) {
          clearGenerationAttemptKey(S.cid, m.no);
          currentGeneration = previousGeneration;
          showGenerationStatus(generationStatusKind(currentGeneration), currentGeneration.error_message || '');
          setMessage(messageBox, '已取消重新生成，原有诊断和承诺未改动。', 'info');
          return;
        }
        body.confirm_replace = true;
        body.confirm_snapshot = confirmation;
        g = await requestGeneration();
      }
      if (!isCurrent()) return;
      const responseKind = generationStatusKind(g?.generation || g?.meta || g);
      const nextDraft = normalizeDraftGeneration(g);
      if (nextDraft || responseKind === 'draft_ready') {
        currentDraft = nextDraft;
        const hasActionIdentity = Boolean(draftActionDescriptor(currentDraft));
        currentGeneration = {
          ...normalizeGenerationMeta(g.generation || g.meta || g),
          status: hasActionIdentity ? 'generated' : 'draft_pending',
          job_id: nextDraft?.job_id || g?.job_id || g?.generation?.job_id || '',
        };
        renderDraftPanel(!hasActionIdentity);
        showGenerationStatus(hasActionIdentity ? 'draft_ready' : 'draft_pending');
        setMessage(messageBox, hasActionIdentity
          ? 'AI 草案已生成但尚未写入，请完整预览并人工核验后再决定是否采用。'
          : 'AI 草案已生成，必须刷新读取完整草案后再处理。', 'info');
        if (hasActionIdentity) $('#generation-draft')?.focus();
        return;
      }
      if (!g?.error_point && responseKind === 'in_progress') {
        currentGeneration = normalizeGenerationMeta(g.generation || g.meta || g);
        showGenerationStatus('in_progress');
        return;
      }
      currentState = { ...currentState, error_point: g.error_point, framework: g.framework, stale: false };
      currentPledges = Array.isArray(g.pledges) ? g.pledges : currentPledges;
      currentMeta = { ...normalizeGenerationMeta(g.meta || g.generation || {}), status: 'applied' };
      currentGeneration = currentMeta;
      currentBasis = g.generation_basis && typeof g.generation_basis === 'object' ? g.generation_basis
        : g.meta?.generation_basis && typeof g.meta.generation_basis === 'object' ? g.meta.generation_basis : null;
      currentMissing = Array.isArray(g.missing_information) ? g.missing_information
        : Array.isArray(g.meta?.missing_information) ? g.meta.missing_information : [];
      hasExistingResult = true;
      clearGenerationAttemptKey(S.cid, m.no);
      renderResult(out, currentState, currentPledges, ro, currentMeta, currentBasis, currentMissing, m.fields, m.slots);
      showGenerationStatus('succeeded', currentMeta.already
        ? '已恢复此前完成的结果，没有重复调用。'
        : '原诊断只在新结果完整生成后才被替换。');
      setMessage(messageBox, '新版诊断已完成，诊断来源和信息缺口已更新。', 'ok');
      setStaleNotice(false);
      $('#generation-result', out)?.focus();
    } catch (e) {
      if (e.status !== 401 && isCurrent()) {
        const kind = generationErrorKind(e);
        const errorMeta = normalizeGenerationMeta(e.payload || e);
        currentGeneration = {
          ...errorMeta,
          status: kind === 'in_progress' ? (errorMeta.status || 'running') : kind,
          error_message: e.message || errorMeta.error_message || '',
        };
        if (generationShouldClearAttempt(currentGeneration)) clearGenerationAttemptKey(S.cid, m.no);
        showGenerationStatus(kind, e.message || '');
        if (kind === 'in_progress') {
          setMessage(messageBox, '已恢复正在进行的生成任务，原诊断继续保留，请刷新核查。', 'info');
        } else if (kind === 'cost_uncertain') {
          setMessage(messageBox, '调用状态待核查，原诊断继续保留；系统没有自动重试。', 'info');
        } else if (kind === 'conflict') {
          setMessage(messageBox, '生成期间资料已变化，原诊断未改变；请先刷新核查。');
        } else if (kind === 'stale_replay') {
          setMessage(messageBox, '另一页面已应用新结果，必须刷新读取；刷新前本页不会再次生成。', 'info');
        } else if (kind === 'confirm_stale') {
          setMessage(messageBox, '覆盖确认已过期，本次没有调用 继涛博士；必须刷新读取当前结果。', 'info');
        } else if (kind === 'draft_pending') {
          setMessage(messageBox, '已有 AI 草案待处理，本次没有发起新调用；必须刷新读取草案。', 'info');
        } else if (kind === 'draft_stale') {
          setMessage(messageBox, '草案校验信息已变化，本次没有写入正式结果；必须刷新读取。', 'info');
        } else {
          setMessage(messageBox, `生成失败，原诊断未改变。${e.message ? ` ${e.message}` : ''}`);
        }
      }
    } finally {
      if (isCurrent() && document.contains(b)) updateGenerationControls(false);
    }
  };
}


/* ───────── 批注组件 ───────── */
const ANNOTATION_PAGE_SIZE = 30;

function nonNegativeInteger(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : null;
}

function normalizeAnnotationPage(payload) {
  if (payload?.__annotationPage) return payload;
  const source = payload && typeof payload === 'object' ? payload : {};
  const pagination = source.pagination && typeof source.pagination === 'object' ? source.pagination : {};
  const items = Array.isArray(payload) ? payload
    : Array.isArray(source.annotations) ? source.annotations
      : Array.isArray(source.items) ? source.items : [];
  const reportedTotal = nonNegativeInteger(pagination.total ?? source.total);
  const total = reportedTotal ?? (Array.isArray(payload) ? items.length : null);
  const pendingTotal = nonNegativeInteger(
    pagination.unresolved_total ?? pagination.pending_total ?? pagination.annotations_open ??
    source.unresolved_total ?? source.pending_total ?? source.annotations_open
  );

  let next = null;
  const nextCursor = pagination.next_cursor ?? source.next_cursor;
  if (nextCursor !== undefined && nextCursor !== null && String(nextCursor) !== '') {
    next = { kind: 'cursor', value: String(nextCursor) };
  } else {
    const nextOffset = nonNegativeInteger(pagination.next_offset ?? source.next_offset);
    if (nextOffset !== null) next = { kind: 'offset', value: nextOffset };
    else {
      const offset = nonNegativeInteger(pagination.offset);
      const canInferMore = pagination.has_more === true ||
        (pagination.has_more !== false && total !== null && offset !== null && offset + items.length < total);
      if (offset !== null && canInferMore && items.length) {
        next = { kind: 'offset', value: offset + items.length };
      }
    }
  }
  return { __annotationPage: true, items, total, pendingTotal, next };
}

function mergeAnnotationPages(currentPayload, nextPayload) {
  const current = normalizeAnnotationPage(currentPayload);
  const next = normalizeAnnotationPage(nextPayload);
  const items = current.items.slice();
  const ids = new Set(items.filter(a => a?.id !== undefined && a?.id !== null).map(a => String(a.id)));
  next.items.forEach(annotation => {
    const id = annotation?.id;
    if (id !== undefined && id !== null && ids.has(String(id))) return;
    items.push(annotation);
    if (id !== undefined && id !== null) ids.add(String(id));
  });
  return {
    __annotationPage: true,
    items,
    total: next.total ?? current.total,
    pendingTotal: next.pendingTotal ?? current.pendingTotal,
    next: next.next,
  };
}

function annotationPageUrl({ targetType = null, targetKey = null, next = null } = {}) {
  const params = new URLSearchParams();
  if (targetType) params.set('target_type', targetType);
  if (targetKey !== null && targetKey !== undefined) params.set('target_key', targetKey);
  params.set('limit', String(ANNOTATION_PAGE_SIZE));
  if (next?.kind === 'cursor') params.set('cursor', String(next.value));
  else params.set('offset', String(next?.kind === 'offset' ? next.value : 0));
  return `/api/companies/${encodeURIComponent(S.cid)}/annotations?${params.toString()}`;
}

function annotationTargetLabel(annotation) {
  if (annotation.target_type === 'module') {
    return annotation.target_key === '00' ? '整体' : `${annotation.target_key} ${moduleName(annotation.target_key)}`.trim();
  }
  return `承诺 #${annotation.target_key}`;
}

function annCard(payload, targetType, targetKey, opts = {}) {
  const page = normalizeAnnotationPage(payload);
  const list = page.items;
  const ro = isRO();
  const loadedPending = list.filter(a => !a.resolved).length;
  const pendingText = page.pendingTotal === null
    ? `${loadedPending} 条待处理${page.next ? '（当前已加载）' : ''}`
    : `${page.pendingTotal} 条待处理`;
  const totalText = page.total === null
    ? `已加载 ${list.length} 条`
    : page.next ? `已加载 ${list.length} / 共 ${page.total} 条` : `共 ${page.total} 条`;
  const submitType = opts.submitTargetType || targetType;
  const submitKey = opts.submitTargetKey ?? targetKey;
  return `<div class="card" id="anncard" data-tt="${esc(submitType)}" data-tk="${esc(submitKey)}">
    <h3>${esc(opts.title || '批注')}\u3000<span class="rulechip">${esc(pendingText)} · ${esc(totalText)}</span></h3>
    ${list.length ? list.map(a => `<div class="ann ${a.resolved ? 'done' : ''}">
      <div class="ann-h">
        <span class="who"><span class="av">${esc((a.author_name||'?')[0])}</span>${esc(a.author_name)}</span>
        <span class="tag ${a.author_role === 'consultant' ? 'tag-c' : 'tag-o'}">${a.author_role === 'consultant' ? '顾问' : '企业主'}</span>
        ${a.resolved ? '<span class="tag tag-d">已处理</span>' : ''}
        ${opts.showTarget ? `<span class="tag tag-t">${esc(annotationTargetLabel(a))}</span>` : ''}
        <span class="tiny" style="margin-left:auto">${esc(a.created_at)}</span>
      </div>
      <div class="ann-b">${esc(a.body)}</div>
      <div class="ann-f">
        ${ro ? '' : `<button type="button" class="link-btn lnk" data-res="${esc(a.id)}" data-v="${a.resolved ? 0 : 1}" aria-label="${a.resolved ? '重新打开' : '标记已处理'}批注">${a.resolved ? '重新打开' : '标记已处理'}</button>`}
        ${(String(a.author_id) === String(S.user?.id) || !ro) ? `<button type="button" class="link-btn lnk lnk-d" data-adel="${esc(a.id)}" aria-label="删除批注">删除</button>` : ''}
      </div></div>`).join('') : '<div class="tiny" style="padding:6px 0 14px">还没有批注。顾问可以在这里写下点评，企业主处理后标记为已处理。</div>'}
    ${page.next ? '<div class="ann-pagination"><button class="btn btn-g ann-more" type="button" id="annmore">加载更多</button></div>' : ''}
    <div id="annpagestatus" class="ann-page-status" role="status" aria-live="polite" tabindex="-1"></div>
    <label class="sr-only" for="annbody">批注内容</label><textarea class="f" id="annbody" rows="2" placeholder="${ro ? '写下你的点评…（顾问可写批注）' : '写下批注…'}"></textarea>
    <button class="btn btn-g" type="button" id="annadd" style="margin-top:9px">发表批注</button><div id="annmsg" aria-live="polite"></div>
  </div>`;
}
function bindAnn(reload, loadMore = null) {
  const box = $('#anncard'); if (!box) return;
  const tt = box.dataset.tt, tk = box.dataset.tk;
  const add = $('#annadd', box), bodyField = $('#annbody', box), message = $('#annmsg', box);
  add.onclick = async () => {
    const body = bodyField.value.trim(); if (!body) return;
    add.disabled = true;
    try { await api(`/api/companies/${S.cid}/annotations`, { method: 'POST',
      body: { target_type: tt, target_key: tk, body } }); await reload(); }
    catch (e) { if (e.status !== 401) { setMessage(message, e.message); add.disabled = false; } }
  };
  box.querySelectorAll('[data-res]').forEach(x => x.onclick = async () => {
    x.disabled = true;
    try {
      await api(`/api/companies/${S.cid}/annotations/${x.dataset.res}`,
        { method: 'PATCH', body: { resolved: x.dataset.v === '1' } }); await reload();
    } catch (e) { if (e.status !== 401) { x.disabled = false; setMessage(message, e.message); } }
  });
  box.querySelectorAll('[data-adel]').forEach(x => x.onclick = async () => {
    if (!confirm('删除这条批注？')) return;
    x.disabled = true;
    try { await api(`/api/companies/${S.cid}/annotations/${x.dataset.adel}`, { method: 'DELETE' }); await reload(); }
    catch (e) { if (e.status !== 401) { x.disabled = false; setMessage(message, e.message); } }
  });
  const more = $('#annmore', box);
  if (more && loadMore) more.onclick = async () => {
    more.disabled = true; more.textContent = '加载中…';
    try { await loadMore(bodyField.value); }
    catch (e) {
      if (e.status !== 401 && document.contains(more)) {
        more.disabled = false; more.textContent = '加载更多'; setMessage(message, `加载批注失败：${e.message}`);
      }
    }
  };
}

/* ───────── 成员与批注 ───────── */
async function viewMembers(seq) {
  const annotationRequest = {};
  const [m, annotationPayload] = await Promise.all([
    api(`/api/companies/${S.cid}/members`),
    api(annotationPageUrl(annotationRequest)),
  ]);
  if (seq !== S.renderSeq) return;
  const ro = m.role !== 'owner';
  let annotationPage = normalizeAnnotationPage(annotationPayload);
  const loadedPending = annotationPage.items.filter(a => !a.resolved).length;
  S.openNotes = annotationPage.pendingTotal ?? loadedPending;
  const pendingQualifier = annotationPage.pendingTotal === null && annotationPage.next ? '（当前已加载）' : '';

  root().innerHTML = shell(`
    <div class="co"><h1>成员与批注</h1><span>${esc(m.members.length)} 位成员 · ${esc(S.openNotes)} 条批注待处理${esc(pendingQualifier)}</span></div>
    <div class="sub">顾问账号可以查看全部内容并写批注，但不能修改企业数据</div>
    <div class="dt">
      <div>
        <div class="card" style="margin-bottom:14px"><h3>成员</h3>
          <div class="table-scroll" tabindex="0" role="region" aria-label="企业成员，可横向滚动"><table class="data-table"><thead><tr><th>姓名</th><th>邮箱</th><th style="width:78px">角色</th>${ro?'':'<th style="width:72px">操作</th>'}</tr></thead><tbody>
          ${m.members.map(u => `<tr><td><span class="who"><span class="av">${esc(u.name[0])}</span><b>${esc(u.name)}</b></span></td>
            <td style="color:var(--ink2)">${esc(u.email)}</td>
            <td><span class="tag ${u.role === 'consultant' ? 'tag-c' : 'tag-o'}">${u.role === 'consultant' ? '顾问' : '企业主'}</span></td>
            ${ro?'':`<td>${u.role==='owner'||String(u.id)===String(S.user?.id)?'':`<button type="button" class="icon-btn danger" data-rm="${esc(u.id)}" aria-label="移除成员：${esc(u.name)}">移除</button>`}</td>`}</tr>`).join('')}
          </tbody></table></div>
        </div>
        ${ro ? '' : `<div class="card"><h3>邀请顾问</h3>
          <div class="tiny" style="margin-bottom:12px">生成一条邀请链接发给顾问。对方注册或登录后打开链接即可加入，链接 14 天内有效、只能用一次。</div>
          <label class="f" for="invnote">备注（可选，方便你记住是给谁的）</label>
          <input class="f" id="invnote" placeholder="例：李顾问">
          <button class="btn" type="button" id="invgo">生成邀请链接</button>
          <div id="invout" aria-live="polite"></div>
          ${m.invites.length ? `<h3 style="margin-top:22px">已生成的邀请</h3>
            <div class="table-scroll" tabindex="0" role="region" aria-label="邀请记录，可横向滚动"><table class="data-table"><thead><tr><th>备注</th><th>状态</th><th style="width:120px">有效期至</th><th style="width:72px">操作</th></tr></thead><tbody>
            ${m.invites.map(i => `<tr><td>${esc(i.note || '（无备注）')}</td>
              <td>${i.used_by ? `<span class="st s-good"><span class="k">✓</span>${esc(i.used_by_name || '已使用')}</span>`
                : `<span class="st s-run"><span class="k">○</span>待使用</span>`}</td>
              <td class="n">${esc(i.expires_at.slice(0,10))}</td>
              <td>${i.used_by ? '' : `<button type="button" class="icon-btn danger" data-iv="${esc(i.id)}">删除</button>`}</td></tr>`).join('')}
            </tbody></table></div>` : ''}
        </div>`}
      </div>
      <div id="allannwrap"></div>
    </div>`);
  bindShell();

  const renderAnnotations = (draft = '', announcement = '') => {
    if (seq !== S.renderSeq || S.view !== 'members') return;
    const wrap = $('#allannwrap'); if (!wrap) return;
    wrap.innerHTML = annCard(annotationPage, 'company', 'all', {
      title: '全部批注', showTarget: true, submitTargetType: 'module', submitTargetKey: '00',
    });
    const body = $('#annbody', wrap); if (body) body.value = draft;
    bindAnn(() => render(), async currentDraft => {
      const continuation = annotationPage.next; if (!continuation) return;
      const before = annotationPage.items.length;
      const nextPayload = await api(annotationPageUrl({ ...annotationRequest, next: continuation }));
      if (seq !== S.renderSeq || S.view !== 'members') return;
      annotationPage = mergeAnnotationPages(annotationPage, nextPayload);
      renderAnnotations(currentDraft, `已加载 ${annotationPage.items.length - before} 条批注。`);
    });
    if (announcement) {
      const pageStatus = $('#annpagestatus', wrap);
      pageStatus.textContent = announcement;
      pageStatus.focus();
    }
  };
  renderAnnotations();

  if (!ro) {
    const g = $('#invgo');
    if (g) g.onclick = async () => {
      g.disabled = true; g.textContent = '生成中…';
      try {
        const r = await api(`/api/companies/${S.cid}/invites`, { method: 'POST', body: { note: $('#invnote').value } });
        const link = `${location.origin}/?invite=${r.code}`;
        $('#invout').innerHTML = `<div class="msg msg-o" role="status" style="word-break:break-all">
          邀请链接已生成（14 天内有效）：<br><b id="lk">${esc(link)}</b><br>
          <button type="button" class="link-btn lnk" id="cp">复制链接</button><span id="cpstatus" class="tiny" aria-live="polite"></span></div>`;
        $('#cp').onclick = async () => {
          const cp = $('#cp'); cp.disabled = true; $('#cpstatus').textContent = '';
          try { await copyText(link); cp.textContent = '已复制 ✓'; $('#cpstatus').textContent = '链接已复制到剪贴板'; }
          catch (copyError) { cp.disabled = false; $('#cpstatus').textContent = copyError.message; }
        };
      } catch (e) { if (e.status !== 401) setMessage($('#invout'), e.message); }
      if (document.contains(g)) { g.disabled = false; g.textContent = '生成邀请链接'; }
    };
    root().querySelectorAll('[data-iv]').forEach(x => x.onclick = async () => {
      x.disabled = true;
      try { await api(`/api/companies/${S.cid}/invites/${x.dataset.iv}`, { method: 'DELETE' }); await render(); }
      catch (e) { if (e.status !== 401) { x.disabled = false; alert(e.message); } }
    });
    root().querySelectorAll('[data-rm]').forEach(x => x.onclick = async () => {
      if (!confirm('把该成员移出这家企业？')) return;
      x.disabled = true;
      try { await api(`/api/companies/${S.cid}/members/${x.dataset.rm}`, { method: 'DELETE' }); await render(); }
      catch (e) { if (e.status !== 401) { x.disabled = false; alert(e.message); } }
    });
  }
}

/* ───────── 路由 ───────── */
function emptyCompanyIntakeHtml() {
  return `<section class="company-intake" aria-labelledby="company-intake-title">
    <div class="company-intake-copy"><span class="company-intake-kicker">AI 企业经营建档</span>
      <h1 id="company-intake-title">输入公司名称，生成十大模块经营底稿</h1>
      <p>AI 将核验公开资料、建立可追溯事实库，并一次形成十大模块底稿；所有事实和草案统一审核后才进入正式系统。</p></div>
    <form class="company-intake-form" id="companyintake">
      <label for="companyintakename">企业完整名称</label>
      <div><input id="companyintakename" class="f" autocomplete="organization" required maxlength="200"
        placeholder="例：华越精密制造有限公司">
        <button class="btn" type="submit" id="companyintakesubmit">开始生成 AI 经营底稿</button></div>
      <div class="company-intake-plan">
        <label for="companyintakeplan">商业计划书（可选）</label>
        <textarea id="companyintakeplan" class="f company-plan-text" rows="9" maxlength="1500000"
          placeholder="粘贴商业计划书全文"></textarea>
        <label for="companyintakefile">上传 .txt / .md / .pdf / .ppt / .pptx（单文件最大 500MB）</label>
        <input id="companyintakefile" class="f" type="file" accept=".txt,.md,.pdf,.ppt,.pptx,text/plain,text/markdown,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation">
      </div>
      <small>有计划书则按十大工作台拆栏规划；没有则仍只采公开资料。只需公司名称。遇到同名企业时，系统才会请你补充地区、股票代码或官网。</small>
      <div id="companyintakestatus" aria-live="polite"></div>
    </form>
    <ol class="company-intake-deliverables" aria-label="你将获得">
      <li><b>公开事实库</b><span>每条事实都保留来源与置信度</span></li>
      <li><b>十大模块完整底稿</b><span>区分来源支持的待审事实、AI 草案和内部待补</span></li>
      <li><b>统一人工确认</b><span>确认后才进入正式经营系统</span></li>
    </ol></section>`;
}

function bindEmptyCompanyIntake() {
  const form = $('#companyintake');
  if (!form) return;
  const planFile = $('#companyintakefile');
  bindPlanFileInput(planFile, $('#companyintakeplan'), $('#companyintakestatus'));
  form.onsubmit = async event => {
    event.preventDefault();
    const input = $('#companyintakename');
    const planInput = $('#companyintakeplan');
    const button = $('#companyintakesubmit');
    const name = String(input?.value || '').trim();
    const plan = String(planInput?.value || '').trim();
    const upload = planFile && planFile._ownerUpload;
    if (!name) { setMessage($('#companyintakestatus'), '请输入企业完整名称。'); input?.focus(); return; }
    button.disabled = true; input.disabled = true; if (planInput) planInput.disabled = true; if (planFile) planFile.disabled = true; button.textContent = upload ? '已收到，服务器抽取中' : '正在创建企业…';
    try { await createCompanyAndBootstrap(name, plan, upload); }
    catch (error) {
      if (error.status !== 401) {
        setMessage($('#companyintakestatus'), error.message || '创建企业失败，请稍后重试。');
        button.disabled = false; input.disabled = false; if (planInput) planInput.disabled = false; if (planFile) planFile.disabled = false; button.textContent = '开始生成 AI 经营底稿'; input.focus();
      }
    }
  };
}

async function render() {
  const seq = ++S.renderSeq;
  try {
    if (!S.cid) {
      root().innerHTML = shell(emptyCompanyIntakeHtml());
      bindShell(); bindEmptyCompanyIntake(); return;
    }
    if (S.view === 'board') return await viewBoard(seq);
    if (S.view === 'research') return await viewBootstrap(seq);
    if (S.view === 'wbs') return await viewWbs(seq);
    if (S.view === 'detail') return await viewDetail(seq);
    if (S.view === 'members') return await viewMembers(seq);
  } catch (e) {
    if (seq !== S.renderSeq || e.status === 401) return;
    root().innerHTML = shell(`<div class="msg msg-e" role="alert">${esc(e.message)}</div><button class="btn btn-g" type="button" id="viewretry" style="margin-top:12px">重试</button>`);
    bindShell(); $('#viewretry').onclick = () => render();
  }
}

async function acceptInviteFlow(code) {
  let info;
  try { info = await api(`/api/invites/${encodeURIComponent(code)}`); }
  catch (e) {
    if (![404, 410].includes(e.status)) { renderServiceError(e.message); return true; }
    root().innerHTML = `<div class="auth-wrap"><div class="auth"><h2>邀请无效</h2>
      <p class="s">${esc(e.message)}</p><button class="btn" type="button" id="k">回到首页</button></div></div>`;
    $('#k').onclick = () => { history.replaceState({}, '', '/'); boot(); };
    return true;
  }
  let me = null;
  try { me = normalizeMe(await api('/api/me')); }
  catch (e) { if (e.status !== 401) { renderServiceError(e.message); return true; } }
  if (!me) { showSessionExpired(); return true; }
  const companyName = info.company_name ?? info.company?.name ?? '受邀企业';
  root().innerHTML = `<div class="auth-wrap"><div class="auth">
    <h2>接受邀请</h2>
    <p class="s">${esc(me.user.name)}，你被邀请以<b>顾问</b>身份加入</p>
    <div class="card" style="margin:6px 0 4px"><b style="font-size:15px">${esc(companyName)}</b>
      <div class="tiny" style="margin-top:6px">顾问可以查看全部诊断与承诺、撰写批注，但不能修改企业数据。</div></div>
    <button class="btn" type="button" id="acc">接受邀请</button>
    <div class="alt"><button type="button" class="link-btn" id="no">暂不接受</button></div><div id="am" aria-live="polite"></div></div></div>`;
  $('#no').onclick = () => { history.replaceState({}, '', '/'); boot(); };
  $('#acc').onclick = async () => {
    const b = $('#acc'); b.disabled = true; b.textContent = '处理中…';
    try {
      const r = await api(`/api/invites/${encodeURIComponent(code)}/accept`, { method: 'POST' });
      history.replaceState({}, '', '/'); await boot(r.company_id ?? r.company?.id ?? r.id);
    } catch (e) { if (e.status !== 401) { setMessage($('#am'), e.message); b.disabled = false; b.textContent = '接受邀请'; } }
  };
  return true;
}

function normalizeCompanies(value) {
  const list = Array.isArray(value) ? value : [];
  return list.map(entry => {
    const company = entry?.company && typeof entry.company === 'object' ? entry.company : entry;
    return {
      ...company,
      id: company?.id ?? entry?.company_id,
      name: company?.name ?? entry?.company_name ?? '未命名企业',
      role: entry?.role ?? company?.role ?? 'owner',
    };
  }).filter(company => company.id !== undefined && company.id !== null);
}

function normalizeMe(payload) {
  const source = payload?.me && typeof payload.me === 'object' ? payload.me : payload || {};
  const rawUser = source.user ?? source.viewer ?? BOOTSTRAP.user ?? {};
  const user = {
    ...rawUser,
    id: rawUser.id ?? rawUser.user_id ?? rawUser.userId ?? BOOTSTRAP.user?.id,
    name: rawUser.name ?? rawUser.display_name ?? rawUser.displayName ?? BOOTSTRAP.user?.name ?? '当前用户',
  };
  const companies = normalizeCompanies(source.companies ?? source.memberships ?? source.company_memberships);
  return { user, companies };
}

async function loadCloudMeta() {
  const fallback = BOOTSTRAP.meta || { modules: [], llm: { mock: true, model: null } };
  try {
    const remote = await api('/api/meta', { auth: false });
    return {
      ...fallback,
      ...remote,
      modules: Array.isArray(remote?.modules) && remote.modules.length ? remote.modules : fallback.modules,
      llm: { ...(fallback.llm || {}), ...(remote?.llm || {}) },
    };
  } catch (error) {
    if (![404, 405, 501].includes(error.status)) throw error;
    return fallback;
  }
}

async function loadCloudMe() {
  try { return normalizeMe(await api('/api/me')); }
  catch (error) {
    if (error.status !== 404) throw error;
    const companiesPayload = await api('/api/companies');
    const companies = Array.isArray(companiesPayload) ? companiesPayload : companiesPayload.companies;
    return normalizeMe({ user: BOOTSTRAP.user, companies });
  }
}

async function shouldRestoreResearch(companyId) {
  try {
    const payload = normalizeResearch(await api(`/api/companies/${companyId}/research`));
    return researchNeedsAttention(payload.job);
  } catch (error) {
    if (error.status === 401) throw error;
    return false;
  }
}

async function shouldRestoreBootstrap(companyId) {
  try {
    const data = normalizeBootstrapOverview(await api(`/api/companies/${companyId}/bootstrap`));
    if (!data) return '';
    return data.status === 'applied' ? '' : 'bootstrap';
  } catch (error) {
    if (error.status === 401) throw error;
    if ([404, 405, 501].includes(error.status)) return await shouldRestoreResearch(companyId) ? 'research' : '';
    return '';
  }
}

async function boot(preferCid, preferView = 'board') {
  try {
    S.meta = await loadCloudMeta();
    const code = new URLSearchParams(location.search).get('invite');
    if (code) { if (await acceptInviteFlow(code)) return; }
    const me = await loadCloudMe();
    S.user = me.user; S.companies = me.companies;
    const requestedCid = preferCid === undefined || preferCid === null ? rememberedCurrentCompany() : preferCid;
    const preferred = requestedCid === undefined || requestedCid === null ? null
      : S.companies.find(company => String(company.id) === String(requestedCid));
    S.cid = preferred?.id ?? (S.companies[0] && S.companies[0].id) ?? null;
    rememberCurrentCompany(S.cid);
    const restoreMode = preferView === 'board' && S.cid
      ? await shouldRestoreBootstrap(S.cid)
      : '';
    S.researchRecovered = restoreMode === 'research'; S.bootstrapRecovered = restoreMode === 'bootstrap';
    const qs = new URLSearchParams(location.search);
    const qView = qs.get('view');
    const qModule = qs.get('m');
    if (!restoreMode && qView) preferView = qView;
    S.view = restoreMode ? 'research' : preferView;
    S.moduleNo = qModule || null; filt = 'all'; await render();
  } catch (e) {
    if (e.status === 401) showSessionExpired();
    else renderServiceError(e.message || '服务暂时不可用');
  }
}
boot();
