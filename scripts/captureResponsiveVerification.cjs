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

  console.log('Navigating to http://localhost:5173/ ...');
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

  // 1. Cartera & Lotes (first tab)
  console.log('1. Checking Cartera & Lotes...');
  const headerVisible1 = await page.isVisible('.accountant-header');
  console.log('Header visible on clientes tab:', headerVisible1);
  const p1 = path.join(ARTIFACT_DIR, 'media_accountant_clientes_mobile.png');
  await page.screenshot({ path: p1, fullPage: false });

  // 2. Recategorización tab
  console.log('2. Clicking Recategorización tab...');
  const recatTab = await page.$('[data-testid="nav-tab-recategorizacion"]');
  if (recatTab) {
    await recatTab.click();
    console.log('Clicked recat tab');
  } else {
    console.log('recat tab NOT found');
  }
  await page.waitForTimeout(600);
  const headerVisible2 = await page.isVisible('.accountant-header');
  console.log('Header visible on recategorizacion tab:', headerVisible2);
  const p2 = path.join(ARTIFACT_DIR, 'media_accountant_recat_mobile.png');
  await page.screenshot({ path: p2, fullPage: false });

  // 3. Calendario CUIT tab
  console.log('3. Clicking Calendario CUIT tab...');
  const calTab = await page.$('[data-testid="nav-tab-calendario"]');
  if (calTab) {
    await calTab.click();
    console.log('Clicked calendario tab');
  } else {
    console.log('calendario tab NOT found');
  }
  await page.waitForTimeout(600);
  const headerVisible3 = await page.isVisible('.accountant-header');
  console.log('Header visible on calendario tab:', headerVisible3);
  const p3 = path.join(ARTIFACT_DIR, 'media_accountant_calendar_mobile.png');
  await page.screenshot({ path: p3, fullPage: false });

  // 4. Honorarios tab
  console.log('4. Clicking Honorarios tab...');
  const feesTab = await page.$('[data-testid="nav-tab-honorarios"]');
  if (feesTab) {
    await feesTab.click();
    console.log('Clicked honorarios tab');
  } else {
    console.log('honorarios tab NOT found');
  }
  await page.waitForTimeout(600);
  const headerVisible4 = await page.isVisible('.accountant-header');
  console.log('Header visible on honorarios tab:', headerVisible4);
  const p4 = path.join(ARTIFACT_DIR, 'media_accountant_fees_mobile.png');
  await page.screenshot({ path: p4, fullPage: false });

  // 5. Desktop context for Redesigned Calendar
  console.log('5. Capturing desktop calendar...');
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
  await desktopPage.waitForTimeout(500);
  const calTabDesk = await desktopPage.$('[data-testid="nav-tab-calendario"]');
  if (calTabDesk) await calTabDesk.click();
  await desktopPage.waitForTimeout(500);
  const p5 = path.join(ARTIFACT_DIR, 'media_accountant_calendar_desktop.png');
  await desktopPage.screenshot({ path: p5, fullPage: false });

  await browser.close();
  console.log('All screenshots captured successfully!');
  console.log('Artifacts:');
  console.log(p1, p2, p3, p4, p5);
}

run().catch(console.error);
