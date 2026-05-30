const fs = require('fs');

const file = 'public/checkout.html';
let content = fs.readFileSync(file, 'utf8');

const oldSuccessBlock = `
        if (res.ok) {
          document.getElementById('order-id-display').textContent = \`Order #\${data.order_id}\`;
          document.getElementById('success-modal').classList.remove('hidden');
          localStorage.removeItem('campt_cart');
        } else {`;

const newSuccessBlock = `
        if (res.ok) {
          const orderId = data.order_id;
          document.getElementById('order-id-display').textContent = 'Order ID: ' + orderId;
          
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
          localStorage.removeItem('campt_cart');
        } else {`;

if (content.includes(oldSuccessBlock)) {
    content = content.replace(oldSuccessBlock, newSuccessBlock);
    
    // Also, my previous update to pass unique_code failed because the code in checkout.html was:
    // body: JSON.stringify({
    //   customer: { name, email, phone, instagram: ig, address, city, province, postal_code: postal },
    //   items: cart,
    //   payment_method: payment,
    //   notes
    // })
    
    content = content.replace(
      'payment_method: payment,\n            notes',
      'payment_method: payment,\n            notes,\n            unique_code: window.uniqueCode'
    );
    
    fs.writeFileSync(file, content);
    console.log('checkout.html WA link fixed!');
} else {
    console.log('old block not found. Checking if already applied...');
}
