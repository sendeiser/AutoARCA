import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  console.log('Navegando a http://localhost:5173...');
  await page.goto('http://localhost:5173');
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });

  // Hacer login como Cliente Demo
  const demoClientBtn = page.locator('.uui-demo-btn:has-text("Cliente")');
  await demoClientBtn.waitFor({ timeout: 5000 });
  console.log('Iniciando sesión con Cliente Demo...');
  await demoClientBtn.click();
  await page.waitForTimeout(600);

  // 1. Verificar Header: No debe haber selector de roles ni badge de rol
  const headerRoleBadge = page.locator('[data-testid="header-role-badge"]');
  const roleSelect = page.locator('select.role-switcher-select');
  const roleSegmented = page.locator('.role-switcher-segmented');
  
  const hasBadge = await headerRoleBadge.isVisible().catch(() => false);
  const hasSelect = await roleSelect.isVisible().catch(() => false);
  const hasSegmented = await roleSegmented.isVisible().catch(() => false);

  console.log(`Verificación de Header (selectores de rol eliminados): badge=${hasBadge}, select=${hasSelect}, segmented=${hasSegmented}`);
  if (hasBadge || hasSelect || hasSegmented) {
    console.error('ERROR: Todavía hay elementos de selector de roles en el Header');
  } else {
    console.log('ÉXITO: El selector de roles fue removido completamente del Header.');
  }

  // 2. Ir al Dashboard Fiscal
  const dashTab = page.locator('button:has-text("Dashboard Fiscal")');
  if (await dashTab.isVisible()) {
    console.log('Navegando a Dashboard Fiscal...');
    await dashTab.click();
    await page.waitForTimeout(800);
  }

  // Captura 1: Barra de consumo mejorada
  const artifactsDir = path.resolve(process.env.TEMP || '.', 'tax_screenshots');
  if (!fs.existsSync(artifactsDir)) fs.mkdirSync(artifactsDir, { recursive: true });

  const shot1Path = path.join(artifactsDir, 'tax_traffic_light_enhanced.png');
  const taxCard = page.locator('.traffic-light-card');
  if (await taxCard.isVisible()) {
    await taxCard.screenshot({ path: shot1Path });
    console.log(`Captura de barra de consumo guardada en: ${shot1Path}`);
  }

  // 3. Abrir Simulador ARCA
  const simBtn = page.locator('button:has-text("Simulador ARCA")');
  if (await simBtn.isVisible()) {
    console.log('Abriendo Simulador ARCA...');
    await simBtn.click();
    await page.waitForTimeout(400);

    // Click en botón rápido +1.000.000
    const quickBtn = page.locator('.sim-quick-btn:has-text("1.000.000")');
    if (await quickBtn.isVisible()) {
      await quickBtn.click();
      await page.waitForTimeout(400);
    }

    const shot2Path = path.join(artifactsDir, 'arca_simulator_active.png');
    await taxCard.screenshot({ path: shot2Path });
    console.log(`Captura de Simulador ARCA guardada en: ${shot2Path}`);
  }

  // 4. Probar emisión y ver Factura C Oficial
  const posTab = page.locator('[data-testid="nav-tab-pos"]');
  if (await posTab.isVisible()) {
    console.log('Navegando a Terminal POS...');
    await posTab.click();
    await page.waitForTimeout(500);

    // Ingresar monto con chip rápido de $5.000
    const chip5000 = page.locator('.quick-amount-chip:has-text("5.000")');
    if (await chip5000.isVisible()) {
      await chip5000.click();
      await page.waitForTimeout(300);
    }

    // Emitir venta
    const emitBtn = page.locator('.pos-submit-btn');
    if (await emitBtn.isVisible()) {
      await emitBtn.click();
      await page.waitForTimeout(600);
    }

    // Volver a Dashboard Fiscal donde se listan los comprobantes de hoy
    const dashTabAgain = page.locator('[data-testid="nav-tab-dashboard"]');
    if (await dashTabAgain.isVisible()) {
      console.log('Regresando a Dashboard Fiscal...');
      await dashTabAgain.click();
      await page.waitForTimeout(600);

      const verFacturaBtn = page.locator('button:has-text("Ver Factura C")').first();
      if (await verFacturaBtn.isVisible()) {
        console.log('Abriendo Factura C oficial desde el listado...');
        await verFacturaBtn.click();
        await page.waitForTimeout(600);

        const modalFactura = page.locator('.factura-modal-container');
        const shot3Path = path.join(artifactsDir, 'official_factura_c_modal.png');
        if (await modalFactura.isVisible()) {
          await modalFactura.screenshot({ path: shot3Path });
          console.log(`Captura de Factura C oficial guardada en: ${shot3Path}`);
        }
      }
    }
  }

  await browser.close();
  console.log('Pruebas completadas exitosamente.');
}

run().catch((err) => {
  console.error('Error durante la ejecución:', err);
  process.exit(1);
});
