const fs = require('fs');

const files = [
  'public/index.html',
  'public/vault.html',
  'public/orders.html',
  'public/admin.html',
  'public/login.html',
  'public/checkout.html'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Fix logo.jpg in dark mode
    content = content.replace(/<img src="\/logo.jpg"([^>]*)class="([^"]*)"([^>]*)>/g, (match, p1, p2, p3) => {
        if (!p2.includes('dark:bg-white')) {
            return `<img src="/logo.jpg"${p1}class="${p2} dark:bg-white dark:p-1 dark:rounded-lg"${p3}>`;
        }
        return match;
    });

    // Fix ambient pokemon visibility in dark mode
    // They currently have: opacity-15 mix-blend-multiply
    // We want to add: dark:opacity-40 dark:mix-blend-normal
    content = content.replace(/opacity-15 mix-blend-multiply/g, 'opacity-15 mix-blend-multiply dark:opacity-40 dark:mix-blend-normal');
    
    fs.writeFileSync(file, content);
  }
}
console.log('Logo and ambient pokemons updated for dark mode.');
