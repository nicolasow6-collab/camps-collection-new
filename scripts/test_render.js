const orders = [
  {
    "id": 1,
    "order_id": "purchase#290526409",
    "customer_name": "Nicholas Wilman",
    "customer_email": "nicolasow6@gmail.com",
    "customer_phone": "081280458836",
    "customer_ig": "",
    "address": "asdasdasda",
    "city": "Jakarta",
    "province": "Jakarta",
    "postal_code": "11460",
    "items": [{"id":4,"name":"Glaceon V"}],
    "total": 18200000,
    "payment_method": "QRIS",
    "notes": "",
    "status": "pending",
    "created_at": "2026-05-28T21:44:29+00:00"
  }
];
function esc(str) { return String(str); }

try {
const html = orders.map(o => `
        <tr class="border-t border-zinc-100 table-row-hover">
          <td class="px-6 py-3.5 font-mono text-xs font-medium text-zinc-500">${esc(o.order_id)}</td>
          <td class="px-6 py-3.5 text-sm font-medium">${esc(o.customer_name)}</td>
          <td class="px-6 py-3.5 text-xs text-zinc-400"><div>${esc(o.customer_email)}</div><div class="mt-0.5">${esc(o.customer_phone)}</div></td>
          <td class="px-6 py-3.5 text-xs text-zinc-500">${o.items.map(i => esc(i.name)).join(', ')}</td>
          <td class="px-6 py-3.5 text-sm font-medium">Rp${(o.total || 0).toLocaleString()}</td>
          <td class="px-6 py-3.5"><span class="text-xs"><span class="status-dot ${esc(o.status)}"></span>${esc(o.status)}</span></td>
          <td class="px-6 py-3.5 text-xs text-zinc-400">${new Date(o.created_at).toLocaleDateString('id-ID')}</td>
        </tr>
      `).join('');
console.log("SUCCESS:", html.length);
} catch (e) {
console.log("ERROR:", e);
}
