const fs = require('fs');

let content = fs.readFileSync('public/admin.html', 'utf8');

// 1. Inject the WA Modal HTML
const modalHtml = `
  <!-- Custom WA Modal -->
  <div id="wa-modal" class="hidden fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
    <div class="bg-white dark:bg-zinc-800 rounded-xl max-w-sm w-full p-6 border border-zinc-200 dark:border-zinc-700 shadow-2xl transform scale-95 opacity-0 transition-all duration-300" id="wa-modal-content">
      <h3 class="text-lg font-bold text-zinc-900 dark:text-white mb-2 font-outfit">Confirm Shipping</h3>
      <p class="text-sm text-zinc-500 dark:text-zinc-400 mb-4">Enter tracking number (optional).</p>
      <input type="text" id="wa-tracking-input" class="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg text-sm bg-zinc-50 dark:bg-zinc-900 dark:text-white mb-4 focus:ring-2 focus:ring-cyan-500 focus:outline-none" placeholder="e.g. JNT123456789">
      <div class="flex justify-end gap-2">
        <button id="wa-cancel-btn" class="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors">Cancel</button>
        <button id="wa-submit-btn" class="px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:opacity-90 rounded-lg transition-all shadow-md">Confirm & WA</button>
      </div>
    </div>
  </div>
`;

if (!content.includes('id="wa-modal"')) {
  // Insert right before </body>
  content = content.replace('</body>', modalHtml + '\\n</body>');
}

// 2. Replace the native <select> in renderRecentOrders
const oldSelectRecent = `<select onchange="updateOrderStatus(\${o.id}, this.value)" class="bg-transparent border-0 text-xs font-medium text-zinc-700 cursor-pointer focus:ring-0 p-0 hover:text-zinc-900 dark:text-zinc-100 transition-colors capitalize">
                <option value="pending" \${o.status === 'pending' ? 'selected' : ''}>Pending</option>
                <option value="awaiting_payment" \${o.status === 'awaiting_payment' ? 'selected' : ''}>Awaiting Payment</option>
                <option value="processing" \${o.status === 'processing' ? 'selected' : ''}>Processing</option>
                <option value="shipped" \${o.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                <option value="completed" \${o.status === 'completed' ? 'selected' : ''}>Completed</option>
                <option value="cancelled" \${o.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
              </select>`;

const newDropdown = `<div class="relative inline-block text-left group z-[10]">
                <button type="button" class="inline-flex justify-center items-center gap-1 w-full px-2 py-1 text-xs font-semibold text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 focus:outline-none capitalize transition-colors">
                  \${o.status.replace('_', ' ')} <svg class="w-3 h-3 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                <div class="origin-top-right absolute right-0 mt-1 w-36 rounded-md shadow-lg bg-white dark:bg-zinc-800 ring-1 ring-black ring-opacity-5 hidden group-focus-within:block group-hover:block overflow-hidden">
                  <div class="py-1" role="menu">
                    \${['pending', 'awaiting_payment', 'processing', 'shipped', 'completed', 'cancelled'].map(s => 
                      \`<a href="#" onclick="event.preventDefault(); document.activeElement.blur(); updateOrderStatus(\${o.id}, '\${s}')" class="block px-4 py-2 text-xs capitalize hover:bg-zinc-100 dark:hover:bg-zinc-700 \${o.status === s ? 'font-bold text-cyan-600 dark:text-cyan-400' : 'text-zinc-700 dark:text-zinc-300'}" role="menuitem">\${s.replace('_', ' ')}</a>\`
                    ).join('')}
                  </div>
                </div>
              </div>`;

content = content.replace(oldSelectRecent, newDropdown);

// 3. Replace the native <select> in renderOrders
const oldSelectAll = `<select onchange="updateOrderStatus(\${o.id}, this.value)" class="bg-transparent border-0 text-xs font-medium text-zinc-700 cursor-pointer focus:ring-0 p-0 hover:text-zinc-900 dark:text-zinc-100 transition-colors capitalize">
                <option value="pending" \${o.status === 'pending' ? 'selected' : ''}>Pending</option>
                <option value="awaiting_payment" \${o.status === 'awaiting_payment' ? 'selected' : ''}>Awaiting Payment</option>
                <option value="processing" \${o.status === 'processing' ? 'selected' : ''}>Processing</option>
                <option value="shipped" \${o.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                <option value="completed" \${o.status === 'completed' ? 'selected' : ''}>Completed</option>
                <option value="cancelled" \${o.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
              </select>`;

content = content.replace(oldSelectAll, newDropdown);

// 4. Update updateOrderStatus logic to use the custom modal
const oldUpdateOrderStatus = `    async function updateOrderStatus(orderId, status) {
      try {
        let tracking_number = '';
        const order = orders.find(o => o.id === orderId);

        if (status === 'shipped') {
          tracking_number = prompt('Masukkan Nomor Resi Ekspedisi (JNE/SiCepat/J&T)\\nKosongkan jika Anda tidak ingin menggunakan resi:', '');
          if (tracking_number === null) return; // User clicked cancel
        }

        const res = await fetch(\`\${API_BASE}/api/admin/orders/\${orderId}/status\`, {
          method: 'PUT', headers: { ...headers(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, tracking_number })
        });
        const data = await res.json();
        if (data.message) showToast(data.message, 'success');
        
        loadDashboard();

        // One-Click WhatsApp Notification Logic
        if (status === 'shipped' && order && order.customer_phone) {
           let phone = order.customer_phone.trim();
           // Clean phone number: remove non-numeric, replace leading 0 with 62
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
           
           // Ask if they want to open WhatsApp now
           if (confirm('Status berhasil diubah! Ingin kirim notifikasi Resi ke pelanggan via WhatsApp sekarang?')) {
              window.open(waUrl, '_blank');
           }
        }
      } catch (err) {
        showToast('Error: ' + err.message, 'error');
      }
    }`;

const newUpdateOrderStatus = `    async function updateOrderStatus(orderId, status) {
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

content = content.replace(oldUpdateOrderStatus, newUpdateOrderStatus);

fs.writeFileSync('public/admin.html', content);
console.log('Patched admin.html with custom dropdown and UI modal');
