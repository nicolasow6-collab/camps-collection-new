const fs = require('fs');
const path = require('path');

function injectDarkStyles(file, darkStyles) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('.dark .card-slab') || content.includes('.dark .table-row-hover')) {
      console.log('Already injected in ' + file);
      return;
  }
  content = content.replace('</style>', `
    ${darkStyles}
  </style>`);
  fs.writeFileSync(file, content);
  console.log('Injected dark styles into ' + file);
}

const vaultDarkStyles = `
    /* Dark Mode overwrites for Vault Custom CSS */
    .dark .card-slab {
      background: #27272a;
      border-color: #3f3f46;
    }
    .dark .card-slab:hover {
      border-color: #52525b;
    }
    .dark .card-slab-image {
      background: #18181b;
    }
    .dark .card-slab-info {
      border-top-color: #3f3f46;
    }
    .dark .card-slab-info h3 {
      color: #f4f4f5 !important;
    }
    .dark .filter-btn {
      background: #27272a;
      border-color: #3f3f46;
      color: #a1a1aa;
    }
    .dark .filter-btn:hover { border-color: #71717a; color: #f4f4f5; }
    .dark .filter-active { background-color: #f4f4f5 !important; color: #18181b !important; border-color: #f4f4f5 !important; }
    
    .dark .grading-badge {
      background: rgba(39, 39, 42, 0.95);
      color: #e4e4e7;
    }
    .dark .sort-option.sort-active {
      color: #f4f4f5;
    }
`;

const ordersDarkStyles = `
    .dark .table-row-hover:hover { background-color: #27272a; }
`;

injectDarkStyles('public/vault.html', vaultDarkStyles);
injectDarkStyles('public/orders.html', ordersDarkStyles);
