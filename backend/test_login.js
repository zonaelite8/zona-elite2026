fetch('http://127.0.0.1:5005/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'zonaelite8@gmail.com', password: 'Zonaelite2026.' })
})
.then(res => res.json().then(data => ({status: res.status, data})))
.then(console.log)
.catch(console.error);
