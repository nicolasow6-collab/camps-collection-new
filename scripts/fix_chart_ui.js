const fs = require('fs');

const file = 'public/admin.html';
let content = fs.readFileSync(file, 'utf8');

const targetH3 = '<h3 class="font-semibold text-sm text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 mb-5 uppercase tracking-wider">Revenue — 12 Months</h3>';

const chartControlsHTML = `
            <div class="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h3 class="font-semibold text-sm text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Revenue Overview</h3>
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

if (content.includes(targetH3)) {
    content = content.replace(targetH3, chartControlsHTML);
    fs.writeFileSync(file, content);
    console.log('Fixed Revenue Chart UI injection.');
} else {
    console.log('Target H3 not found. Already fixed?');
}
