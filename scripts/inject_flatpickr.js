const fs = require('fs');
const file = 'public/admin.html';
let content = fs.readFileSync(file, 'utf8');

// 1. Inject Flatpickr CSS & JS in <head>
const flatpickrLinks = `
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
  <link rel="stylesheet" type="text/css" href="https://npmcdn.com/flatpickr/dist/themes/dark.css">
  <script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
`;
if (!content.includes('flatpickr.min.css')) {
    content = content.replace('</head>', flatpickrLinks + '\n</head>');
}

// 2. Custom CSS for flatpickr to match Midnight Vault theme (zinc-900)
const customFlatpickrStyles = `
  <style>
    /* Midnight Vault Flatpickr Theme Overrides */
    .flatpickr-calendar.dark {
      background: #18181b !important;
      border: 1px solid #3f3f46 !important;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5) !important;
      font-family: 'Plus Jakarta Sans', sans-serif !important;
    }
    .flatpickr-day.selected, .flatpickr-day.startRange, .flatpickr-day.endRange, .flatpickr-day.selected.inRange, .flatpickr-day.startRange.inRange, .flatpickr-day.endRange.inRange, .flatpickr-day.selected:focus, .flatpickr-day.startRange:focus, .flatpickr-day.endRange:focus, .flatpickr-day.selected:hover, .flatpickr-day.startRange:hover, .flatpickr-day.endRange:hover, .flatpickr-day.selected.prevMonthDay, .flatpickr-day.startRange.prevMonthDay, .flatpickr-day.endRange.prevMonthDay, .flatpickr-day.selected.nextMonthDay, .flatpickr-day.startRange.nextMonthDay, .flatpickr-day.endRange.nextMonthDay {
      background: #f4f4f5 !important;
      border-color: #f4f4f5 !important;
      color: #18181b !important;
      font-weight: 700;
    }
    .flatpickr-day.inRange {
      background: #27272a !important;
      border-color: #27272a !important;
      box-shadow: -5px 0 0 #27272a, 5px 0 0 #27272a !important;
    }
    .flatpickr-months .flatpickr-month {
      background: #18181b !important;
      color: #f4f4f5 !important;
    }
    .flatpickr-current-month .flatpickr-monthDropdown-months, .flatpickr-current-month input.cur-year {
      color: #f4f4f5 !important;
      font-weight: 600 !important;
    }
    .flatpickr-weekdays {
      background: #18181b !important;
    }
    span.flatpickr-weekday {
      color: #a1a1aa !important;
    }
  </style>
`;
if (!content.includes('Midnight Vault Flatpickr Theme Overrides')) {
    content = content.replace('</head>', customFlatpickrStyles + '\n</head>');
}

// 3. Inject UI Controls above the Revenue Chart canvas
const chartControlsHTML = `
            <div class="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h3 class="font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Revenue Overview</h3>
              <div class="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-lg border border-zinc-200 dark:border-zinc-700/50">
                <button onclick="setRevenueFilter('1D', this)" class="chart-filter-btn px-3 py-1 text-xs font-semibold rounded-md text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-all">1D</button>
                <button onclick="setRevenueFilter('1W', this)" class="chart-filter-btn px-3 py-1 text-xs font-semibold rounded-md text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-all">1W</button>
                <button onclick="setRevenueFilter('1M', this)" class="chart-filter-btn px-3 py-1 text-xs font-semibold rounded-md text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-all">1M</button>
                <button onclick="setRevenueFilter('YTD', this)" class="chart-filter-btn px-3 py-1 text-xs font-semibold rounded-md text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-all">YTD</button>
                <button onclick="setRevenueFilter('1Y', this)" class="chart-filter-btn active-filter px-3 py-1 text-xs font-semibold rounded-md bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm transition-all">1Y</button>
                <div class="relative">
                  <input type="text" id="custom-date-picker" class="hidden">
                  <button onclick="document.getElementById('custom-date-picker')._flatpickr.open()" id="custom-filter-btn" class="chart-filter-btn flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-all">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    Custom
                  </button>
                </div>
              </div>
            </div>
`;
// Replace the existing h3 for Revenue Overview
content = content.replace('<h3 class="font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-4">Revenue Overview</h3>', chartControlsHTML);

// 4. Update the logic for renderRevenueChart and add filter states
const chartJsLogic = `
    let revenueChartInstance = null;
    let currentRevenueFilter = '1Y';
    let currentRevenueDateRange = [];

    function initFlatpickr() {
      flatpickr("#custom-date-picker", {
        mode: "range",
        dateFormat: "Y-m-d",
        theme: document.documentElement.classList.contains('dark') ? "dark" : "light",
        onClose: function(selectedDates, dateStr, instance) {
          if (selectedDates.length === 2) {
            setRevenueFilter('CUSTOM', document.getElementById('custom-filter-btn'), selectedDates);
          }
        }
      });
    }

    function setRevenueFilter(filterType, btnElem, dates = []) {
      // Update UI active state
      document.querySelectorAll('.chart-filter-btn').forEach(btn => {
        btn.classList.remove('bg-white', 'dark:bg-zinc-700', 'text-zinc-900', 'dark:text-white', 'shadow-sm', 'active-filter');
        btn.classList.add('text-zinc-500', 'dark:text-zinc-400');
      });
      btnElem.classList.remove('text-zinc-500', 'dark:text-zinc-400');
      btnElem.classList.add('bg-white', 'dark:bg-zinc-700', 'text-zinc-900', 'dark:text-white', 'shadow-sm', 'active-filter');
      
      if (filterType === 'CUSTOM') {
          const startStr = dates[0].toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
          const endStr = dates[1].toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
          btnElem.innerHTML = \`<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> \${startStr} - \${endStr}\`;
      } else {
          document.getElementById('custom-filter-btn').innerHTML = \`<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> Custom\`;
      }

      currentRevenueFilter = filterType;
      currentRevenueDateRange = dates;
      renderRevenueChart(orders);
    }

    function renderRevenueChart(ordersList) {
      if (!ordersList) ordersList = [];
      const container = document.getElementById('revenue-chart-container');
      const canvas = document.getElementById('revenue-chart');
      
      let labels = [];
      let revenues = [];
      const now = new Date();
      now.setHours(23, 59, 59, 999);
      
      let startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      let bucketType = 'day'; // day or month
      
      // Determine date range and bucketing
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
        bucketType = 'month';
      } else if (currentRevenueFilter === 'CUSTOM' && currentRevenueDateRange.length === 2) {
        startDate = new Date(currentRevenueDateRange[0]);
        startDate.setHours(0,0,0,0);
        now.setTime(currentRevenueDateRange[1].getTime());
        now.setHours(23,59,59,999);
        
        const diffDays = (now - startDate) / (1000 * 60 * 60 * 24);
        bucketType = diffDays > 90 ? 'month' : 'day';
      } else {
        // Fallback 1Y
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        bucketType = 'month';
      }

      // Filter orders by date range
      const validOrders = ordersList.filter(o => {
        if (!o.created_at) return false;
        const d = new Date(o.created_at);
        return d >= startDate && d <= now;
      });

      // Bucket data
      const buckets = {};
      if (bucketType === 'hour') {
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
         });
      } else if (bucketType === 'day') {
         let temp = new Date(startDate);
         while (temp <= now) {
             const key = \`\${temp.getFullYear()}-\${String(temp.getMonth()+1).padStart(2,'0')}-\${String(temp.getDate()).padStart(2,'0')}\`;
             const label = temp.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
             buckets[key] = { label, total: 0 };
             labels.push(label);
             temp.setDate(temp.getDate() + 1);
         }
         validOrders.forEach(o => {
            const d = new Date(o.created_at);
            const key = \`\${d.getFullYear()}-\${String(d.getMonth()+1).padStart(2,'0')}-\${String(d.getDate()).padStart(2,'0')}\`;
            if (buckets[key]) buckets[key].total += (o.total || 0);
         });
      } else if (bucketType === 'month') {
         let temp = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
         while (temp <= now) {
             const key = \`\${temp.getFullYear()}-\${String(temp.getMonth()+1).padStart(2,'0')}\`;
             const label = temp.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
             buckets[key] = { label, total: 0 };
             labels.push(label);
             temp.setMonth(temp.getMonth() + 1);
         }
         validOrders.forEach(o => {
            const d = new Date(o.created_at);
            const key = \`\${d.getFullYear()}-\${String(d.getMonth()+1).padStart(2,'0')}\`;
            if (buckets[key]) buckets[key].total += (o.total || 0);
         });
      }
      
      revenues = labels.map(l => {
         if (bucketType === 'hour') return buckets[l];
         const key = Object.keys(buckets).find(k => buckets[k].label === l);
         return buckets[key].total;
      });

      // Show empty state if no revenue at all in range
      if (revenues.every(r => r === 0)) {
        if(revenueChartInstance) revenueChartInstance.destroy();
        canvas.classList.add('hidden');
        if(!document.getElementById('empty-chart-state')) {
          container.insertAdjacentHTML('beforeend', '<div id="empty-chart-state" class="h-64 flex items-center justify-center text-zinc-400 dark:text-zinc-500 italic text-sm">No revenue data for selected period</div>');
        } else {
          document.getElementById('empty-chart-state').classList.remove('hidden');
        }
        return;
      } else {
        canvas.classList.remove('hidden');
        const emptyState = document.getElementById('empty-chart-state');
        if(emptyState) emptyState.classList.add('hidden');
      }

      const isDark = document.documentElement.classList.contains('dark');
      const gridColor = isDark ? '#3f3f46' : '#f2f2f2';
      const textColor = isDark ? '#a1a1aa' : '#a1a1aa';

      if (revenueChartInstance) {
        revenueChartInstance.data.labels = labels;
        revenueChartInstance.data.datasets[0].data = revenues;
        revenueChartInstance.options.scales.x.grid.color = gridColor;
        revenueChartInstance.options.scales.y.grid.color = gridColor;
        revenueChartInstance.options.scales.x.ticks.color = textColor;
        revenueChartInstance.options.scales.y.ticks.color = textColor;
        revenueChartInstance.update();
        return;
      }

      const ctx = canvas.getContext('2d');
      const gradient = ctx.createLinearGradient(0, 0, 0, 300);
      gradient.addColorStop(0, 'rgba(17,17,17, 0.4)');
      gradient.addColorStop(1, 'rgba(17,17,17, 0.0)');

      revenueChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Revenue',
            data: revenues,
            borderColor: '#111',
            backgroundColor: gradient,
            borderWidth: 2,
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#111',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: isDark ? '#27272a' : '#111',
              titleColor: '#fff',
              bodyColor: '#fff',
              padding: 10,
              cornerRadius: 8,
              displayColors: false,
              callbacks: {
                label: (ctx) => 'Rp ' + ctx.parsed.y.toLocaleString('id-ID')
              }
            }
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: textColor, font: { family: "'Plus Jakarta Sans', sans-serif", size: 10 } }, border: { display: false } },
            y: {
              grid: { color: gridColor, drawBorder: false },
              ticks: {
                color: textColor,
                font: { family: "'Plus Jakarta Sans', sans-serif", size: 10 },
                callback: (val) => {
                  if (val >= 1000000) return 'Rp' + (val / 1000000).toFixed(1) + 'M';
                  if (val >= 1000) return 'Rp' + (val / 1000).toFixed(0) + 'K';
                  return val;
                }
              },
              border: { display: false }
            }
          },
          interaction: { intersect: false, mode: 'index' }
        }
      });
    }

    // Wrap the original renderRevenueChart so we overwrite it entirely
`;

// Extract the original renderRevenueChart function and replace it with the new logic
const startIndex = content.indexOf('function renderRevenueChart(ordersList) {');
let endIndex = content.indexOf('function renderStatusChart(ordersList) {');
if (startIndex !== -1 && endIndex !== -1) {
    const originalChartLogic = content.substring(startIndex, endIndex);
    content = content.replace(originalChartLogic, chartJsLogic);
    
    // Also, I need to call initFlatpickr() when DOM is ready
    content = content.replace("loadDashboard();", "loadDashboard(); initFlatpickr();");
    
    fs.writeFileSync(file, content);
    console.log('Flatpickr and Revenue Chart UI injected.');
} else {
    console.log('Could not find renderRevenueChart function block.');
}
