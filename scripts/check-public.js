#!/usr/bin/env node
// Vérifie uniquement l'URL publique pajo-pharma-delta.vercel.app
const fetch = globalThis.fetch || require('node-fetch');

const url = 'https://pajo-pharma-delta.vercel.app';

async function check() {
  console.log('=== Vérification publique pour:', url, '===');
  try {
    const h = await fetch(`${url}/api/health`, { method: 'GET', timeout: 15000 });
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

  try {
    const username = process.env.PROD_ADMIN_USERNAME;
    const password = process.env.PROD_ADMIN_PASSWORD;
    const role = process.env.PROD_ADMIN_ROLE || 'admin';

    if (!username || !password) {
      console.log('⚠️  PROD_ADMIN_USERNAME or PROD_ADMIN_PASSWORD not set — skipping test-login (set them as env vars or GitHub secrets to enable).');
    } else {
      const body = { username, password, role };
      const r = await fetch(`${url}/api/test-login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), timeout: 15000 });
      console.log('test-login status:', r.status);
      const ct2 = r.headers.get('content-type');
      if (ct2 && ct2.includes('application/json')) {
        const j2 = await r.json();
        console.log('test-login JSON:', JSON.stringify(j2, null, 2));
      } else {
        const t2 = await r.text();
        console.log('test-login body (preview):', t2.slice(0, 400));
      }
    }
  } catch (e) {
    console.error('test-login fetch error:', e.message);
  }
}

check();
