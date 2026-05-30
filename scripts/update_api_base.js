const fs = require('fs');

const files = [
  'public/index.html',
  'public/admin.html',
  'public/login.html',
  'public/checkout.html',
  'public/orders.html',
  'public/vault.html'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/const API_BASE = ['"]http:\/\/localhost:3000['"];/g, "const API_BASE = '';");
    fs.writeFileSync(file, content);
  }
}
console.log('API_BASE updated to relative paths in frontend files.');
