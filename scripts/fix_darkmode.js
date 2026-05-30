const fs = require('fs');

const htmlFiles = [
  'public/admin.html',
  'public/checkout.html',
  'public/index.html',
  'public/login.html',
  'public/orders.html',
  'public/tnc.html',
  'public/vault.html'
];

const oldDarkLogic = `if (localStorage.getItem('color-theme') === 'dark' || (!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {`;
const newDarkLogic = `if (localStorage.getItem('color-theme') === 'dark') {`;

for (const file of htmlFiles) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes(oldDarkLogic)) {
      content = content.replace(oldDarkLogic, newDarkLogic);
      fs.writeFileSync(file, content);
      console.log(`Patched ${file}`);
    }
  }
}
