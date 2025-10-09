const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function call() {
  const url = 'https://pajo-pharma-6qbhppyqk-nzamba-simons-projects.vercel.app/api/debug-login';
  console.log('POST', url);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123', role: 'admin' }),
      timeout: 20000,
    });
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Body:', text.substring(0, 2000));
  } catch (e) {
    console.error('Fetch error:', e.message);
  }
}

call();