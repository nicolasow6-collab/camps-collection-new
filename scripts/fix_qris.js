const fs = require('fs');

let content = fs.readFileSync('public/checkout.html', 'utf8');

// Replace class="hidden" with class="sr-only" on the payment radio buttons
// We will target exactly the payment inputs
content = content.replace(/<input type="radio" name="payment" value="BCA Transfer" checked class="hidden">/g, '<input type="radio" name="payment" value="BCA Transfer" checked class="sr-only">');
content = content.replace(/<input type="radio" name="payment" value="QRIS" class="hidden">/g, '<input type="radio" name="payment" value="QRIS" class="sr-only">');

fs.writeFileSync('public/checkout.html', content);
console.log('Patched checkout.html radios');
