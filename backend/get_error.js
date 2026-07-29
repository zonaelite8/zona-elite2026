async function getError() {
  const url = 'https://zona-elite2026.onrender.com/api/setup';
  try {
    const res = await fetch(url);
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Response body:', text);
  } catch (e) {
    console.error('Fetch error:', e.message);
  }
}
getError();
