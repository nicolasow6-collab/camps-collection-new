const fs = require('fs');

const files = ['public/index.html', 'public/vault.html', 'public/admin.html', 'public/login.html', 'public/orders.html'];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Add 'relative' class to body if it doesn't exist
  if (content.includes('<body class="') && !content.includes('class="relative') && !content.includes(' relative')) {
    content = content.replace('<body class="', '<body class="relative ');
  }
  
  fs.writeFileSync(file, content);
}
console.log('HTML files updated with relative body');
