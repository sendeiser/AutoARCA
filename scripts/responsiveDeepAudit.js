import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const VIEWPORTS = [
  { name: 'mobile_360', width: 360, height: 780, label: 'Mobile Compact (360px)' },
  { name: 'mobile_390', width: 390, height: 844, label: 'Mobile iPhone (390px)' },
  { name: 'tablet_768', width: 768, height: 1024, label: 'Tablet iPad (768px)' },
  { name: 'desktop_1280', width: 1280, height: 800, label: 'Desktop Laptop (1280px)' }
];

const OUTPUT_DIR = path.resolve('./responsive_audit_results');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function checkPageOverflow(page, contextName) {
  return await page.evaluate((ctx) => {
    const winWidth = window.innerWidth;
    const docWidth = document.documentElement.scrollWidth;
    const bodyWidth = document.body.scrollWidth;
    const maxScroll = Math.max(docWidth, bodyWidth);
    const hasHorizontalScroll = maxScroll > winWidth + 2;

    const overflowingElements = [];
    document.querySelectorAll('*').forEach((el) => {
      const rect = el.getBoundingClientRect();
      // Element bounds protruding beyond viewport
      if (rect.right > winWidth + 3 || el.scrollWidth > winWidth + 3) {
        // Exclude elements designed to horizontally scroll (carousels, table wraps with overflow-x)
        const computed = window.getComputedStyle(el);
        const allowsScroll = computed.overflowX === 'auto' || computed.overflowX === 'scroll';
        
        overflowingElements.push({
          tag: el.tagName.toLowerCase(),
          className: el.className ? String(el.className).slice(0, 50) : '',
          id: el.id || '',
          rectRight: Math.round(rect.right),
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
          allowsScroll,
          context: ctx
        });
      }
    });

    return {
      hasHorizontalScroll,
      winWidth,
      maxScroll,
      overflowingCount: overflowingElements.length,
      sampleOverflows: overflowingElements.slice(0, 8)
    };
  }, contextName);
}

async function safeScreenshot(page, filename) {
  try {
    const fullPath = path.join(OUTPUT_DIR, filename);
    await page.screenshot({ path: fullPath });
  } catch (err) {
    console.warn(`[WARN] safeScreenshot notice for ${filename}:`, err.message);
  }
}

async function runDeepAudit() {
  const browser = await chromium.launch({ headless: true });
  const allIssues = [];

  for (const vp of VIEWPORTS) {
    console.log(`\n======================================================`);
    console.log(`TESTING VIEWPORT: ${vp.label} (${vp.width}x${vp.height})`);
    console.log(`======================================================`);

    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height }
    });
    const page = await context.newPage();

    try {
      await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
      await page.waitForTimeout(500);

      // --- 1. AUDIT AUTH SCREEN ---
      const authOverflow = await checkPageOverflow(page, 'Auth Screen');
      if (authOverflow.hasHorizontalScroll) {
        allIssues.push({ viewport: vp.name, screen: 'AuthScreen', details: authOverflow });
        console.warn(`[WARN] AuthScreen horizontal overflow in ${vp.name}:`, authOverflow);
      }
      await safeScreenshot(page, `${vp.name}_01_auth.png`);

      // --- 2. LOGIN AS CLIENT ---
      const clientBtn = page.locator('button:has-text("Cliente")').first();
      if (await clientBtn.isVisible()) {
        await clientBtn.click();
        await page.waitForTimeout(800);
      }

      // Check POS Terminal
      const posOverflow = await checkPageOverflow(page, 'Client POS');
      if (posOverflow.hasHorizontalScroll) {
        allIssues.push({ viewport: vp.name, screen: 'PosTerminal', details: posOverflow });
        console.warn(`[WARN] PosTerminal overflow in ${vp.name}:`, posOverflow);
      }
      await safeScreenshot(page, `${vp.name}_02_client_pos.png`);

      // Open System Overview from Header
      const guideBtn = page.locator('[data-testid="system-guide-btn"]');
      if (await guideBtn.isVisible()) {
        await guideBtn.click();
        await page.waitForTimeout(600);
        const modalOverflow = await checkPageOverflow(page, 'SystemOverviewModal');
        if (modalOverflow.hasHorizontalScroll) {
          allIssues.push({ viewport: vp.name, screen: 'SystemOverviewModal', details: modalOverflow });
          console.warn(`[WARN] SystemOverviewModal overflow in ${vp.name}:`, modalOverflow);
        }
        await safeScreenshot(page, `${vp.name}_03_client_guide_modal.png`);
        await page.locator('button:has-text("Entendido, Continuar"), .uui-modal-close-btn').first().click();
        await page.waitForTimeout(400);
      }

      // Switch to Client Dashboard (Panel Monotributo)
      const dashboardTab = page.locator('.segmented-control-btn:has-text("Panel"), .mobile-tab-btn:has-text("Panel")').first();
      if (await dashboardTab.isVisible()) {
        await dashboardTab.click();
        await page.waitForTimeout(800);

        const dashOverflow = await checkPageOverflow(page, 'Client Dashboard');
        if (dashOverflow.hasHorizontalScroll) {
          allIssues.push({ viewport: vp.name, screen: 'ClientDashboard', details: dashOverflow });
          console.warn(`[WARN] ClientDashboard overflow in ${vp.name}:`, dashOverflow);
        }
        await safeScreenshot(page, `${vp.name}_04_client_dashboard.png`);
      }

      // --- 3. LOGOUT AND LOGIN AS ACCOUNTANT ---
      const logoutBtn = page.locator('[data-testid="header-logout-btn"], button:has-text("Salir")').first();
      if (await logoutBtn.isVisible()) {
        await logoutBtn.click();
        await page.waitForTimeout(500);
      }

      const accountantBtn = page.locator('button:has-text("Contador")').first();
      if (await accountantBtn.isVisible()) {
        await accountantBtn.click();
        await page.waitForTimeout(800);

        // Subtab: Cartera & Lotes
        const accMainOverflow = await checkPageOverflow(page, 'Accountant Cartera');
        if (accMainOverflow.hasHorizontalScroll) {
          allIssues.push({ viewport: vp.name, screen: 'Accountant Cartera', details: accMainOverflow });
          console.warn(`[WARN] Accountant Cartera overflow in ${vp.name}:`, accMainOverflow);
        }
        await safeScreenshot(page, `${vp.name}_05_accountant_cartera.png`);

        // Subtab: Recategorización Semestral
        const recatSubtab = page.locator('button:has-text("Recategorización")').first();
        if (await recatSubtab.isVisible()) {
          await recatSubtab.click();
          await page.waitForTimeout(500);
          const recatOverflow = await checkPageOverflow(page, 'Accountant Recat');
          if (recatOverflow.hasHorizontalScroll) {
            allIssues.push({ viewport: vp.name, screen: 'Accountant Recat', details: recatOverflow });
            console.warn(`[WARN] Accountant Recat overflow in ${vp.name}:`, recatOverflow);
          }
          await safeScreenshot(page, `${vp.name}_06_accountant_recat.png`);
        }

        // Subtab: Central DFE
        const dfeSubtab = page.locator('button:has-text("Central DFE")').first();
        if (await dfeSubtab.isVisible()) {
          await dfeSubtab.click();
          await page.waitForTimeout(500);
          const dfeOverflow = await checkPageOverflow(page, 'Accountant DFE');
          if (dfeOverflow.hasHorizontalScroll) {
            allIssues.push({ viewport: vp.name, screen: 'Accountant DFE', details: dfeOverflow });
            console.warn(`[WARN] Accountant DFE overflow in ${vp.name}:`, dfeOverflow);
          }
          await safeScreenshot(page, `${vp.name}_07_accountant_dfe.png`);
        }

        // Subtab: Riesgo Bancario
        const riskSubtab = page.locator('button:has-text("Riesgo")').first();
        if (await riskSubtab.isVisible()) {
          await riskSubtab.click();
          await page.waitForTimeout(500);
          const riskOverflow = await checkPageOverflow(page, 'Accountant Risk');
          if (riskOverflow.hasHorizontalScroll) {
            allIssues.push({ viewport: vp.name, screen: 'Accountant Risk', details: riskOverflow });
            console.warn(`[WARN] Accountant Risk overflow in ${vp.name}:`, riskOverflow);
          }
          await safeScreenshot(page, `${vp.name}_08_accountant_risk.png`);
        }

        // Subtab: Calendario CUIT
        const calSubtab = page.locator('button:has-text("Calendario")').first();
        if (await calSubtab.isVisible()) {
          await calSubtab.click();
          await page.waitForTimeout(500);
          const calOverflow = await checkPageOverflow(page, 'Accountant Calendar');
          if (calOverflow.hasHorizontalScroll) {
            allIssues.push({ viewport: vp.name, screen: 'Accountant Calendar', details: calOverflow });
            console.warn(`[WARN] Accountant Calendar overflow in ${vp.name}:`, calOverflow);
          }
          await safeScreenshot(page, `${vp.name}_09_accountant_calendar.png`);
        }

        // Subtab: Honorarios
        const feesSubtab = page.locator('button:has-text("Honorarios")').first();
        if (await feesSubtab.isVisible()) {
          await feesSubtab.click();
          await page.waitForTimeout(500);
          const feesOverflow = await checkPageOverflow(page, 'Accountant Fees');
          if (feesOverflow.hasHorizontalScroll) {
            allIssues.push({ viewport: vp.name, screen: 'Accountant Fees', details: feesOverflow });
            console.warn(`[WARN] Accountant Fees overflow in ${vp.name}:`, feesOverflow);
          }
          await safeScreenshot(page, `${vp.name}_10_accountant_fees.png`);
        }
      }

      // --- 4. LOGOUT AND LOGIN AS SUPERADMIN ---
      const logoutBtn2 = page.locator('[data-testid="header-logout-btn"], button:has-text("Salir")').first();
      if (await logoutBtn2.isVisible()) {
        await logoutBtn2.click();
        await page.waitForTimeout(500);
      }

      const adminBtn = page.locator('button:has-text("Admin")').first();
      if (await adminBtn.isVisible()) {
        await adminBtn.click();
        await page.waitForTimeout(800);

        const adminOverflow = await checkPageOverflow(page, 'SuperAdmin Dashboard');
        if (adminOverflow.hasHorizontalScroll) {
          allIssues.push({ viewport: vp.name, screen: 'SuperAdmin Dashboard', details: adminOverflow });
          console.warn(`[WARN] SuperAdmin overflow in ${vp.name}:`, adminOverflow);
        }
        await safeScreenshot(page, `${vp.name}_11_superadmin.png`);
      }

    } catch (err) {
      console.error(`Error auditing ${vp.name}:`, err);
    } finally {
      await context.close();
    }
  }

  await browser.close();
  console.log(`\n======================================================`);
  console.log(`DEEP RESPONSIVE AUDIT FINISHED`);
  console.log(`Total overflow issues detected: ${allIssues.length}`);
  console.log(`======================================================`);
  fs.writeFileSync(path.join(OUTPUT_DIR, 'summary.json'), JSON.stringify(allIssues, null, 2));
}

runDeepAudit().catch(console.error);
