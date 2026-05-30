const fs = require('fs');

const file = 'public/checkout.html';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'const body = JSON.stringify({ customer: { name, email, phone, address, city, province, postal_code, instagram: ig }, items: cart, payment_method: payment, notes });',
  'const body = JSON.stringify({ customer: { name, email, phone, address, city, province, postal_code, instagram: ig }, items: cart, payment_method: payment, notes, unique_code: window.uniqueCode });'
);

fs.writeFileSync(file, content);
console.log('checkout.html updated to pass unique_code');
