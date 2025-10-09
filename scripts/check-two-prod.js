#!/usr/bin/env node
// Petit script de vérification pour les deux URL de production
// Vérifie GET /api/health et POST /api/test-login (avec admin/admin123)

const fetch = globalThis.fetch || require('node-fetch');

const urls = [
  'https://pajo-pharma-delta.vercel.app',
  'https://pajo-pharma-oftri0ikc-nzamba-simons-projects.vercel.app'
];

// Accept bypass token either from env BYPASS_TOKEN or as first CLI arg
const bypassToken = process.env.BYPASS_TOKEN || process.argv[2] || null;
if (bypassToken) {
  console.log('Using bypass token from', process.env.BYPASS_TOKEN ? 'env BYPASS_TOKEN' : 'CLI arg');
}

async function check(url) {
  console.log('\n=== Vérification pour:', url, '===');
  try {
  const headers = bypassToken ? { Authorization: `Bearer ${bypassToken}` } : undefined;
  const h = await fetch(`${url}/api/health`, { method: 'GET', timeout: 15000, headers });
    console.log('Health status:', h.status);
    const ct = h.headers.get('content-type');
    console.log('Content-Type:', ct);
    if (ct && ct.includes('application/json')) {
      const j = await h.json();
      console.log('Health JSON:', JSON.stringify(j, null, 2));
    } else {
      const t = await h.text();
      console.log('Health body (preview):', t.slice(0, 400));
    }
  } catch (e) {
    console.error('Health fetch error:', e.message);
  }

  // test-login
  try {
  const body = { username: 'admin', password: 'admin123', role: 'admin' };
  const headers2 = Object.assign({}, bypassToken ? { Authorization: `Bearer ${bypassToken}` } : {}, { 'Content-Type': 'application/json' });
  const r = await fetch(`${url}/api/test-login`, { method: 'POST', headers: headers2, body: JSON.stringify(body), timeout: 15000 });
    console.log('test-login status:', r.status);
    const ct2 = r.headers.get('content-type');
    if (ct2 && ct2.includes('application/json')) {
      const j2 = await r.json();
      console.log('test-login JSON:', JSON.stringify(j2, null, 2));
    } else {
      const t2 = await r.text();
      console.log('test-login body (preview):', t2.slice(0, 400));
    }
  } catch (e) {
    console.error('test-login fetch error:', e.message);
  }
}

(async () => {
  for (const u of urls) {
    await check(u);
  }
})();
