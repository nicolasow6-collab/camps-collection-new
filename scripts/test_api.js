const fetch = require('node-fetch');

async function run() {
  // Login
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'password' }) // Wait, the password is randomly generated or user changed it.
  });
  const loginData = await loginRes.json();
  console.log(loginData);
}
run();
