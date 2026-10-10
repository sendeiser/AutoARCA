import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENSHOTS_DIR = path.resolve('./mobile_validation_screens');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function runMobileAudit() {
  const browser = await chromium.launch({ headless: true });
  const viewports = [
    { name: 'iPhone14_390', width: 390, height: 844 },
    { name: 'Android_360', width: 360, height: 780 }
  ];

  let allPassed = true;

  for (const vp of viewports) {
    console.log(`\n======================================================`);
    console.log(`=== AUDIT VIEWPORT: ${vp.name} (${vp.width}x${vp.height}) ===`);
    console.log(`======================================================`);

    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: true,
      hasTouch: true
    });
    const page = await context.newPage();

    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    // ==========================================
    // 1. CLIENT AUDIT
    // ==========================================
    console.log(`\n[CLIENT] Logging in...`);
    await page.locator('button:has-text("Cliente")').first().click();
    await page.waitForTimeout(500);

    // Verify Mobile Bottom Navbar exists
    const clientNavVisible = await page.locator('.navbar-mobile-bottom').isVisible();
    const clientNavTabs = await page.locator('.navbar-bottom-tab').count();
    console.log(`[CLIENT] Bottom navbar visible: ${clientNavVisible}, total tabs: ${clientNavTabs}`);
    if (!clientNavVisible || clientNavTabs < 6) {
      console.error(`[FAIL] Client bottom navbar is missing tabs (expected >= 6, got ${clientNavTabs})`);
      allPassed = false;
    }

    const clientModules = [
      { key: 'dashboard', label: 'Fiscal', title: 'Panel del Comercio' },
      { key: 'bancos', label: 'Bancos', title: 'Cruce Bancario' },
      { key: 'compras', label: 'Compras', title: 'Control de Compras' },
      { key: 'dfe', label: 'DFE', title: 'E-Ventanilla DFE' },
      { key: 'recurrentes', label: 'Abonos', title: 'Abonos Recurrentes' },
      { key: 'pos', label: 'POS', title: 'Terminal POS' }
    ];

    for (const mod of clientModules) {
      console.log(`[CLIENT] Tapping mobile tab: ${mod.label} (${mod.key})...`);
      const tabBtn = page.locator(`[data-testid="nav-tab-mobile-${mod.key}"]`).first();
      await tabBtn.click();
      await page.waitForTimeout(500);

      // Verify no horizontal overflow
      const scrollMetrics = await page.evaluate(() => {
        return {
          scrollX: window.scrollX,
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          bodyScrollWidth: document.body.scrollWidth
        };
      });

      const shotPath = path.join(SCREENSHOTS_DIR, `${vp.name}_client_${mod.key}.png`);
      await page.screenshot({ path: shotPath });

      const hasOverflow = scrollMetrics.scrollWidth > scrollMetrics.clientWidth;
      console.log(`   -> scrollWidth: ${scrollMetrics.scrollWidth}, clientWidth: ${scrollMetrics.clientWidth}, scrollX: ${scrollMetrics.scrollX}`);
      if (hasOverflow) {
        console.warn(`   [WARN] Horizontal overflow detected on ${mod.key}: scrollWidth ${scrollMetrics.scrollWidth} > ${scrollMetrics.clientWidth}`);
      } else {
        console.log(`   [PASS] Perfect mobile width constraint on ${mod.key}`);
      }
    }

    // Check specific header action buttons on Fiscal tab
    await page.locator('[data-testid="nav-tab-mobile-dashboard"]').first().click();
    await page.waitForTimeout(400);
    const actionBtns = await page.locator('.dashboard-header-actions button').all();
    console.log(`[CLIENT] Fiscal Header action buttons count: ${actionBtns.length}`);
    for (let i = 0; i < actionBtns.length; i++) {
      const box = await actionBtns[i].boundingBox();
      const txt = await actionBtns[i].innerText();
      console.log(`   Button ${i + 1} "${txt.replace('\n', ' ')}": x=${box?.x.toFixed(0)}, w=${box?.width.toFixed(0)}`);
      if (box && (box.x + box.width > vp.width + 5)) {
        console.error(`   [FAIL] Button overflows viewport! Right edge: ${box.x + box.width} > ${vp.width}`);
        allPassed = false;
      }
    }

    // ==========================================
    // 2. ACCOUNTANT AUDIT
    // ==========================================
    console.log(`\n[ACCOUNTANT] Logging out and logging in as Contador...`);
    await page.locator('[data-testid="header-logout-btn"]').click();
    await page.waitForTimeout(400);
    await page.locator('button:has-text("Contador")').first().click();
    await page.waitForTimeout(600);

    // Verify Mobile Bottom Navbar for Accountant
    const accNavVisible = await page.locator('.navbar-mobile-bottom').isVisible();
    const accNavTabs = await page.locator('.navbar-bottom-tab').count();
    console.log(`[ACCOUNTANT] Bottom navbar visible: ${accNavVisible}, total tabs: ${accNavTabs}`);
    if (!accNavVisible || accNavTabs < 6) {
      console.error(`[FAIL] Accountant bottom navbar is missing tabs (expected >= 6, got ${accNavTabs})`);
      allPassed = false;
    }

    const accountantModules = [
      { key: 'clientes', label: 'Cartera', expectedEl: '.accountant-portal-container' },
      { key: 'recategorizacion', label: 'Recat', expectedEl: '.recat-matrix-card' },
      { key: 'dfe', label: 'DFE', expectedEl: '.accountant-dfe-card' },
      { key: 'riesgo_bancario', label: 'Riesgo', expectedEl: '.accountant-bank-card' },
      { key: 'calendario', label: 'Calendario', expectedEl: '.tax-calendar-card' },
      { key: 'honorarios', label: 'Honorarios', expectedEl: '.accountant-fees-card' }
    ];

    for (const mod of accountantModules) {
      console.log(`[ACCOUNTANT] Tapping mobile tab: ${mod.label} (${mod.key})...`);
      const tabBtn = page.locator(`[data-testid="nav-tab-mobile-${mod.key}"]`).first();
      await tabBtn.click();
      await page.waitForTimeout(500);

      const isContentVisible = await page.locator(mod.expectedEl).first().isVisible();

      const scrollMetrics = await page.evaluate(() => {
        return {
          scrollX: window.scrollX,
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth
        };
      });

      const shotPath = path.join(SCREENSHOTS_DIR, `${vp.name}_accountant_${mod.key}.png`);
      await page.screenshot({ path: shotPath });

      console.log(`   -> Target element "${mod.expectedEl}" visible: ${isContentVisible}`);
      console.log(`   -> scrollWidth: ${scrollMetrics.scrollWidth}, clientWidth: ${scrollMetrics.clientWidth}, scrollX: ${scrollMetrics.scrollX}`);

      if (!isContentVisible) {
        console.error(`   [FAIL] Module content "${mod.expectedEl}" not visible when clicking tab ${mod.key}`);
        allPassed = false;
      }
    }

    await context.close();
  }

  await browser.close();

  if (allPassed) {
    console.log('\n>>> ALL PLAYWRIGHT MOBILE AUDITS PASSED WITH FLYING COLORS! <<<');
  } else {
    console.error('\n>>> SOME MOBILE AUDIT CHECKS FAILED. PLEASE REVIEW LOGS. <<<');
  }
  return allPassed;
}

runMobileAudit()
  .then((passed) => {
    process.exit(passed ? 0 : 1);
  })
  .catch((err) => {
    console.error('Fatal audit error:', err);
    process.exit(1);
  });
