import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  const logs = [];
  page.on('console', msg => logs.push(`LOG: ${msg.text()}`));
  page.on('pageerror', error => logs.push(`ERROR: ${error.message}`));
  page.on('requestfailed', request =>
    logs.push(`FAILED: ${request.url()} - ${request.failure()?.errorText}`)
  );

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  logs.push(`ROOT HTML: ${await page.$eval('#root', el => el.innerHTML).catch(() => 'no root')}`);
  
  fs.writeFileSync('output.txt', logs.join('\n'));
  await browser.close();
})();

