import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const OUT_DIR = path.resolve('./target7_mobile_audit');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function auditDevice(browser, deviceLabel, width, height) {
  const context = await browser.newContext({
    viewport: { width, height },
    isMobile: true,
    hasTouch: true
  });
  const page = await context.newPage();

  console.log(`\n==============================================`);
  console.log(`AUDITING 7 TARGET MODULES ON ${deviceLabel} (${width}x${height})`);
  console.log(`==============================================`);

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);

  async function auditTouchTargets(selector, moduleName) {
    return await page.evaluate(({ sel, mod }) => {
      const container = document.querySelector(sel);
      if (!container) return { found: false, count: 0, smallTargets: [] };
      const clickables = Array.from(container.querySelectorAll('button, a, input, select, .chip, [role="button"]'));
      const smallTargets = [];
      clickables.forEach(el => {
        const targetEl = (el.tagName === 'INPUT' && (el.type === 'checkbox' || el.type === 'radio') && el.closest('label'))
          ? el.closest('label')
          : el;
        const rect = targetEl.getBoundingClientRect();
        const text = targetEl.innerText?.trim() || el.getAttribute('aria-label') || el.getAttribute('title') || el.tagName;
        if (rect.width === 0 || rect.height === 0 || window.getComputedStyle(el).display === 'none') return;
        if (rect.height < 36 || rect.width < 36) {
          smallTargets.push({
            tag: el.tagName,
            text: text.slice(0, 30),
            w: Math.round(rect.width),
            h: Math.round(rect.height)
          });
        }
      });
      return { found: true, count: clickables.length, smallTargets };
    }, { sel: selector, mod: moduleName });
  }

  // ---------------- CLIENT ----------------
  await page.locator('button:has-text("Cliente")').first().click();
  await page.waitForTimeout(400);

  // 1. Cruce Bancario
  await page.locator('[data-testid="nav-tab-mobile-bancos"]').click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT_DIR, `${deviceLabel.toLowerCase().replace(/[^a-z0-9]/g, '_')}_01_cruce.png`) });
  const cruce = await auditTouchTargets('.bank-crossing-card', 'Cruce Bancario');
  console.log('[1. Cruce Bancario] Targets:', cruce.count, 'Small (<36px):', cruce.smallTargets);

  // 2. Buzón DFE
  await page.locator('[data-testid="nav-tab-mobile-dfe"]').click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT_DIR, `${deviceLabel.toLowerCase().replace(/[^a-z0-9]/g, '_')}_02_buzon_dfe.png`) });
  const dfe = await auditTouchTargets('.dfe-center-card', 'Buzon DFE');
  console.log('[2. Buzón DFE] Targets:', dfe.count, 'Small (<36px):', dfe.smallTargets);

  // 3. Abonos Mensuales
  await page.locator('[data-testid="nav-tab-mobile-recurrentes"]').click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT_DIR, `${deviceLabel.toLowerCase().replace(/[^a-z0-9]/g, '_')}_03_abonos.png`) });
  const abonos = await auditTouchTargets('.recurring-billing-card', 'Abonos Mensuales');
  console.log('[3. Abonos Mensuales] Targets:', abonos.count, 'Small (<36px):', abonos.smallTargets);

  // ---------------- ACCOUNTANT ----------------
  await page.locator('[data-testid="header-logout-btn"]').click();
  await page.waitForTimeout(400);
  await page.locator('button:has-text("Contador")').first().click();
  await page.waitForTimeout(400);

  // 4. Recategorización
  await page.locator('[data-testid="nav-tab-mobile-recategorizacion"]').click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT_DIR, `${deviceLabel.toLowerCase().replace(/[^a-z0-9]/g, '_')}_04_recat.png`) });
  const recat = await auditTouchTargets('.recat-matrix-card', 'Recategorización');
  console.log('[4. Recategorización] Targets:', recat.count, 'Small (<36px):', recat.smallTargets);

  // 5. Central DFE
  await page.locator('[data-testid="nav-tab-mobile-dfe"]').click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT_DIR, `${deviceLabel.toLowerCase().replace(/[^a-z0-9]/g, '_')}_05_central_dfe.png`) });
  const cdfe = await auditTouchTargets('.accountant-dfe-card', 'Central DFE');
  console.log('[5. Central DFE] Targets:', cdfe.count, 'Small (<36px):', cdfe.smallTargets);

  // 6. Calendario CUIT
  await page.locator('[data-testid="nav-tab-mobile-calendario"]').click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT_DIR, `${deviceLabel.toLowerCase().replace(/[^a-z0-9]/g, '_')}_06_calendario.png`) });
  const cal = await auditTouchTargets('.tax-calendar-card', 'Calendario CUIT');
  console.log('[6. Calendario CUIT] Targets:', cal.count, 'Small (<36px):', cal.smallTargets);

  // 7. Honorarios del Estudio
  await page.locator('[data-testid="nav-tab-mobile-honorarios"]').click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT_DIR, `${deviceLabel.toLowerCase().replace(/[^a-z0-9]/g, '_')}_07_honorarios.png`) });
  const honorarios = await auditTouchTargets('.accountant-fees-card', 'Honorarios');
  console.log('[7. Honorarios] Targets:', honorarios.count, 'Small (<36px):', honorarios.smallTargets);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  console.log('Horizontal page overflow:', overflow ? 'YES (UNWANTED)' : 'NO (PERFECT)');

  await context.close();
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  await auditDevice(browser, 'iPhone 14', 390, 844);
  await auditDevice(browser, 'Compact Android', 360, 780);
  await browser.close();
  console.log('\n=== Target 7 Full Multi-Device Audit Complete ===');
}

main().catch(console.error);
