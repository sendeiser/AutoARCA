import { chromium } from 'playwright';

async function capture() {
  const browser = await chromium.launch({ headless: true });

  // 1. Mobile Auth Screen (Centered UI & Glassmorphic Card)
  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobilePage.goto('http://localhost:5173/');
  await mobilePage.evaluate(() => localStorage.clear());
  await mobilePage.reload();
  await mobilePage.waitForTimeout(600);
  await mobilePage.screenshot({ path: 'playwright-screenshots/mobile-auth-centered.png' });
  await mobilePage.close();

  // 2. Desktop POS and Client Dashboard (Tax Traffic Light Bar)
  const desktopPage = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await desktopPage.goto('http://localhost:5173/');
  await desktopPage.evaluate(() => localStorage.clear());
  await desktopPage.reload();
  await desktopPage.waitForTimeout(400);

  // Click login demo
  await desktopPage.click('button:has-text("Cliente")');
  await desktopPage.waitForTimeout(500);

  // Capture POS
  await desktopPage.screenshot({ path: 'playwright-screenshots/desktop-pos-header-badge.png' });

  // Navigate to Dashboard Fiscal
  await desktopPage.click('button:has-text("Dashboard Fiscal")');
  await desktopPage.waitForTimeout(500);
  await desktopPage.screenshot({ path: 'playwright-screenshots/desktop-tax-traffic-light.png' });

  await desktopPage.close();
  await browser.close();
  console.log('📸 Capturas visuales guardadas exitosamente.');
}

capture().catch(console.error);
