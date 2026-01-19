/**
 * 登录问题 Console 诊断脚本
 * 使用：在登录页或 /auth/callback 页打开 DevTools → Console，粘贴整段代码回车运行。
 *
 * ANON_KEY（可选）：填写后会在控制台请求 /auth/v1/user、/rest/v1/users 做完整检测。
 * 获取方式：Supabase Dashboard → Project Settings → API → anon public；
 * 或在 Network 里找发往 *.supabase.co 的请求，请求头里的 apikey 即 anon key。
 */
(function loginDebug() {
  const ANON_KEY = ''; // 可选：填写 anon key 后可在控制台请求 /auth/v1/user、/rest/v1/users 做完整检测

  const out = { log: console.log.bind(console), warn: console.warn.bind(console), error: console.error.bind(console) };
  out.log('========== 登录诊断开始 ==========');

  // 1) 从 localStorage 推断 Supabase 项目 URL
  let supabaseUrl = null;
  let projectRef = null;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      const m = k && k.match(/^sb-([a-zA-Z0-9-]+)-auth-token$/);
      if (m) {
        projectRef = m[1];
        supabaseUrl = `https://${projectRef}.supabase.co`;
        break;
      }
    }
  } catch (e) {
    out.warn('无法读取 localStorage:', e);
  }
  if (!supabaseUrl) {
    out.warn('未找到 sb-*-auth-token，无法推断 SupABASE_URL。请确认已访问过本站并曾尝试登录。');
  } else {
    out.log('推断 Supabase URL:', supabaseUrl, '| projectRef:', projectRef);
  }

  // 2) 解析所有 Supabase 相关 storage
  const storageKeys = { local: [], session: [] };
  ['localStorage', 'sessionStorage'].forEach((sn) => {
    try {
      const s = window[sn];
      if (!s) return;
      for (let i = 0; i < s.length; i++) {
        const k = s.key(i);
        if (k && (k.indexOf('supabase') !== -1 || k.indexOf('sb-') === 0)) {
          storageKeys[sn === 'localStorage' ? 'local' : 'session'].push(k);
        }
      }
    } catch (e) {
      out.warn('读取 ' + sn + ' 失败:', e);
    }
  });
  out.log('Supabase 相关 storage keys:', storageKeys);

  // 3) 解析 auth-token，得到当前 session / user
  let accessToken = null;
  let authUser = null;
  let authRaw = null;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || k.indexOf('-auth-token') === -1) continue;
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      try {
        const data = JSON.parse(raw);
        authRaw = data;
        const obj = data && (data.obj || data);
        const session = (obj && obj.session) || (data && data.session) || obj;
        const user = (session && session.user) || (obj && obj.user) || (data && data.user);
        if (user) {
          authUser = user;
          accessToken = (session && session.access_token) || (obj && obj.access_token) || (data && data.access_token) || null;
          out.log('解析到 auth 用户:', {
            id: user.id,
            email: user.email,
            provider: user.app_metadata?.provider,
            identities: user.identities?.length,
          });
        }
      } catch (e2) {
        // ignore
      }
    }
    if (typeof sessionStorage !== 'undefined') {
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (!k || k.indexOf('-auth-token') === -1) continue;
        const raw = sessionStorage.getItem(k);
        if (!raw) continue;
        try {
          const data = JSON.parse(raw);
          const obj = data && (data.obj || data);
          const session = obj && (obj.session || obj);
          const user = (session && session.user) || (obj && obj.user);
          if (user && !authUser) {
            authUser = user;
            authRaw = data;
            accessToken = (session && session.access_token) || (obj && obj.access_token) || null;
            out.log('从 sessionStorage 解析到 auth 用户:', { id: user.id, email: user.email });
          }
        } catch (e2) {}
      }
    }
  } catch (e) {
    out.warn('解析 auth-token 失败:', e);
  }

  if (!authUser) {
    out.warn('未解析到 auth 用户。可能：未登录、token 已清除、或在 OAuth 重定向前。');
  } else {
    const googleId =
      authUser.user_metadata?.provider_id ||
      authUser.user_metadata?.sub ||
      authUser.app_metadata?.provider_id ||
      authUser.id;
    out.log('当前 auth.uid():', authUser.id, '| 推断 google_id:', googleId, '| email:', authUser.email);
  }

  // 4) 若提供了 ANON_KEY 和 URL，请求 /auth/v1/user 和 /rest/v1/users
  if (ANON_KEY && supabaseUrl) {
    (async () => {
      if (!accessToken) {
        out.warn('无 access_token，跳过 /auth/v1/user 和 /rest/v1/users 请求。');
        return;
      }
      const headers = {
        apikey: ANON_KEY,
        Authorization: 'Bearer ' + accessToken,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      };

      // 4a) GET /auth/v1/user
      try {
        const rUser = await fetch(supabaseUrl + '/auth/v1/user', { method: 'GET', headers });
        out.log('[GET /auth/v1/user] status:', rUser.status, rUser.statusText);
        if (!rUser.ok) {
          const t = await rUser.text();
          out.error('[GET /auth/v1/user] body:', t);
        } else {
          const j = await rUser.json();
          out.log('[GET /auth/v1/user] user.id:', j?.id, 'email:', j?.email);
        }
      } catch (e) {
        out.error('[GET /auth/v1/user] 请求异常:', e);
      }

      // 4b) GET /rest/v1/users?id=eq.{auth.uid}（检查 RLS SELECT 是否通过）
      if (authUser && authUser.id) {
        try {
          const rUsers = await fetch(supabaseUrl + '/rest/v1/users?id=eq.' + encodeURIComponent(authUser.id), {
            method: 'GET',
            headers: { ...headers, 'Accept-Profile': 'public', 'Content-Profile': 'public' },
          });
          out.log('[GET /rest/v1/users?id=eq.<auth.uid>] status:', rUsers.status, rUsers.statusText);
          if (rUsers.status === 403) {
            out.error('  → 403: RLS 拒绝 SELECT，或 JWT 无效/过期。');
          } else if (rUsers.status === 406) {
            out.error('  → 406: Accept 或 Accept-Profile 与服务器不匹配，或 API 版本问题。');
          }
          if (!rUsers.ok) {
            out.error('  body:', await rUsers.text());
          } else {
            const list = await rUsers.json();
            out.log('  rows:', Array.isArray(list) ? list.length : '-', list);
          }
        } catch (e) {
          out.error('[GET /rest/v1/users] 请求异常:', e);
        }
      }
    })();
  } else if (!ANON_KEY && supabaseUrl) {
    out.warn('未设置 ANON_KEY，已跳过 /auth/v1/user 与 /rest/v1/users 请求。如需完整检测，请在脚本顶部填写 ANON_KEY。');
  }

  // 5) 捕获后续 403/406（可选：hook fetch）
  try {
    const _fetch = window.fetch;
    window.fetch = function (...args) {
      return _fetch.apply(this, args).then((res) => {
        const url = (args[0] && (typeof args[0] === 'string' ? args[0] : args[0].url)) || '';
        if ((res.status === 403 || res.status === 406) && (url.indexOf('supabase') !== -1 || url.indexOf('/rest/') !== -1 || url.indexOf('/auth/') !== -1)) {
          out.error('[Login 诊断] 检测到异常响应:', res.status, url);
        }
        return res;
      });
    };
    out.log('已安装 fetch 钩子：后续 403/406 的 Supabase 请求会在控制台标出。刷新页面可移除。');
  } catch (e) {
    out.warn('安装 fetch 钩子失败:', e);
  }

  // 6) 常见原因与建议
  out.log('--- 常见原因与建议 ---');
  out.log('1) 403 + “Error creating user via upsert”：');
  out.log('   - RLS：users 的 INSERT 要求 auth.uid()=id，UPDATE 要求 auth.uid()=id。若 upsert 在 session 未完全生效时执行，或 id 与 auth.uid() 不一致，会 403。');
  out.log('   - 建议：在 /auth/callback 内确保 exchange 完成且 getSession/getUser 成功后，再调 users 的 upsert；且插入的 id 必须为 auth 的 user.id。');
  out.log('2) 406：');
  out.log('   - 多为 Accept / Accept-Profile / Content-Profile 与 PostgREST 不匹配，或 Supabase 版本差异。');
  out.log('   - 建议：检查 @supabase/supabase-js 版本与 Supabase 项目版本；若自建了 fetch，确保 Accept: application/json。');
  out.log('3) 换账号登录失败（同一邮箱、不同 Google 账号）：');
  out.log('   - users 表有 email UNIQUE。新 Google 账号若与旧账号共用一个 email，INSERT 会触发 email 唯一约束冲突；onConflict 仅针对 google_id，无法化解 email 冲突。');
  out.log('   - 建议：在 callback 先按 email 查询，若存在且 google_id 不同，则 UPDATE 该行的 google_id；或由服务端用 service_role 做“按邮箱合并/绑定新 google_id”的逻辑。');
  out.log('4) 多账号 / 旧 session 干扰：');
  out.log('   - 清理本站 Cookie、localStorage、sessionStorage 后，再换账号重试。');
  out.log('========== 登录诊断结束 ==========');
})();
