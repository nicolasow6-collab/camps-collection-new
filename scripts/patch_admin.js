const fs = require('fs');
const file = 'public/admin.html';
let content = fs.readFileSync(file, 'utf8');

// Replace loadDashboard to handle errors
content = content.replace(
  /const ordersRes = await fetch\(`\$\{API_BASE\}\/api\/admin\/orders`, \{ headers: headers\(\) \}\);\s+orders = await ordersRes\.json\(\);/,
  `const ordersRes = await fetch(\`\${API_BASE}/api/admin/orders\`, { headers: headers() });
        const ordersData = await ordersRes.json();
        if (ordersData.error) {
          showToast(ordersData.error, 'error');
          if (ordersData.error.includes('token')) {
             setTimeout(logout, 1500);
          }
          return;
        }
        orders = ordersData;`
);

// Replace loadOrders to handle errors
content = content.replace(
  /const res = await fetch\(`\$\{API_BASE\}\/api\/admin\/orders`, \{ headers: headers\(\) \}\);\s+orders = await res\.json\(\);/,
  `const res = await fetch(\`\${API_BASE}/api/admin/orders\`, { headers: headers() });
        const data = await res.json();
        if (data.error) {
          showToast(data.error, 'error');
          return;
        }
        orders = data;`
);

fs.writeFileSync(file, content);
console.log('Patched admin.html');
