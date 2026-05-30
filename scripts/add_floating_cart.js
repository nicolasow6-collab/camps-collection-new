const fs = require('fs');

const files = ['public/index.html', 'public/vault.html'];

const floatingCartHtml = `
  <!-- Floating Cart Button -->
  <button id="floating-cart-btn" class="fixed top-20 right-6 w-12 h-12 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full shadow-2xl flex items-center justify-center z-40 transition-all duration-300 transform scale-0 origin-center hover:scale-110">
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
    <span id="floating-cart-count" class="absolute -top-1 -right-1 bg-poke-red text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-800 transition-all">0</span>
  </button>
`;

const floatingCartJs = `
    // Floating Cart Logic
    window.addEventListener('scroll', () => {
      const mainCartBtn = document.getElementById('cart-btn');
      const floatingBtn = document.getElementById('floating-cart-btn');
      if (mainCartBtn && floatingBtn) {
        const rect = mainCartBtn.getBoundingClientRect();
        // Show floating if main cart is out of viewport (rect.bottom < 0)
        if (rect.bottom < 0) {
          floatingBtn.classList.remove('scale-0');
          floatingBtn.classList.add('scale-100');
        } else {
          floatingBtn.classList.add('scale-0');
          floatingBtn.classList.remove('scale-100');
        }
      }
    });

    const fbtn = document.getElementById('floating-cart-btn');
    if (fbtn) {
      fbtn.addEventListener('click', () => {
        document.getElementById('cart-btn').click();
      });
    }
`;

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    // Inject HTML just before <!-- Cart Slide Panel -->
    if (!content.includes('id="floating-cart-btn"')) {
      content = content.replace('<!-- Cart Slide Panel -->', floatingCartHtml + '\n  <!-- Cart Slide Panel -->');
    }

    // Inject JS inside <script> at the end
    if (!content.includes('Floating Cart Logic')) {
      content = content.replace('</script>\n</body>', floatingCartJs + '\n</script>\n</body>');
    }
    
    // Update updateCart() logic
    const oldUpdate = "document.getElementById('cart-count').textContent = cart.length;";
    const newUpdate = "document.getElementById('cart-count').textContent = cart.length;\n      if(document.getElementById('floating-cart-count')) document.getElementById('floating-cart-count').textContent = cart.length;";
    
    if (content.includes(oldUpdate) && !content.includes("floating-cart-count').textContent")) {
      content = content.replace(oldUpdate, newUpdate);
    }

    fs.writeFileSync(file, content);
    console.log('Floating cart added to ' + file);
  }
}
