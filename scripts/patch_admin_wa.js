const fs = require('fs');

let content = fs.readFileSync('public/admin.html', 'utf8');

const oldFunc = `    async function updateOrderStatus(orderId, status) {
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

const newFunc = `    async function updateOrderStatus(orderId, status) {
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

if (content.includes(oldFunc)) {
  content = content.replace(oldFunc, newFunc);
  fs.writeFileSync('public/admin.html', content);
  console.log('Patched admin.html');
} else {
  console.log('Could not find old updateOrderStatus function.');
}
