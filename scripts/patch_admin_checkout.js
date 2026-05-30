const fs = require('fs');

// ============================================
// 1. Patch checkout.html for smooth transitions
// ============================================
let checkout = fs.readFileSync('public/checkout.html', 'utf8');

// Add smooth fade-in animation to Tailwind via <style>
if (!checkout.includes('animate-fade-in')) {
  const styleBlock = `  <style>
    .payment-option { transition: border-color 0.2s var(--ease), background 0.2s var(--ease); }
    .payment-option:has(input:checked) { border-color: #18181b; background: #fafafa; }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
    .hidden { display: none !important; }
  </style>`;
  checkout = checkout.replace(/<style>[\s\S]*?<\/style>/, styleBlock);
}

// Ensure bca-info and qris-info have the animation class when they are shown
const oldRadioEvent = `        updateRadioUI();
        const isBCA = radio.value === 'BCA Transfer';
        document.getElementById('bca-info').classList.toggle('hidden', !isBCA);
        document.getElementById('qris-info').classList.toggle('hidden', isBCA);`;

const newRadioEvent = `        updateRadioUI();
        const isBCA = radio.value === 'BCA Transfer';
        
        const bcaEl = document.getElementById('bca-info');
        const qrisEl = document.getElementById('qris-info');
        
        if (isBCA) {
          qrisEl.classList.add('hidden');
          qrisEl.classList.remove('animate-fade-in');
          bcaEl.classList.remove('hidden');
          // small delay to re-trigger animation
          setTimeout(() => bcaEl.classList.add('animate-fade-in'), 10);
        } else {
          bcaEl.classList.add('hidden');
          bcaEl.classList.remove('animate-fade-in');
          qrisEl.classList.remove('hidden');
          setTimeout(() => qrisEl.classList.add('animate-fade-in'), 10);
        }`;

if (checkout.includes(oldRadioEvent)) {
  checkout = checkout.replace(oldRadioEvent, newRadioEvent);
}

// Remove the onerror handler that replaces the image with text
const oldImg = `class="w-40 h-40 object-contain" onerror="this.parentElement.innerHTML='<div class=\\'text-center text-zinc-300 text-sm\\'>QRIS code akan ditampilkan setelah checkout</div>'">`;
const newImg = `class="w-40 h-40 object-contain">`;
checkout = checkout.replace(oldImg, newImg);

fs.writeFileSync('public/checkout.html', checkout);


// ============================================
// 2. Patch admin.html for Kirim Resi Button
// ============================================
let admin = fs.readFileSync('public/admin.html', 'utf8');

// A. Remove the old WA logic from updateOrderStatus
const oldUpdateOrderStatus = `    async function updateOrderStatus(orderId, status) {
      try {
        const order = orders.find(o => o.id === orderId);

        let tracking_number = '';
        
        if (status === 'shipped') {
          tracking_number = await new Promise((resolve) => {
             const modal = document.getElementById('wa-modal');
             const content = document.getElementById('wa-modal-content');
             const input = document.getElementById('wa-tracking-input');
             input.value = '';
             modal.classList.remove('hidden');
             setTimeout(() => {
                content.classList.remove('scale-95', 'opacity-0');
                content.classList.add('scale-100', 'opacity-100');
                input.focus();
             }, 10);
             
             document.getElementById('wa-cancel-btn').onclick = () => {
                content.classList.remove('scale-100', 'opacity-100');
                content.classList.add('scale-95', 'opacity-0');
                setTimeout(() => modal.classList.add('hidden'), 300);
                resolve(null);
             };
             document.getElementById('wa-submit-btn').onclick = () => {
                content.classList.remove('scale-100', 'opacity-100');
                content.classList.add('scale-95', 'opacity-0');
                setTimeout(() => modal.classList.add('hidden'), 300);
                resolve(input.value.trim());
             };
          });
          
          if (tracking_number === null) {
            loadDashboard(); // Reset UI state
            return; 
          }
        }

        const res = await fetch(\`\${API_BASE}/api/admin/orders/\${orderId}/status\`, {
          method: 'PUT', headers: { ...headers(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, tracking_number })
        });
        const data = await res.json();
        if (data.message) showToast(data.message, 'success');
        
        loadDashboard();

        if (status === 'shipped' && order && order.customer_phone) {
           let phone = order.customer_phone.trim();
           phone = phone.replace(/\\D/g, '');
           if (phone.startsWith('0')) {
              phone = '62' + phone.substring(1);
           }

           let msg = \`Halo \${order.customer_name}, pesanan Anda di Campt's Collection (Order ID: \${order.order_id}) telah berhasil dikirim! 🚀\`;
           if (tracking_number) {
              msg += \`\\n\\nNomor Resi Anda: *\${tracking_number}*.\`;
           }
           msg += \`\\n\\nTerima kasih telah berbelanja kartu langka bersama kami!\`;

           const waUrl = \`https://wa.me/\${phone}?text=\${encodeURIComponent(msg)}\`;
           
           // Show custom UI toast with Action button instead of blocking confirm
           const toastHTML = \`
             <div class="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-2xl rounded-xl p-4 z-[150] flex items-center gap-4 animate-bounce">
                <div>
                   <p class="text-sm font-bold text-zinc-900 dark:text-white">Status Shipped Saved!</p>
                   <p class="text-xs text-zinc-500">Send WhatsApp update?</p>
                </div>
                <a href="\${waUrl}" target="_blank" onclick="this.parentElement.remove()" class="bg-[#25D366] hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md transition-colors whitespace-nowrap">
                   Open WhatsApp
                </a>
                <button onclick="this.parentElement.remove()" class="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
             </div>
           \`;
           document.body.insertAdjacentHTML('beforeend', toastHTML);
        }
      } catch (err) {
        showToast('Error: ' + err.message, 'error');
      }
    }`;

const cleanUpdateOrderStatus = `    async function updateOrderStatus(orderId, status) {
      try {
        const res = await fetch(\`\${API_BASE}/api/admin/orders/\${orderId}/status\`, {
          method: 'PUT', headers: { ...headers(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        });
        const data = await res.json();
        if (data.message) showToast(data.message, 'success');
        loadDashboard();
      } catch (err) {
        showToast('Error: ' + err.message, 'error');
      }
    }`;

if (admin.includes('tracking_number = await new Promise')) {
  admin = admin.replace(oldUpdateOrderStatus, cleanUpdateOrderStatus);
}

// B. Add new function triggerWA(orderId)
const newFunc = `    async function triggerWA(orderId) {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      const tracking_number = await new Promise((resolve) => {
         const modal = document.getElementById('wa-modal');
         const content = document.getElementById('wa-modal-content');
         const input = document.getElementById('wa-tracking-input');
         input.value = '';
         modal.classList.remove('hidden');
         setTimeout(() => {
            content.classList.remove('scale-95', 'opacity-0');
            content.classList.add('scale-100', 'opacity-100');
            input.focus();
         }, 10);
         
         document.getElementById('wa-cancel-btn').onclick = () => {
            content.classList.remove('scale-100', 'opacity-100');
            content.classList.add('scale-95', 'opacity-0');
            setTimeout(() => modal.classList.add('hidden'), 300);
            resolve(null);
         };
         document.getElementById('wa-submit-btn').onclick = () => {
            content.classList.remove('scale-100', 'opacity-100');
            content.classList.add('scale-95', 'opacity-0');
            setTimeout(() => modal.classList.add('hidden'), 300);
            resolve(input.value.trim());
         };
      });

      if (tracking_number === null) return; // cancelled

      if (tracking_number) {
        // Optionally save to DB notes
        try {
          await fetch(\`\${API_BASE}/api/admin/orders/\${orderId}/status\`, {
            method: 'PUT', headers: { ...headers(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: order.status, tracking_number })
          });
        } catch(e) {}
      }

      let phone = order.customer_phone.trim();
      phone = phone.replace(/\\D/g, '');
      if (phone.startsWith('0')) {
          phone = '62' + phone.substring(1);
      }

      let msg = \`Halo \${order.customer_name}, pesanan Anda di Campt's Collection (Order ID: \${order.order_id}) telah berhasil dikirim! 🚀\`;
      if (tracking_number) {
          msg += \`\\n\\nNomor Resi Anda: *\${tracking_number}*.\`;
      }
      msg += \`\\n\\nTerima kasih telah berbelanja kartu langka bersama kami!\`;

      const waUrl = \`https://wa.me/\${phone}?text=\${encodeURIComponent(msg)}\`;
      window.open(waUrl, '_blank');
    }`;

if (!admin.includes('function triggerWA(orderId)')) {
  admin = admin.replace('function viewOrderDetails(orderId) {', newFunc + '\\n\\n    function viewOrderDetails(orderId) {');
}

// C. Add the button to the Actions column in both tables
// In renderRecentOrders
const oldActionsRecent = `<button onclick="viewOrderDetails(\${o.id})" class="text-cyan-600 hover:text-cyan-800 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors">Details</button>`;
const newActionsRecent = `<button onclick="triggerWA(\${o.id})" class="text-[#25D366] hover:text-green-600 font-bold transition-colors">Send WA</button>
            <button onclick="viewOrderDetails(\${o.id})" class="text-cyan-600 hover:text-cyan-800 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors ml-2">Details</button>`;
admin = admin.replace(oldActionsRecent, newActionsRecent);

// In renderOrders (All Orders table)
const oldActionsAll = `<button onclick="viewOrderDetails(\${o.id})" class="text-cyan-600 hover:text-cyan-800 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors">Details</button>`;
const newActionsAll = `<button onclick="triggerWA(\${o.id})" class="text-[#25D366] hover:text-green-600 font-bold transition-colors">Send WA</button>
              <button onclick="viewOrderDetails(\${o.id})" class="text-cyan-600 hover:text-cyan-800 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors ml-2">Details</button>`;
admin = admin.replace(oldActionsAll, newActionsAll);

fs.writeFileSync('public/admin.html', admin);
console.log('Patched admin.html for Send WA button and checkout.html for QRIS fade');
