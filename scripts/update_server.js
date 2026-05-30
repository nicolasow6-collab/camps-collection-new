const fs = require('fs');

const file = 'server.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'const { customer, items, payment_method, notes } = req.body;',
  'const { customer, items, payment_method, notes, unique_code } = req.body;'
);

content = content.replace(
  'const total = items.reduce((sum, item) => sum + (parseInt(item.price.replace(/[^0-9]/g, \'\')) || 0), 0);',
  'let total = items.reduce((sum, item) => sum + (parseInt(item.price.replace(/[^0-9]/g, \'\')) || 0), 0);\n  if (unique_code) total += parseInt(unique_code) || 0;'
);

fs.writeFileSync(file, content);
console.log('server.js updated');
