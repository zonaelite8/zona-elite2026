// Check what the live API returns for today's date
fetch('https://zonaelitemarinilla.com/api/slots?date=2026-07-14')
  .then(r => r.json())
  .then(d => {
    console.log('Total slots for July 14:', d.length);
    if (d.length > 0) {
      console.log('Sample:', d[0]);
    }
  })
  .catch(console.error);

// Also check admin (will fail auth but that's fine - just testing routing)
fetch('https://zonaelitemarinilla.com/api/slots/admin?date=2026-07-14')
  .then(r => r.text())
  .then(d => console.log('Admin response:', d.substring(0, 200)))
  .catch(console.error);
