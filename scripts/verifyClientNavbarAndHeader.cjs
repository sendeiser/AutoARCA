const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = path.resolve('C:/Users/TinChoX/.gemini/antigravity-ide/brain/f14f2191-e0d5-4ded-b8f8-570b8ba53c39/.tempmediaStorage');

async function run() {
  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });

  const clientUser = {
    id: 'client-1',
    full_name: 'Martín González',
    email: 'martin@comercio.com',
    password: '1234',
    phone: '+54 3826 401234',
    role: 'client',
    subscription_status: 'active',
    cuit: '20301234567',
    business_id: 'biz-1',
    accountant_id: 'accountant-1'
  };

  // --- 1. TEST DESKTOP (1280x800) ---
  console.log('Testing Desktop view (1280x800)...');
  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1
  });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await desktopPage.evaluate((user) => {
    localStorage.setItem('autoarca_session_v2', JSON.stringify(user));
    localStorage.setItem('autoarca_active_role', 'client');
  }, clientUser);
  await desktopPage.reload({ waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(800);

  // Click Dashboard Fiscal tab in top navbar
  const dashNavBtn = await desktopPage.$('[data-testid="nav-tab-dashboard"]');
  if (dashNavBtn) await dashNavBtn.click();
  await desktopPage.waitForTimeout(600);

  const subnavDesktopExists = await desktopPage.$('.client-subnav-bar');
  console.log('Desktop - Subnav .client-subnav-bar exists (should be null):', subnavDesktopExists);

  const titleInDash = await desktopPage.$('h1.dashboard-business-title');
  const headerVisibleInDash = titleInDash ? await titleInDash.isVisible() : false;
  console.log('Desktop - Business header visible in Dashboard (should be true):', headerVisibleInDash);

  const shot1 = path.join(ARTIFACT_DIR, 'media_client_desktop_dashboard.png');
  await desktopPage.screenshot({ path: shot1, fullPage: false });

  // Click Cruce Bancario tab
  const bankNavBtn = await desktopPage.$('[data-testid="nav-tab-bancos"]');
  if (bankNavBtn) await bankNavBtn.click();
  await desktopPage.waitForTimeout(600);

  const titleInBank = await desktopPage.$('h1.dashboard-business-title');
  const headerVisibleInBank = titleInBank ? await titleInBank.isVisible() : false;
  console.log('Desktop - Business header visible in Cruce Bancario (should be false):', headerVisibleInBank);

  const shot2 = path.join(ARTIFACT_DIR, 'media_client_desktop_bancos.png');
  await desktopPage.screenshot({ path: shot2, fullPage: false });

  // Click Buzón DFE tab
  const dfeNavBtn = await desktopPage.$('[data-testid="nav-tab-dfe"]');
  if (dfeNavBtn) await dfeNavBtn.click();
  await desktopPage.waitForTimeout(600);

  const titleInDfe = await desktopPage.$('h1.dashboard-business-title');
  const headerVisibleInDfe = titleInDfe ? await titleInDfe.isVisible() : false;
  console.log('Desktop - Business header visible in Buzon DFE (should be false):', headerVisibleInDfe);

  const shot3 = path.join(ARTIFACT_DIR, 'media_client_desktop_dfe.png');
  await desktopPage.screenshot({ path: shot3, fullPage: false });

  // --- 2. TEST MOBILE (390x844) ---
  console.log('Testing Mobile view (390x844)...');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await mobilePage.evaluate((user) => {
    localStorage.setItem('autoarca_session_v2', JSON.stringify(user));
    localStorage.setItem('autoarca_active_role', 'client');
  }, clientUser);
  await mobilePage.reload({ waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(800);

  // Check mobile navbars
  const mobileBottomVisible = await mobilePage.isVisible('.navbar-mobile-bottom');
  const mobileTopVisible = await mobilePage.isVisible('.navbar-desktop-segment');
  console.log('Mobile - Bottom navbar visible (should be true):', mobileBottomVisible);
  console.log('Mobile - Top navbar visible (should be false):', mobileTopVisible);

  // Switch to Fiscal via mobile bottom bar
  const mobileFiscalBtn = await mobilePage.$('[data-testid="nav-tab-mobile-dashboard"]');
  if (mobileFiscalBtn) await mobileFiscalBtn.click();
  await mobilePage.waitForTimeout(600);

  const mobileTitleInDash = await mobilePage.$('h1.dashboard-business-title');
  const mobileHeaderVisibleInDash = mobileTitleInDash ? await mobileTitleInDash.isVisible() : false;
  console.log('Mobile - Header visible in Fiscal Dashboard (should be true):', mobileHeaderVisibleInDash);

  const shot4 = path.join(ARTIFACT_DIR, 'media_client_mobile_dashboard.png');
  await mobilePage.screenshot({ path: shot4, fullPage: false });

  // Switch to Bancos via mobile bottom bar
  const mobileBankBtn = await mobilePage.$('[data-testid="nav-tab-mobile-bancos"]');
  if (mobileBankBtn) await mobileBankBtn.click();
  await mobilePage.waitForTimeout(600);

  const mobileTitleInBank = await mobilePage.$('h1.dashboard-business-title');
  const mobileHeaderVisibleInBank = mobileTitleInBank ? await mobileTitleInBank.isVisible() : false;
  console.log('Mobile - Header visible in Bancos (should be false):', mobileHeaderVisibleInBank);

  const shot5 = path.join(ARTIFACT_DIR, 'media_client_mobile_bancos.png');
  await mobilePage.screenshot({ path: shot5, fullPage: false });

  await browser.close();
  console.log('All checks finished successfully!');
}

run().catch(console.error);
