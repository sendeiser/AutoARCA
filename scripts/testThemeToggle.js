import { chromium } from 'playwright';

async function testTheme() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/');

  const currentAttr = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  console.log('Attr antes de click:', currentAttr);

  const themeBtn = await page.$('.theme-toggle-btn');
  console.log('themeBtn existe:', !!themeBtn);
  if (themeBtn) {
    await themeBtn.click();
    await page.waitForTimeout(500);
    const nextAttr = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    console.log('Attr tras click:', nextAttr);
  }
  await browser.close();
}

testTheme().catch(console.error);
