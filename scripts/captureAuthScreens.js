import { chromium } from 'playwright';

async function captureAuth() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  await page.goto('http://localhost:5173/');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('autoarca_theme', 'light');
  });
  await page.reload();
  await page.waitForTimeout(600);

  // Auth Light por recarga con localStorage autoarca_theme=light
  await page.screenshot({ path: 'playwright-screenshots/auth-light-real.png' });

  // Toggle a Dark con click real
  const toggleBtn = await page.$('.theme-toggle-btn');
  if (toggleBtn) {
    await toggleBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'playwright-screenshots/auth-dark-real.png' });
  }

  await browser.close();
}

captureAuth().catch(console.error);
