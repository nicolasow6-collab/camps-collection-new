const fs = require('fs');

const replacement = `
        <div>
          <h4 class="font-semibold text-sm mb-3 text-zinc-900">Marketplaces</h4>
          <div class="flex flex-col items-start gap-2">
            <a href="https://jp.mercari.com/" target="_blank" class="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-[#E32B36] rounded-lg shadow-sm hover:scale-105 transition-transform w-36">Mercari Japan</a>
            <a href="https://snkrdunk.com/en/" target="_blank" class="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-black rounded-lg shadow-sm hover:scale-105 transition-transform w-36">SNKRDUNK</a>
            <a href="https://auctions.yahoo.co.jp/" target="_blank" class="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-[#6002EE] rounded-lg shadow-sm hover:scale-105 transition-transform w-36">Yahoo Auctions</a>
          </div>
        </div>
        <div>
          <h4 class="font-semibold text-sm mb-3 text-zinc-900">Support</h4>
          <div class="flex flex-col items-start gap-2">
            <a href="/#faq" class="inline-flex items-center px-4 py-2 text-xs font-medium text-zinc-700 bg-zinc-100 border border-zinc-200 rounded-lg shadow-sm hover:bg-zinc-200 transition-colors w-40">FAQ</a>
            <a href="https://api.whatsapp.com/send/?phone=6285815801715" target="_blank" class="inline-flex items-center px-4 py-2 text-xs font-medium text-zinc-700 bg-zinc-100 border border-zinc-200 rounded-lg shadow-sm hover:bg-zinc-200 transition-colors w-40">Contact Support</a>
            <a href="/tnc.html" class="inline-flex items-center px-4 py-2 text-xs font-medium text-zinc-700 bg-zinc-100 border border-zinc-200 rounded-lg shadow-sm hover:bg-zinc-200 transition-colors w-40">Terms & Conditions</a>
          </div>
        </div>`;

const files = ['public/index.html', 'public/vault.html'];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace old footer columns
    const target = /<div>\s*<h4 class="font-semibold text-sm mb-3 text-zinc-900">Marketplaces<\/h4>\s*<ul class="space-y-2 text-sm text-zinc-500"><li>Mercari Japan<\/li><li>SNKRDUNK<\/li><li>Yahoo Auctions<\/li><\/ul>\s*<\/div>\s*<div>\s*<h4 class="font-semibold text-sm mb-3 text-zinc-900">Support<\/h4>\s*<ul class="space-y-2 text-sm text-zinc-500"><li>FAQ<\/li><li>Contact<\/li><li>Terms & Conditions<\/li><\/ul>\s*<\/div>/g;
    
    // If not found in one line style, replace using a simpler regex targeting the two blocks
    let newContent = content.replace(target, replacement.trim());
    
    if (newContent === content) {
        // Fallback replacement if formatting differs slightly
        const fallbackTarget = /<div>\s*<h4 class="font-semibold text-sm mb-3 text-zinc-900">Marketplaces<\/h4>[\s\S]*?Terms & Conditions<\/li><\/ul>\s*<\/div>/;
        newContent = content.replace(fallbackTarget, replacement.trim());
    }
    
    fs.writeFileSync(file, newContent);
  }
}
console.log('Footer updated.');
