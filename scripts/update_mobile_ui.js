const fs = require('fs');

const files = [
  'public/index.html',
  'public/admin.html',
  'public/login.html',
  'public/checkout.html',
  'public/orders.html',
  'public/vault.html'
];

const waButton = `
  <!-- Floating WhatsApp Button -->
  <a href="https://api.whatsapp.com/send/?phone=6285815801715&text&type=phone_number&app_absent=0" target="_blank"
     class="fixed bottom-6 right-6 bg-[#25D366] text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-[100] group">
    <svg class="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.878-.788-1.471-1.761-1.643-2.06-.173-.298-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
    <!-- Always visible text bubble next to WA button -->
    <span class="absolute right-16 bg-white text-zinc-900 text-sm px-4 py-2 rounded-xl shadow-md border border-zinc-100 font-medium whitespace-nowrap opacity-100">
      Need Help?
    </span>
  </a>
</body>
`;

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // 1. Fix Navigation wrap
    // Currently most have: <div class="max-w-7xl mx-auto px-6 h-14 grid grid-cols-3 items-center">
    // Some have: h-16
    content = content.replace(
      /<div class="max-w-7xl mx-auto px-6 h-1([46]) grid grid-cols-3 items-center([^"]*)">/g,
      '<div class="max-w-7xl mx-auto px-6 py-3 md:h-1$1 flex flex-wrap md:grid md:grid-cols-3 items-center justify-between gap-y-3$2">'
    );
    
    // Also we need to make the middle section wrap to its own line on mobile
    // <div class="flex items-center justify-center gap-6 text-sm font-medium text-zinc-400">
    content = content.replace(
      /<div class="flex items-center justify-center gap-6 text-sm font-medium text-zinc-400">/g,
      '<div class="flex items-center justify-center gap-4 md:gap-6 text-sm font-medium text-zinc-400 w-full md:w-auto order-3 md:order-none">'
    );
    
    // 2. Remove old floating WA button if it exists
    content = content.replace(/<!-- Floating WhatsApp Button -->[\s\S]*?<\/a>/, '');
    
    // 3. Inject new Floating WA button just before </body>
    content = content.replace(/(<body[^>]*>)/, '$1\n  <div class="overflow-x-hidden">'); // Ensure no horizontal scroll issues
    content = content.replace(/(<\/body>)/, '  </div>\n' + waButton);
    
    fs.writeFileSync(file, content);
  }
}
console.log('Mobile UI and WA button updated.');
