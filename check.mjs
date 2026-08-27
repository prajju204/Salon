import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  page.on('response', response => {
    if (response.status() === 504) {
      console.log('504 RESPONSE:', response.url());
    }
  });
  await page.goto('http://localhost:5173/book-appointment', { waitUntil: 'networkidle0' });
  await browser.close();
})();
