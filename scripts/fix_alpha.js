const fs = require('fs');

const files = ['public/orders.html', 'public/admin.html', 'public/index.html'];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Fix double slashes in alpha
    content = content.replace(/bg-zinc-900\/50\/50/g, 'bg-zinc-900/50');
    content = content.replace(/bg-zinc-900\/50\/80/g, 'bg-zinc-900/80');
    
    fs.writeFileSync(file, content);
  }
}
console.log('Fixed double alpha bug.');
