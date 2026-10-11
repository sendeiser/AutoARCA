const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = path.resolve('C:/Users/TinChoX/.gemini/antigravity-ide/brain/f14f2191-e0d5-4ded-b8f8-570b8ba53c39/.tempmediaStorage');

async function run() {
  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  
  // Mobile context (iPhone 14: 390x844)
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2
  });
  const page = await mobileContext.newPage();

  console.log('Navigating to http://localhost:5173/ in mobile...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

  // Authenticate as accountant using autoarca_session_v2
  await page.evaluate(() => {
    const accountantUser = {
      id: 'accountant-1',
      full_name: 'Estudio Contable Méndez & Asoc.',
      email: 'mendez@estudiocontable.com',
      password: '1234',
      phone: '+54 11 4321 9876',
      role: 'accountant',
      subscription_status: 'active',
      cuit: '30712345678',
      matricula: 'T° 142 F° 89',
      jurisdiccion: 'CPCECABA',
      link_code: 'CONT-MENDEZ-9876'
    };
    localStorage.setItem('autoarca_session_v2', JSON.stringify(accountantUser));
    localStorage.setItem('autoarca_active_role', 'accountant');
  });

  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 1. Verify navbars in mobile
  const topNavMobileVisible = await page.isVisible('.navbar-desktop-segment');
  const bottomNavMobileVisible = await page.isVisible('.navbar-mobile-bottom');
  console.log('Mobile - Top navbar visible (should be false):', topNavMobileVisible);
  console.log('Mobile - Bottom navbar visible (should be true):', bottomNavMobileVisible);

  const p1 = path.join(ARTIFACT_DIR, 'media_mobile_bottom_bar_clientes.png');
  await page.screenshot({ path: p1, fullPage: false });

  // 2. Switch tab via bottom bar: Recategorización
  console.log('2. Clicking Recat via bottom bar...');
  const recatMobileBtn = await page.$('[data-testid="nav-tab-mobile-recategorizacion"]');
  if (recatMobileBtn) {
    await recatMobileBtn.click();
    console.log('Clicked recat on mobile bottom bar');
  } else {
    console.log('Recat button NOT found on mobile bottom bar');
  }
  await page.waitForTimeout(600);
  const p2 = path.join(ARTIFACT_DIR, 'media_mobile_bottom_bar_recat.png');
  await page.screenshot({ path: p2, fullPage: false });

  // 3. Switch tab via bottom bar: Calendario CUIT
  console.log('3. Clicking Calendario via bottom bar...');
  const calMobileBtn = await page.$('[data-testid="nav-tab-mobile-calendario"]');
  if (calMobileBtn) {
    await calMobileBtn.click();
    console.log('Clicked calendario on mobile bottom bar');
  } else {
    console.log('Calendario button NOT found on mobile bottom bar');
  }
  await page.waitForTimeout(600);
  const p3 = path.join(ARTIFACT_DIR, 'media_mobile_bottom_bar_cal.png');
  await page.screenshot({ path: p3, fullPage: false });

  // 4. Desktop context (1280x800)
  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1
  });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await desktopPage.evaluate(() => {
    const accountantUser = {
      id: 'accountant-1',
      full_name: 'Estudio Contable Méndez & Asoc.',
      email: 'mendez@estudiocontable.com',
      password: '1234',
      phone: '+54 11 4321 9876',
      role: 'accountant',
      subscription_status: 'active',
      cuit: '30712345678',
      matricula: 'T° 142 F° 89',
      jurisdiccion: 'CPCECABA',
      link_code: 'CONT-MENDEZ-9876'
    };
    localStorage.setItem('autoarca_session_v2', JSON.stringify(accountantUser));
    localStorage.setItem('autoarca_active_role', 'accountant');
  });
  await desktopPage.reload({ waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(600);

  const topNavDesktopVisible = await desktopPage.isVisible('.navbar-desktop-segment');
  const bottomNavDesktopVisible = await desktopPage.isVisible('.navbar-mobile-bottom');
  console.log('Desktop - Top navbar visible (should be true):', topNavDesktopVisible);
  console.log('Desktop - Bottom navbar visible (should be false):', bottomNavDesktopVisible);

  const p4 = path.join(ARTIFACT_DIR, 'media_desktop_top_bar.png');
  await desktopPage.screenshot({ path: p4, fullPage: false });

  await browser.close();
  console.log('Verification completed successfully!');
  console.log(p1, p2, p3, p4);
}

run().catch(console.error);
