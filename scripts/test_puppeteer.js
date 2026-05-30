const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Set up auth token in localStorage before navigating
  await page.goto('http://localhost:3000');
  await page.evaluate((token) => {
    localStorage.setItem('campt_token', token);
    localStorage.setItem('campt_user', JSON.stringify({username: 'admin'}));
  }, require('jsonwebtoken').sign({ id: 1, username: 'admin', role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '8h' }));

  await page.goto('http://localhost:3000/admin.html');
  // Wait for network requests to finish
  await new Promise(r => setTimeout(r, 2000));
  
  // Get HTML of the all-orders-table
  const tableHTML = await page.evaluate(() => {
    return document.getElementById('all-orders-table').innerHTML;
  });
  console.log("Table HTML:", tableHTML);
  
  await browser.close();
})();
