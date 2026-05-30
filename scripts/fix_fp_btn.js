const fs = require('fs');
const file = 'public/admin.html';
let content = fs.readFileSync(file, 'utf8');

const fpLogic = `
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
`;

const oldFpLogic = `
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
`;

if (content.includes(oldFpLogic)) {
    content = content.replace(oldFpLogic, fpLogic);
}

const oldBtnHtml = `onclick="document.getElementById('custom-date-picker')._flatpickr.open()"`;
const newBtnHtml = `onclick="openCustomPicker()"`;
content = content.replace(oldBtnHtml, newBtnHtml);

fs.writeFileSync(file, content);
console.log('Flatpickr button fixed.');
