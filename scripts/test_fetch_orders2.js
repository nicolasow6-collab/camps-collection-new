require('dotenv').config();
const jwt = require('jsonwebtoken');
const http = require('http');

const token = jwt.sign({ id: 1, username: 'admin', role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '8h' });

const req = http.request('http://localhost:3000/api/admin/orders', {
  headers: { 'Authorization': `Bearer ${token}` }
}, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    if (res.statusCode === 200) {
      console.log('Parsed items length:', JSON.parse(data).length);
    } else {
      console.log('Response Error:', data);
    }
  });
});
req.end();
