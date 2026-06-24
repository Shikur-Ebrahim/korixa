const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  
  console.log("Navigating to /profile/funding...");
  await page.goto('http://localhost:3000/profile/funding', { waitUntil: 'networkidle' });
  
  console.log("Page title:", await page.title());
  
  // Wait a bit to let any React effects run
  await page.waitForTimeout(3000);
  
  await browser.close();
})();
