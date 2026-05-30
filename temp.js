  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: { sans: ['"Plus Jakarta Sans"', 'sans-serif'] },
          colors: {
            poke: { red: '#CC0000', darkred: '#9E0000', black: '#111111', gray: '#fafafa', line: '#e8e8e8' }
          }
        }
      }
    }
  </script>
  <script>
    if (localStorage.getItem('color-theme') === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
  </script>
  <script>
    const API_BASE = window.location.origin;

    // XSS protection: escape HTML entities
    function esc(str) {
      if (!str) return '';
      const div = document.createElement('div');
      div.textContent = String(str);
      return div.innerHTML;
    }

    // Toast notification — border, no shadow, no colored left bar
    function showToast(message, type = 'info') {
      const container = document.getElementById('toast-container');
      const toast = document.createElement('div');
      const icons = {
        success: `<svg class="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`,
        error: `<svg class="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`,
        info: `<svg class="w-4 h-4 text-zinc-400 dark:text-zinc-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`
      };
      toast.className = `toast-enter flex items-center gap-2.5 bg-white dark:bg-zinc-800 px-4 py-3 rounded-lg border border-zinc-200 dark:border-zinc-700 min-w-[280px] max-w-[380px]`;
      toast.innerHTML = `${icons[type]}<span class="text-sm text-zinc-700">${esc(message)}</span>`;
      container.appendChild(toast);
      setTimeout(() => { toast.classList.remove('toast-enter'); toast.classList.add('toast-exit'); setTimeout(() => toast.remove(), 300); }, 2500);
    }

    // Confirm dialog — custom modal, no native confirm()
    function showConfirm(message) {
      return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black/30 z-[200] flex items-center justify-center p-4';
        overlay.innerHTML = `<div class="bg-white dark:bg-zinc-800 rounded-xl max-w-sm w-full p-6 border border-zinc-200 dark:border-zinc-700 shadow-xl">
          <p class="text-sm text-zinc-700 mb-6">${esc(message)}</p>
          <div class="flex justify-end gap-2">
            <button id="confirm-cancel" class="px-4 py-2 text-sm font-medium text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:text-zinc-100 transition-colors rounded-lg hover:bg-zinc-50 dark:bg-zinc-900/50">Cancel</button>
            <button id="confirm-ok" class="px-4 py-2 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors">Confirm</button>
          </div>
        </div>`;
        document.body.appendChild(overlay);
        const cleanup = () => overlay.remove();
        overlay.querySelector('#confirm-cancel').addEventListener('click', () => { cleanup(); resolve(false); });
        overlay.querySelector('#confirm-ok').addEventListener('click', () => { cleanup(); resolve(true); });
        overlay.addEventListener('click', (e) => { if (e.target === overlay) { cleanup(); resolve(false); } });
      });
    }

    let token = localStorage.getItem('campt_token');
    let cards = [];
    let orders = [];
    let categories = [];
    let revenueChart = null;
    let statusChart = null;
    let supabaseClient = null;

    // Fetch config and initialize Supabase
    async function initSupabase() {
      try {
        const res = await fetch(`${API_BASE}/api/config`);
        const config = await res.json();
        if (config.supabaseUrl && config.supabaseAnonKey) {
          supabaseClient = supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
          
          // Subscribe to real-time orders
          supabaseClient
            .channel('admin-orders')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, payload => {
              showToast('New order received!', 'success');
              loadOrders();
              loadDashboard(); initFlatpickr();
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, payload => {
              loadOrders();
              loadDashboard();
            })
            .subscribe();

          // Subscribe to real-time cards
          supabaseClient
            .channel('admin-cards')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'cards' }, payload => {
              loadCards();
              loadDashboard();
            })
            .subscribe();
        }
      } catch (err) {
        console.error('Failed to initialize Supabase client:', err);
      }
    }
    initSupabase();

    // Auth check
    if (!token) { window.location.href = '/login.html'; }

    const headers = () => ({ 'Authorization': `Bearer ${token}` });

    // Logout
    async function logout() {
      if (window.supabaseClient) {
        await window.supabaseClient.auth.signOut();
      }
      localStorage.removeItem('campt_token');
      localStorage.removeItem('campt_user');
      window.location.href = '/login.html';
    }

    // Tab switching
    function switchTab(tab) {
      document.querySelectorAll('[id^="tab-"]').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('[id^="content-"]').forEach(c => c.classList.add('hidden'));
      document.getElementById(`tab-${tab}`).classList.add('active');
      document.getElementById(`content-${tab}`).classList.remove('hidden');
    }

    // ========== DASHBOARD STATS ==========
    async function loadDashboard() {
      try {
        const ordersRes = await fetch(`${API_BASE}/api/admin/orders`, { headers: headers() });
        const ordersData = await ordersRes.json();
        if (ordersData.error) {
          showToast(ordersData.error, 'error');
          if (ordersData.error.includes('token')) {
             setTimeout(logout, 1500);
          }
          return;
        }
        orders = ordersData;

        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        const todayOrders = orders.filter(o => o.created_at && o.created_at.startsWith(today));
        const monthOrders = orders.filter(o => o.created_at && o.created_at.startsWith(thisMonth));

        const revenueToday = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
        const revenueMonth = monthOrders.reduce((sum, o) => sum + (o.total || 0), 0);

        document.getElementById('stat-revenue-today').textContent = `Rp${revenueToday.toLocaleString()}`;
        document.getElementById('stat-revenue-month').textContent = `Rp${revenueMonth.toLocaleString()}`;
        document.getElementById('stat-orders-today').textContent = todayOrders.length;
        document.getElementById('stat-orders-total').textContent = orders.length;

        renderRecentOrders(orders.slice(0, 5));
        renderAllOrders();
        renderRevenueChart(orders);
        renderStatusChart(orders);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      }
    }

    function renderRecentOrders(ordersList) {
      const tbody = document.getElementById('recent-orders-table');
      if (ordersList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-10"><div class="text-zinc-300"><svg class="w-8 h-8 mx-auto mb-2 text-zinc-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg><p class="text-sm">No orders yet</p></div></td></tr>';
        return;
      }
      tbody.innerHTML = ordersList.map(o => `
        <tr class="border-t border-zinc-100 dark:border-zinc-700/50 table-row-hover">
          <td class="px-6 py-3.5 font-mono text-xs font-medium text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">${esc(o.order_id)}</td>
          <td class="px-6 py-3.5 text-sm">${esc(o.customer_name)}</td>
          <td class="px-6 py-3.5 text-xs text-zinc-400 dark:text-zinc-500">${esc(o.items).length} item(s)</td>
          <td class="px-6 py-3.5 text-sm font-medium">Rp${(o.total || 0).toLocaleString()}</td>
          <td class="px-6 py-3 text-xs">
            <div class="flex items-center gap-1.5">
              <span class="status-dot ${esc(o.status)}"></span>
              <div class="relative inline-block text-left group z-[10]">
                <button type="button" class="inline-flex justify-center items-center gap-1 w-full px-2 py-1 text-xs font-semibold text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 focus:outline-none capitalize transition-colors">
                  ${o.status.replace('_', ' ')} <svg class="w-3 h-3 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                <div class="origin-top-right absolute right-0 mt-1 w-36 rounded-md shadow-lg bg-white dark:bg-zinc-800 ring-1 ring-black ring-opacity-5 hidden group-focus-within:block group-hover:block overflow-hidden">
                  <div class="py-1" role="menu">
                    ${['pending', 'awaiting_payment', 'processing', 'shipped', 'completed', 'cancelled'].map(s => 
                      `<a href="#" onclick="event.preventDefault(); document.activeElement.blur(); updateOrderStatus(${o.id}, '${s}')" class="block px-4 py-2 text-xs capitalize hover:bg-zinc-100 dark:hover:bg-zinc-700 ${o.status === s ? 'font-bold text-cyan-600 dark:text-cyan-400' : 'text-zinc-700 dark:text-zinc-300'}" role="menuitem">${s.replace('_', ' ')}</a>`
                    ).join('')}
                  </div>
                </div>
              </div>
            </div>
          </td>
          <td class="px-6 py-3.5 text-xs text-zinc-400 dark:text-zinc-500">${new Date(o.created_at).toLocaleDateString('id-ID')}</td>
        </tr>
      `).join('');
    }

    
    let revenueChartInstance = null;
    let currentRevenueFilter = '1Y';
    let currentRevenueDateRange = [];

    let fpInstance = null;
    function initFlatpickr() {
      fpInstance = flatpickr("#custom-date-picker", {
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

    function openCustomPicker() {
      if (fpInstance) fpInstance.open();
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
          btnElem.innerHTML = `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> ${startStr} - ${endStr}`;
      } else {
          document.getElementById('custom-filter-btn').innerHTML = `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> Custom`;
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
             const key = `${String(i).padStart(2,'0')}:00`;
             buckets[key] = 0;
             labels.push(key);
         }
         validOrders.forEach(o => {
            const d = new Date(o.created_at);
            const hourBin = Math.floor(d.getHours() / 2) * 2;
            const key = `${String(hourBin).padStart(2,'0')}:00`;
            if (buckets[key] !== undefined) buckets[key] += (o.total || 0);
         });
      } else if (bucketType === 'day') {
         let temp = new Date(startDate);
         while (temp <= now) {
             const key = `${temp.getFullYear()}-${String(temp.getMonth()+1).padStart(2,'0')}-${String(temp.getDate()).padStart(2,'0')}`;
             const label = temp.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
             buckets[key] = { label, total: 0 };
             labels.push(label);
             temp.setDate(temp.getDate() + 1);
         }
         validOrders.forEach(o => {
            const d = new Date(o.created_at);
            const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
            if (buckets[key]) buckets[key].total += (o.total || 0);
         });
      } else if (bucketType === 'month') {
         let temp = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
         while (temp <= now) {
             const key = `${temp.getFullYear()}-${String(temp.getMonth()+1).padStart(2,'0')}`;
             const label = temp.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
             buckets[key] = { label, total: 0 };
             labels.push(label);
             temp.setMonth(temp.getMonth() + 1);
         }
         validOrders.forEach(o => {
            const d = new Date(o.created_at);
            const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
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
function renderStatusChart(ordersList) {
      const container = document.getElementById('status-chart-container');
      const statuses = ['pending', 'processing', 'completed', 'cancelled'];
      const counts = statuses.map(s => ordersList.filter(o => o.status === s).length);
      const mutedColors = ['#fbbf24', '#60a5fa', '#34d399', '#f87171'];

      // Show empty state if no orders at all
      if (counts.every(c => c === 0)) {
        container.innerHTML = `<div class="h-64 flex items-center justify-center text-zinc-300">
          <div class="text-center">
            <svg class="w-10 h-10 mx-auto mb-2 text-zinc-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"/></svg>
            <p class="text-sm font-medium">No order data yet</p>
            <p class="text-xs text-zinc-300 mt-1">Chart will appear after first orders</p>
          </div>
        </div>`;
        if (statusChart) { statusChart.destroy(); statusChart = null; }
        return;
      }

      // Restore canvas if it was replaced
      if (!document.getElementById('status-chart')) {
        container.innerHTML = '<canvas id="status-chart"></canvas>';
      }

      if (statusChart) statusChart.destroy();
      statusChart = new Chart(document.getElementById('status-chart'), {
        type: 'doughnut',
        data: {
          labels: statuses.map(s => s.charAt(0).toUpperCase() + s.slice(1)),
          datasets: [{ data: counts, backgroundColor: mutedColors, borderWidth: 0, spacing: 2 }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '65%',
          plugins: {
            legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyleWidth: 8, font: { size: 11 }, color: '#71717a' } },
            tooltip: { backgroundColor: '#18181b', titleFont: { size: 11 }, bodyFont: { size: 11 }, padding: 8, cornerRadius: 6 }
          }
        }
      });
    }

    // ========== ORDERS ==========
    async function loadOrders() {
      try {
        const res = await fetch(`${API_BASE}/api/admin/orders`, { headers: headers() });
        const data = await res.json();
        if (data.error) {
          showToast(data.error, 'error');
          return;
        }
        orders = data;
        renderAllOrders();
      } catch (err) {
        console.error('Failed to load orders:', err);
      }
    }

    function renderAllOrders() {
      const tbody = document.getElementById('all-orders-table');
      if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center py-10"><div class="text-zinc-300"><svg class="w-8 h-8 mx-auto mb-2 text-zinc-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg><p class="text-sm">No orders yet</p></div></td></tr>';
        return;
      }
      tbody.innerHTML = orders.map(o => `
        <tr class="border-t border-zinc-100 dark:border-zinc-700/50 table-row-hover">
          <td class="px-6 py-3.5 font-mono text-xs font-medium text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">${esc(o.order_id)}</td>
          <td class="px-6 py-3.5 text-sm font-medium">${esc(o.customer_name)}</td>
          <td class="px-6 py-3.5 text-xs text-zinc-400 dark:text-zinc-500"><div>${esc(o.customer_email)}</div><div class="mt-0.5">${esc(o.customer_phone)}</div></td>
          <td class="px-6 py-3.5 text-xs text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">${o.items.map(i => esc(i.name)).join(', ')}</td>
          <td class="px-6 py-3.5 text-sm font-medium">Rp${(o.total || 0).toLocaleString()}</td>
          <td class="px-6 py-3.5">
            <div class="flex items-center gap-1.5">
              <span class="status-dot ${esc(o.status)}"></span>
              <div class="relative inline-block text-left group z-[10]">
                <button type="button" class="inline-flex justify-center items-center gap-1 w-full px-2 py-1 text-xs font-semibold text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 focus:outline-none capitalize transition-colors">
                  ${o.status.replace('_', ' ')} <svg class="w-3 h-3 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                <div class="origin-top-right absolute right-0 mt-1 w-36 rounded-md shadow-lg bg-white dark:bg-zinc-800 ring-1 ring-black ring-opacity-5 hidden group-focus-within:block group-hover:block overflow-hidden">
                  <div class="py-1" role="menu">
                    ${['pending', 'awaiting_payment', 'processing', 'shipped', 'completed', 'cancelled'].map(s => 
                      `<a href="#" onclick="event.preventDefault(); document.activeElement.blur(); updateOrderStatus(${o.id}, '${s}')" class="block px-4 py-2 text-xs capitalize hover:bg-zinc-100 dark:hover:bg-zinc-700 ${o.status === s ? 'font-bold text-cyan-600 dark:text-cyan-400' : 'text-zinc-700 dark:text-zinc-300'}" role="menuitem">${s.replace('_', ' ')}</a>`
                    ).join('')}
                  </div>
                </div>
              </div>
            </div>
          </td>
          <td class="px-6 py-3.5 text-xs text-zinc-400 dark:text-zinc-500">${new Date(o.created_at).toLocaleDateString('id-ID')}</td>
          <td class="px-6 py-3.5">
            <div class="flex gap-2">
              ${o.status === 'pending' || o.status === 'awaiting_payment' ? `<button onclick="confirmPayment(${o.id})" class="text-xs text-emerald-600 hover:text-emerald-700 font-medium hidden">Confirm</button>` : ''}
              <button onclick="viewOrderDetails(${o.id})" class="text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">Details</button>
              <button onclick="deleteOrder(${o.id})" class="text-xs text-zinc-400 dark:text-zinc-500 hover:text-red-500">Delete</button>
            </div>
          </td>
        </tr>
      `).join('');
    }

    async function confirmPayment(orderId) {
      if (!(await showConfirm('Confirm payment for this order?'))) return;
      await updateOrderStatus(orderId, 'processing');
      loadOrders();
      loadDashboard();
    }

    async function deleteOrder(orderId) {
      if (!(await showConfirm('Delete this order?'))) return;
      try {
        await fetch(`${API_BASE}/api/admin/orders/${orderId}`, { method: 'DELETE', headers: headers() });
        showToast('Order deleted', 'success');
        loadOrders();
        loadDashboard();
      } catch (err) {
        showToast('Error: ' + err.message, 'error');
      }
    }

    async function clearAllOrders() {
      if (!(await showConfirm('DELETE ALL ORDERS? This cannot be undone!'))) return;
      if (!(await showConfirm('Are you really sure?'))) return;
      try {
        await fetch(`${API_BASE}/api/admin/orders`, { method: 'DELETE', headers: headers() });
        showToast('All orders cleared', 'success');
        loadOrders();
        loadDashboard();
      } catch (err) {
        showToast('Error: ' + err.message, 'error');
      }
    }

    async function updateOrderStatus(orderId, status) {
      try {
        const res = await fetch(`${API_BASE}/api/admin/orders/${orderId}/status`, {
          method: 'PUT', headers: { ...headers(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        });
        const data = await res.json();
        if (data.message) showToast(data.message, 'success');
        loadDashboard();
      } catch (err) {
        showToast('Error: ' + err.message, 'error');
      }
    }

        async function triggerWA(orderId) {
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
          await fetch(`${API_BASE}/api/admin/orders/${orderId}/status`, {
            method: 'PUT', headers: { ...headers(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: order.status, tracking_number })
          });
        } catch(e) {}
      }

      let phone = order.customer_phone.trim();
      phone = phone.replace(/\D/g, '');
      if (phone.startsWith('0')) {
          phone = '62' + phone.substring(1);
      }

      let msg = `Halo ${order.customer_name}, pesanan Anda di Campt's Collection (Order ID: ${order.order_id}) telah berhasil dikirim! 🚀`;
      if (tracking_number) {
          msg += `\n\nNomor Resi Anda: *${tracking_number}*.`;
      }
      msg += `\n\nTerima kasih telah berbelanja kartu langka bersama kami!`;

      const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
      window.open(waUrl, '_blank');
    }\n\n    function viewOrderDetails(orderId) {
      const o = orders.find(o => o.id === orderId);
      if (!o) return;
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4';
      modal.innerHTML = `
        <div class="bg-white dark:bg-zinc-800 rounded-xl max-w-md w-full p-6 border border-zinc-200 dark:border-zinc-700">
          <div class="flex justify-between items-center mb-4">
            <h3 class="font-semibold tracking-tight">Order Details</h3>
            <button onclick="this.closest('.fixed').remove()" class="text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:text-zinc-400 dark:text-zinc-500 text-xl">&times;</button>
          </div>
          <div class="space-y-2 text-sm">
            <p class="flex justify-between"><span class="text-zinc-400 dark:text-zinc-500">Order</span><span class="font-mono text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">${esc(o.order_id)}</span></p>
            <p class="flex justify-between"><span class="text-zinc-400 dark:text-zinc-500">Customer</span><span>${esc(o.customer_name)}</span></p>
            <p class="flex justify-between"><span class="text-zinc-400 dark:text-zinc-500">Email</span><span class="text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">${esc(o.customer_email)}</span></p>
            <p class="flex justify-between"><span class="text-zinc-400 dark:text-zinc-500">Phone</span><span class="text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">${esc(o.customer_phone)}</span></p>
            <p class="mt-3 text-zinc-400 dark:text-zinc-500 text-xs uppercase tracking-wider font-semibold">Address</p>
            <p class="text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">${esc(o.address)}, ${esc(o.city)}, ${esc(o.province)} ${esc(o.postal_code)}</p>
            <p class="mt-3 text-zinc-400 dark:text-zinc-500 text-xs uppercase tracking-wider font-semibold">Items</p>
            <p class="text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">${o.items.map(i => esc(i.name)).join(', ')}</p>
            <p class="flex justify-between mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-700/50"><span class="text-zinc-400 dark:text-zinc-500">Total</span><span class="font-semibold">Rp${(o.total || 0).toLocaleString()}</span></p>
            <p class="flex justify-between"><span class="text-zinc-400 dark:text-zinc-500">Payment</span><span class="text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">BCA Transfer</span></p>
            <p class="flex justify-between"><span class="text-zinc-400 dark:text-zinc-500">Status</span><span class="text-xs"><span class="status-dot ${esc(o.status)}"></span>${esc(o.status)}</span></p>
          </div>
          <button onclick="this.closest('.fixed').remove()" class="mt-5 w-full py-2.5 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition text-sm font-medium">Close</button>
        </div>
      `;
      document.body.appendChild(modal);
    }

    // ========== CARDS ==========
    async function loadCards() {
      try {
        const res = await fetch(`${API_BASE}/api/cards?all=true`, { headers: headers() });
        cards = await res.json();
        renderCards();
      } catch (err) { console.error('Failed to load cards:', err); }
    }

    function renderCards() {
      const tbody = document.getElementById('cards-table');
      const empty = document.getElementById('empty-state');
      if (cards.length === 0) { tbody.innerHTML = ''; empty.classList.remove('hidden'); return; }
      empty.classList.add('hidden');
      tbody.innerHTML = cards.map(c => `
        <tr class="border-t border-zinc-100 dark:border-zinc-700/50 table-row-hover">
          <td class="px-4 py-2.5">${c.image_url ? `<img src="${esc(c.image_url)}" class="w-10 h-10 object-cover rounded-lg">` : '<div class="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center text-zinc-300"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" stroke-width="1.5"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><path d="M21 15l-5-5L5 21" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>'}</td>
          <td class="px-4 py-2.5 text-sm font-medium">${esc(c.name)}</td>
          <td class="px-4 py-2.5 text-xs text-zinc-400 dark:text-zinc-500">${esc(c.category)}</td>
          <td class="px-4 py-2.5 text-sm font-medium">${esc(c.price)}</td>
          <td class="px-4 py-2.5 text-center text-sm text-zinc-400 dark:text-zinc-500">${c.quantity || 1}</td>
          <td class="px-4 py-2.5"><span class="text-xs"><span class="status-dot ${c.status === 'active' ? 'active' : c.status === 'sold' ? 'sold' : 'inactive'}"></span>${esc(c.status)}</span></td>
          <td class="px-4 py-2.5">
            <div class="flex gap-3">
              <button onclick="editCard(${c.id})" class="text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-700">Edit</button>
              <button onclick="deleteCard(${c.id})" class="text-xs text-zinc-400 dark:text-zinc-500 hover:text-red-500">Delete</button>
            </div>
          </td>
        </tr>
      `).join('');
    }

    function openModal(card = null) {
      document.getElementById('card-form').reset();
      document.getElementById('card-id').value = '';
      document.getElementById('card-image-preview').classList.add('hidden');
      document.getElementById('drop-placeholder').classList.remove('hidden');
      document.getElementById('modal-title').textContent = card ? 'Edit Card' : 'Add Card';
      document.getElementById('card-submit-btn').textContent = card ? 'Update Card' : 'Save Card';
      if (card) {
        document.getElementById('card-id').value = card.id;
        document.getElementById('card-name').value = card.name;
        document.getElementById('card-category').value = card.category;
        document.getElementById('card-price').value = card.price;
        document.getElementById('card-set').value = card.set_name || '';
        document.getElementById('card-status').value = card.status;
        document.getElementById('card-grading').value = card.grading || '';
        document.getElementById('card-quantity').value = card.quantity || 1;
        document.getElementById('card-description').value = card.description || '';
        if (card.image_url) {
          document.getElementById('card-image-preview').src = card.image_url;
          document.getElementById('card-image-preview').classList.remove('hidden');
          document.getElementById('drop-placeholder').classList.add('hidden');
        }
      }
      document.getElementById('modal').classList.remove('hidden');
    }

    function closeModal() { document.getElementById('modal').classList.add('hidden'); }
    function editCard(id) { const card = cards.find(c => c.id === id); if (card) openModal(card); }

    async function deleteCard(id) {
      if (!(await showConfirm('Delete this card?'))) return;
      try {
        await fetch(`${API_BASE}/api/admin/cards/${id}`, { method: 'DELETE', headers: headers() });
        loadCards(); loadDashboard();
      } catch (err) { showToast('Error: ' + err.message, 'error'); }
    }

    // Card form submit
    
    // Auto-format Rupiah on price input
    const priceInput = document.getElementById('card-price');
    priceInput.addEventListener('input', function(e) {
      let value = this.value.replace(/[^0-9]/g, '');
      if (value === '') {
        this.value = '';
      } else {
        let formatted = new Intl.NumberFormat('id-ID').format(value);
        this.value = 'Rp ' + formatted;
      }
    });

    document.getElementById('card-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('card-id').value;
      const formData = new FormData();
      formData.append('name', document.getElementById('card-name').value);
      formData.append('category', document.getElementById('card-category').value);
      formData.append('price', document.getElementById('card-price').value);
      formData.append('set_name', document.getElementById('card-set').value);
      formData.append('status', document.getElementById('card-status').value);
      formData.append('grading', document.getElementById('card-grading').value);
      formData.append('quantity', document.getElementById('card-quantity').value);
      formData.append('description', document.getElementById('card-description').value);
      const imageFile = document.getElementById('card-image').files[0];
      if (imageFile) formData.append('image', imageFile);
      try {
        const url = id ? `${API_BASE}/api/admin/cards/${id}` : `${API_BASE}/api/admin/cards`;
        const method = id ? 'PUT' : 'POST';
        const res = await fetch(url, { method, headers: headers(), body: formData });
        if (res.ok) { closeModal(); loadCards(); loadDashboard(); }
        else { const err = await res.json(); showToast(err.error || 'Failed to save card', 'error'); }
      } catch (err) { showToast('Error: ' + err.message, 'error'); }
    });

    // Drag & Drop
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('card-image');
    const preview = document.getElementById('card-image-preview');
    const placeholder = document.getElementById('drop-placeholder');
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('border-zinc-400', 'bg-zinc-100/50'); });
    dropZone.addEventListener('dragleave', () => { dropZone.classList.remove('border-zinc-400', 'bg-zinc-100/50'); });
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault(); dropZone.classList.remove('border-zinc-400', 'bg-zinc-100/50');
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) { fileInput.files = e.dataTransfer.files; showPreview(file); }
    });
    fileInput.addEventListener('change', (e) => { if (e.target.files[0]) showPreview(e.target.files[0]); });
    function showPreview(file) {
      const reader = new FileReader();
      reader.onload = (ev) => { preview.src = ev.target.result; preview.classList.remove('hidden'); placeholder.classList.add('hidden'); };
      reader.readAsDataURL(file);
    }

    // ========== CATEGORIES ==========
    async function loadCategories() {
      try {
        const res = await fetch(`${API_BASE}/api/categories?all=true`, { headers: headers() });
        categories = await res.json();
        renderCategories(); updateCategorySelect();
      } catch (err) { console.error('Failed to load categories:', err); }
    }

    function renderCategories() {
      const list = document.getElementById('categories-list');
      if (categories.length === 0) { list.innerHTML = '<p class="text-zinc-300 text-sm text-center py-4">No categories yet</p>'; return; }
      list.innerHTML = categories.map(cat => `
        <div class="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-zinc-50 dark:bg-zinc-900/50 transition">
          <span class="text-sm text-zinc-700">${esc(cat.name)}</span>
          <button onclick="deleteCategory(${cat.id})" class="text-zinc-300 hover:text-red-500 text-xs transition-colors">Delete</button>
        </div>
      `).join('');
    }

    function updateCategorySelect() {
      const select = document.getElementById('card-category');
      const currentVal = select.value;
      select.innerHTML = '<option value="">Select...</option>' + categories.map(c => `<option value="${esc(c.name)}">${esc(c.name)}</option>`).join('');
      if (currentVal) select.value = currentVal;
    }

    async function addCategory() {
      const input = document.getElementById('new-category');
      const name = input.value.trim();
      if (!name) return;
      try {
        const res = await fetch(`${API_BASE}/api/admin/categories`, {
          method: 'POST', headers: { ...headers(), 'Content-Type': 'application/json' }, body: JSON.stringify({ name })
        });
        if (res.ok) { input.value = ''; loadCategories(); }
        else { const err = await res.json(); showToast(err.error || 'Failed', 'error'); }
      } catch (err) { showToast('Error: ' + err.message, 'error'); }
    }

    async function deleteCategory(id) {
      if (!(await showConfirm('Delete this category?'))) return;
      try { await fetch(`${API_BASE}/api/admin/categories/${id}`, { method: 'DELETE', headers: headers() }); loadCategories(); }
      catch (err) { showToast('Error: ' + err.message, 'error'); }
    }

    // ========== INIT ==========
    const user = JSON.parse(localStorage.getItem('campt_user') || '{}');
    document.getElementById('admin-name').textContent = user.email || 'Admin';
    loadCategories();
    loadCards();
    loadDashboard();
    initFlatpickr();
  </script>
  <script>
    const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
    const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');

    if (document.documentElement.classList.contains('dark')) {
        themeToggleDarkIcon.classList.remove('hidden');
    } else {
        themeToggleLightIcon.classList.remove('hidden');
    }

    const themeToggleBtn = document.getElementById('theme-toggle');

    themeToggleBtn.addEventListener('click', function() {
        themeToggleDarkIcon.classList.toggle('hidden');
        themeToggleLightIcon.classList.toggle('hidden');

        if (document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('color-theme', 'light');
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('color-theme', 'dark');
        }
    });
  </script>
