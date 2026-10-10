/**
 * Visual Audit Script with Playwright
 * Captura y analiza el diseño del proyecto en múltiples resoluciones y temas.
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = path.resolve('playwright-screenshots');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 820, height: 1180 },
  { name: 'mobile', width: 390, height: 844 }
];

const THEMES = ['dark', 'light'];

async function runVisualAudit() {
  console.log('🚀 Iniciando Auditoría Visual Completa con Playwright...');
  const browser = await chromium.launch({ headless: true });
  const auditReport = [];

  for (const vp of VIEWPORTS) {
    for (const theme of THEMES) {
      console.log(`\n========================================`);
      console.log(`📱 Vista: [${vp.name.toUpperCase()}] | Tema: [${theme.toUpperCase()}]`);
      console.log(`========================================`);

      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 2
      });
      const page = await context.newPage();

      // Inyectar tema y sesión activa de cliente
      await page.addInitScript((t) => {
        localStorage.setItem('autoarca_theme', t);
        localStorage.setItem('autoarca_session_v2', JSON.stringify({
          id: 'client-1',
          full_name: 'Martín González',
          email: 'martin@comercio.com',
          role: 'client',
          subscription_status: 'active',
          cuit: '20301234567',
          business_id: 'biz-1'
        }));
      }, theme);

      await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
      await page.waitForTimeout(500);

      // Sincronizar data-theme en HTML
      await page.evaluate((t) => {
        document.documentElement.setAttribute('data-theme', t);
        document.body.setAttribute('data-theme', t);
      }, theme);
      await page.waitForTimeout(300);

      // 1. Captura Terminal POS
      const posFile = path.join(OUTPUT_DIR, `${vp.name}_${theme}_pos.png`);
      await page.screenshot({ path: posFile, fullPage: false });
      console.log(`  ✓ POS capturado: ${posFile}`);

      // 2. Captura Dashboard Fiscal
      const dashSelector = vp.name === 'mobile' ? '[data-testid="nav-tab-mobile-dashboard"]' : '[data-testid="nav-tab-dashboard"]';
      const dashBtn = page.locator(dashSelector).first();
      if (await dashBtn.isVisible()) {
        await dashBtn.click();
        await page.waitForTimeout(400);
        const dashFile = path.join(OUTPUT_DIR, `${vp.name}_${theme}_dashboard.png`);
        await page.screenshot({ path: dashFile, fullPage: false });
        console.log(`  ✓ Dashboard capturado: ${dashFile}`);
      }

      // 3. Captura Portal Contador
      const accPill = page.locator('[data-testid="role-pill-accountant"]');
      if (await accPill.isVisible()) {
        await accPill.click();
        await page.waitForTimeout(400);
        const accFile = path.join(OUTPUT_DIR, `${vp.name}_${theme}_contador.png`);
        await page.screenshot({ path: accFile, fullPage: false });
        console.log(`  ✓ Contador capturado: ${accFile}`);
      }

      // 4. Captura SuperAdmin
      const adminPill = page.locator('[data-testid="role-pill-superadmin"]');
      if (await adminPill.isVisible()) {
        await adminPill.click();
        await page.waitForTimeout(400);
        const adminFile = path.join(OUTPUT_DIR, `${vp.name}_${theme}_superadmin.png`);
        await page.screenshot({ path: adminFile, fullPage: false });
        console.log(`  ✓ SuperAdmin capturado: ${adminFile}`);
      }

      // Auditoría de overflow y diseño
      const metrics = await page.evaluate(() => {
        const docEl = document.documentElement;
        const hasOverflow = docEl.scrollWidth > docEl.clientWidth;
        
        // Medir elementos interactivos pequeños
        const smallTouchTargets = [];
        const buttons = document.querySelectorAll('button, a, [role="button"]');
        buttons.forEach((b) => {
          const rect = b.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0 && (rect.width < 28 || rect.height < 28)) {
            smallTouchTargets.push({
              text: b.innerText?.slice(0, 20) || b.getAttribute('aria-label') || 'unnamed',
              w: Math.round(rect.width),
              h: Math.round(rect.height)
            });
          }
        });

        return {
          hasOverflow,
          scrollWidth: docEl.scrollWidth,
          clientWidth: docEl.clientWidth,
          smallTouchCount: smallTouchTargets.length
        };
      });

      auditReport.push({
        viewport: vp.name,
        theme,
        hasOverflow: metrics.hasOverflow,
        smallTouchTargets: metrics.smallTouchCount
      });

      await context.close();
    }
  }

  // 5. Capturar AuthScreen (Login y Registro) en todos los viewports
  console.log(`\n========================================`);
  console.log(`🔐 Capturando Pantallas de Acceso AuthScreen...`);
  console.log(`========================================`);
  for (const vp of VIEWPORTS) {
    for (const theme of THEMES) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 2
      });
      const page = await context.newPage();
      await page.addInitScript((t) => {
        localStorage.setItem('autoarca_theme', t);
        localStorage.removeItem('autoarca_session_v2');
      }, theme);

      await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
      await page.evaluate((t) => {
        document.documentElement.setAttribute('data-theme', t);
        document.body.setAttribute('data-theme', t);
      }, theme);
      await page.waitForTimeout(400);

      // Login
      const authFile = path.join(OUTPUT_DIR, `${vp.name}_${theme}_auth_login.png`);
      await page.screenshot({ path: authFile, fullPage: false });
      console.log(`  ✓ Auth Login [${vp.name} - ${theme}]: ${authFile}`);

      // Tab Registro
      const regTab = page.locator('button[role="tab"]:has-text("Registrarse")');
      if (await regTab.isVisible()) {
        await regTab.click();
        await page.waitForTimeout(300);
        const regFile = path.join(OUTPUT_DIR, `${vp.name}_${theme}_auth_register.png`);
        await page.screenshot({ path: regFile, fullPage: false });
        console.log(`  ✓ Auth Register [${vp.name} - ${theme}]: ${regFile}`);
      }

      await context.close();
    }
  }

  await browser.close();

  console.log('\n📊 Resumen de Auditoría Playwright:');
  console.table(auditReport);
  console.log(`\n🎉 Todas las capturas fueron guardadas en: ${OUTPUT_DIR}`);
}

runVisualAudit().catch((err) => {
  console.error('Error durante la auditoría visual:', err);
  process.exit(1);
});
