const fs = require('fs');

const file = 'public/checkout.html';
let content = fs.readFileSync(file, 'utf8');

// 1. Add BCA and QRIS logos
content = content.replace(
  '<span class="font-medium text-sm">BCA Transfer</span>',
  '<div class="flex items-center gap-2"><img src="https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg" alt="BCA" class="h-4 bg-white px-1 py-0.5 rounded"><span class="font-medium text-sm">BCA Transfer</span></div>'
);

content = content.replace(
  '<span class="font-medium text-sm">QRIS</span>',
  '<div class="flex items-center gap-2"><img src="https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_QRIS.svg" alt="QRIS" class="h-4 bg-white px-1 py-0.5 rounded"><span class="font-medium text-sm">QRIS</span></div>'
);

// 2. Add Copy button for BCA Account Number
content = content.replace(
  '<p class="text-lg font-bold tracking-tight mb-1">5920308661</p>',
  `<div class="flex items-center gap-2 mb-1">
     <p class="text-lg font-bold tracking-tight" id="bca-account">5920308661</p>
     <button type="button" onclick="copyToClipboard('5920308661', this)" class="text-xs font-medium bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 px-2 py-1 rounded-md text-zinc-600 dark:text-zinc-300 transition-colors flex items-center gap-1">
       <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
       Copy
     </button>
   </div>`
);

// 3. Javascript: 3-digit unique code, copy function, and dynamic WhatsApp link
// Replace renderCheckoutItems
const oldRenderCheckoutItems = `
      document.getElementById('checkout-subtotal').textContent = \`Rp\${subtotal.toLocaleString()}\`;
      document.getElementById('checkout-total').textContent = \`Rp\${subtotal.toLocaleString()}\`;
    }

    renderCheckoutItems();
`;

const newRenderCheckoutItems = `
      document.getElementById('checkout-subtotal').textContent = \`Rp\${subtotal.toLocaleString('id-ID')}\`;
      
      // Generate 3-digit unique code if not exists
      if (!window.uniqueCode) {
          window.uniqueCode = Math.floor(Math.random() * 900) + 100; // 100-999
      }
      
      window.checkoutTotal = subtotal + window.uniqueCode;
      
      document.getElementById('checkout-total').innerHTML = \`Rp\${window.checkoutTotal.toLocaleString('id-ID')} <span class="text-xs text-emerald-500 block text-right font-normal mt-0.5">Termasuk kode unik: \${window.uniqueCode}</span>\`;
    }

    renderCheckoutItems();

    function copyToClipboard(text, btn) {
        navigator.clipboard.writeText(text).then(() => {
            const originalText = btn.innerHTML;
            btn.innerHTML = '<svg class="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Copied!';
            setTimeout(() => { btn.innerHTML = originalText; }, 2000);
        });
    }
`;

content = content.replace(oldRenderCheckoutItems, newRenderCheckoutItems);

// In placeOrder(), we need to pass the new total to the backend.
// Currently the backend calculates total based on items. The backend doesn't know about unique code unless we send it.
// Wait, the backend in server.js recalculates total! If backend recalculates, the unique code will be lost.
// I should update the WhatsApp link dynamically in the success modal!
// The WhatsApp link is currently hardcoded in the HTML:
// <a href="https://api.whatsapp.com/send/?phone=6285815801715&text=Halo! Saya sudah transfer BCA untuk order di Campt's Collection" target="_blank" class="text-zinc-900 dark:text-zinc-100 underline">WhatsApp</a>
// And in the success modal it just says "We'll contact you". We should change the success modal to have a button to WhatsApp!

const oldSuccessModal = `<a href="/" class="inline-block w-full py-2.5 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors text-sm font-medium">
        Continue Shopping
      </a>`;

const newSuccessModal = `<a id="wa-confirm-btn" href="#" target="_blank" class="inline-flex items-center justify-center gap-2 w-full py-3 bg-[#25D366] text-white rounded-lg hover:bg-[#1ebd5b] transition-colors text-sm font-bold shadow-lg shadow-[#25D366]/20 mb-3">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        Confirm Payment via WhatsApp
      </a>
      <a href="/" class="inline-block w-full py-2.5 bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors text-sm font-medium">
        Continue Shopping
      </a>`;

content = content.replace(oldSuccessModal, newSuccessModal);

// Now update placeOrder() to populate the WA link
const placeOrderSuccess = `
        if (res.ok) {
          const data = await res.json();
          const orderId = data.orderId;
          
          localStorage.removeItem('cart');
          
          // Populate success modal
          document.getElementById('order-id-display').textContent = 'Order ID: ' + orderId;
          
          // Generate WhatsApp Link
          const waPhone = "6285815801715";
          const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
          const totalStr = \`Rp\${window.checkoutTotal.toLocaleString('id-ID')}\`;
          
          let text = \`Halo Campt! Saya ingin konfirmasi pembayaran untuk pesanan saya.\\n\\n\`;
          text += \`*Order ID:* \${orderId}\\n\`;
          text += \`*Total Transfer:* \${totalStr}\\n\`;
          text += \`*Metode:* \${paymentMethod}\\n\\n\`;
          text += \`Berikut saya lampirkan bukti transfernya. Terima kasih!\`;
          
          document.getElementById('wa-confirm-btn').href = \`https://api.whatsapp.com/send/?phone=\${waPhone}&text=\${encodeURIComponent(text)}\`;
          
          document.getElementById('success-modal').classList.remove('hidden');
        }
`;

content = content.replace(/(if \(res\.ok\) \{)[\s\S]*?(else \{ const err = await res\.json\(\); showToast\(err\.error \|\| 'Failed to save order', 'error'\); \})/, placeOrderSuccess + '        } $2');

fs.writeFileSync(file, content);
console.log('Checkout UX improvements applied');
