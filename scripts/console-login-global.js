/**
 * 全局登录诊断 Console 脚本 — 用于完整复现与反馈
 *
 * 使用：
 * 1. 在登录页打开 DevTools → Console，粘贴整段代码回车运行（在点击登录之前）
 * 2. 按正常流程：点「Sign in with Google」、完成 OAuth、等报错或成功
 * 3. OAuth 跳转后会在新页面，此时 __COPY_LOGIN_REPORT 不存在是正常的
 * 4. 在新页面（如显示「Sign in failed」的页）再次粘贴并运行本脚本，然后执行： __COPY_LOGIN_REPORT()
 * 5. 把输出的整段文本复制发给我（日志已通过 sessionStorage 跨页保留）
 *
 * 会记录：所有 fetch（含 /api/auth/fix-user-id、*.supabase.co）、状态码与 body 摘要、相关 console.error/warn。
 */
(function () {
  const MAX_BODY = 1200;
  const STORAGE_KEY = '__login_diag_log';
  let LOG = [];
  try {
    const prev = sessionStorage.getItem(STORAGE_KEY);
    if (prev) { LOG = JSON.parse(prev); }
  } catch (e) {}
  const ts = () => new Date().toISOString();

  function persist() {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(LOG)); } catch (e) {}
  }

  function mask(v) {
    if (v == null || typeof v !== 'string') return v;
    if (v.length <= 12) return '***';
    return v.slice(0, 4) + '…' + v.slice(-4);
  }

  function truncate(obj) {
    const s = typeof obj === 'string' ? obj : JSON.stringify(obj);
    return s.length <= MAX_BODY ? s : s.slice(0, MAX_BODY) + '...[truncated]';
  }

  function redactHeaders(h) {
    if (!h || typeof h.forEach !== 'function') return {};
    const o = {};
    h.forEach((v, k) => {
      const l = k.toLowerCase();
      if (l === 'authorization') o[k] = v.startsWith('Bearer ') ? 'Bearer ' + mask(v.slice(7)) : '[redacted]';
      else if (l === 'apikey' || l === 'x-api-key') o[k] = mask(v);
      else o[k] = v;
    });
    return o;
  }

  // --- 1) 钩子 fetch ---
  const _fetch = window.fetch;
  window.fetch = function (input, init) {
    const url = typeof input === 'string' ? input : (input && input.url) || '';
    const method = (init && init.method) || 'GET';
    const t0 = Date.now();
    const isAuth =
      /\/api\/auth\/(fix-user-id|welcome-bonus|logout)/.test(url) ||
      /\/auth\/callback/.test(url) ||
      /\.supabase\.co\/(auth\/|rest\/)/.test(url);

    return _fetch.apply(this, arguments).then(
      async (res) => {
        const duration = Date.now() - t0;
        let reqBody = null;
        try {
          if (init && init.body != null) reqBody = typeof init.body === 'string' ? init.body : '[Body]';
        } catch (_) {}
        let resBody = null;
        try {
          const clone = res.clone();
          const text = await clone.text();
          try {
            resBody = JSON.parse(text);
          } catch (_) {
            resBody = text;
          }
        } catch (_) {
          resBody = '[read error]';
        }

        const entry = {
          t: ts(),
          type: 'fetch',
          url,
          method,
          status: res.status,
          statusText: res.statusText,
          duration,
          requestHeaders: init && init.headers ? redactHeaders(init.headers instanceof Headers ? init.headers : new Headers(init.headers)) : undefined,
          requestBody: reqBody != null ? truncate(reqBody) : undefined,
          responseBody: resBody != null ? truncate(resBody) : undefined,
        };
        LOG.push(entry);
        persist();
        // 对登录相关请求与异常状态在控制台高亮
        if (isAuth || res.status >= 400) {
          console.warn('[Login 诊断]', res.status, method, url, duration + 'ms', res.status >= 400 ? resBody : '');
        }
        return res;
      },
      (err) => {
        LOG.push({ t: ts(), type: 'fetch_error', url, method, error: String(err && err.message || err) });
        persist();
        console.error('[Login 诊断] fetch 失败', url, err);
        throw err;
      }
    );
  };

  // --- 2) 记录 console.error / console.warn（仅与 auth、fix-user-id、login、Supabase 相关）---
  const key = /auth|fix-user-id|login|supabase|unauthorized|401|403|406|session|getUser|getSession|exchange|oauth|token|credential/i;
  const _err = console.error;
  const _warn = console.warn;
  console.error = function (...a) {
    const msg = a.map((x) => (typeof x === 'object' ? JSON.stringify(x) : String(x))).join(' ');
    if (key.test(msg)) { LOG.push({ t: ts(), type: 'console.error', msg }); persist(); }
    return _err.apply(this, a);
  };
  console.warn = function (...a) {
    const msg = a.map((x) => (typeof x === 'object' ? JSON.stringify(x) : String(x))).join(' ');
    if (key.test(msg)) { LOG.push({ t: ts(), type: 'console.warn', msg }); persist(); }
    return _warn.apply(this, a);
  };

  // --- 3) 导出：复制用（从 sessionStorage 读取，支持 OAuth 跳转后在新页运行）---
  window.__COPY_LOGIN_REPORT = function __COPY_LOGIN_REPORT() {
    let log = LOG;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) { const parsed = JSON.parse(raw); if (Array.isArray(parsed) && parsed.length) log = parsed; }
    } catch (e) {}
    const dump = {
      meta: { at: ts(), url: typeof location !== 'undefined' ? location.href : '', userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '' },
      log,
    };
    const str = JSON.stringify(dump, null, 2);
    console.log('======== 请复制下面整段（到 ======== 结束）发给我 ========');
    console.log(str);
    console.log('======== 请复制上面整段发给我 ========');
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(str);
        console.log('已自动写入剪贴板，可直接 Ctrl+V 粘贴。');
      }
    } catch (_) {}
    try { sessionStorage.removeItem(STORAGE_KEY); } catch (_) {}
    LOG.length = 0;
    return str;
  };

  // --- 4) 快照：当前 storage 与 inferred 状态（便于对比）---
  window.__SNAPSHOT_LOGIN = function __SNAPSHOT_LOGIN() {
    const ls = {};
    const ss = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.includes('supabase') || k.includes('sb-'))) ls[k] = '[present]';
      }
    } catch (_) {}
    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k && (k.includes('supabase') || k.includes('sb-'))) ss[k] = '[present]';
      }
    } catch (_) {}
    const snap = { t: ts(), localStorage: ls, sessionStorage: ss };
    LOG.push({ t: ts(), type: 'snapshot', ...snap });
    persist();
    console.log('[Login 诊断] 已做 storage 快照，会在 __COPY_LOGIN_REPORT 中一起导出。');
    return snap;
  };

  console.log('[Login 诊断] 已安装全局钩子，日志已持久化到 sessionStorage。');
  console.log('请先点登录、完成 OAuth；若跳转到新页后 __COPY_LOGIN_REPORT 未定义，请在新页再次粘贴运行本脚本，然后执行 __COPY_LOGIN_REPORT() 即可导出。');
  console.log('可选：__SNAPSHOT_LOGIN() 记录 storage 快照。');
})();
