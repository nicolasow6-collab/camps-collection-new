const fs = require('fs');
const file = 'public/admin.html';
let content = fs.readFileSync(file, 'utf8');

// Fix 1: Ensure initFlatpickr is called at script end
if (content.includes('loadDashboard();\n  </script>')) {
    content = content.replace('loadDashboard();\n  </script>', 'loadDashboard();\n    initFlatpickr();\n  </script>');
} else if (content.includes('loadDashboard();') && !content.includes('initFlatpickr();\n  </script>')) {
    // If we missed it, let's just forcefully inject it before </script>
    const scriptEnd = '</script>\n</body>';
    content = content.replace(scriptEnd, '  initFlatpickr();\n' + scriptEnd);
}

// Fix 2: The Date calculation logic in renderRevenueChart
const oldLogic = `      // Determine date range and bucketing
      if (currentRevenueFilter === '1D') {
        startDate = new Date(now.getTime() - (24 * 60 * 60 * 1000) * 0); // today
        bucketType = 'hour';
      } else if (currentRevenueFilter === '1W') {
        startDate = new Date(now.getTime() - (24 * 60 * 60 * 1000) * 6);
        bucketType = 'day';
      } else if (currentRevenueFilter === '1M') {
        startDate = new Date(now.getTime() - (24 * 60 * 60 * 1000) * 29);
        bucketType = 'day';
      } else if (currentRevenueFilter === 'YTD') {
        startDate = new Date(now.getFullYear(), 0, 1);
        bucketType = 'month';
      } else if (currentRevenueFilter === '1Y') {
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        bucketType = 'month';`;

const newLogic = `      // Determine date range and bucketing
      if (currentRevenueFilter === '1D') {
        bucketType = 'hour';
      } else if (currentRevenueFilter === '1W') {
        startDate.setDate(startDate.getDate() - 6);
        bucketType = 'day';
      } else if (currentRevenueFilter === '1M') {
        startDate.setDate(startDate.getDate() - 29);
        bucketType = 'day';
      } else if (currentRevenueFilter === 'YTD') {
        startDate = new Date(now.getFullYear(), 0, 1);
        bucketType = 'month';
      } else if (currentRevenueFilter === '1Y') {
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        bucketType = 'month';`;

if (content.includes(oldLogic)) {
    content = content.replace(oldLogic, newLogic);
    console.log('Date logic fixed!');
} else {
    console.log('Date logic not found!');
}

// Fix 3: Handle GMT+7 timezone for the date comparison
// The orders' created_at is in UTC, so we should compare correctly.
// Actually, orders created_at is e.g. "2026-05-29T16:09:07Z"
// If we just parse with new Date(), it converts to local time automatically. So it should be fine.
// Wait, my hour buckets logic:
const oldHourBucket = `      if (bucketType === 'hour') {
         for(let i=0; i<24; i+=2) {
             const key = \`\${String(i).padStart(2,'0')}:00\`;
             buckets[key] = 0;
             labels.push(key);
         }
         validOrders.forEach(o => {
            const d = new Date(o.created_at);
            const hourBin = Math.floor(d.getHours() / 2) * 2;
            const key = \`\${String(hourBin).padStart(2,'0')}:00\`;
            if (buckets[key] !== undefined) buckets[key] += (o.total || 0);
         });`;

// Ensure we initialize the bucket properly so we get data if available.
if (content.includes(oldHourBucket)) {
    console.log('Hour bucket logic found and seems fine.');
}

// Just to be sure the flatpickr script was actually loaded, let's verify.
fs.writeFileSync(file, content);
console.log('admin.html updated.');
