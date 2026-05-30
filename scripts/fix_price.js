const fs = require('fs');

const file = 'public/admin.html';
let content = fs.readFileSync(file, 'utf8');

const rupiahScript = `
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
`;

if (!content.includes('Auto-format Rupiah')) {
    content = content.replace(/(document\.getElementById\('card-form'\)\.addEventListener\('submit', async \(e\) => \{)/, rupiahScript + '\n    $1');
    fs.writeFileSync(file, content);
    console.log('Added auto-format Rupiah to admin.html');
} else {
    console.log('Already added');
}
