const http = require('http');

async function test() {
  const req = http.request('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, res => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Login res:', data);
    });
  });
  // Since we don't know the admin password, we can generate a valid JWT manually using the secret.
}
test();
