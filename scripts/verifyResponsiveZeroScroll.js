import { chromium } from 'playwright';

const VIEWPORTS = [
  { name: 'Desktop HD', width: 1440, height: 900 },
  { name: 'Laptop', width: 1280, height: 800 },
  { name: 'Tablet iPad Air', width: 820, height: 1180 },
  { name: 'Mobile iPhone', width: 390, height: 844 }
];

async function verifyResponsive() {
  const browser = await chromium.launch({ headless: true });
  console.log('📱 Verificando adaptabilidad y Zero-Scroll en múltiples dispositivos...');

  for (const vp of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });

    // 1. Verificar AuthScreen (sin sesión)
    await page.goto('http://localhost:5173/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForTimeout(400);

    const authScroll = await page.evaluate(() => ({
      bodyScrollHeight: document.body.scrollHeight,
      windowHeight: window.innerHeight,
      hasScroll: document.body.scrollHeight > window.innerHeight
    }));

    // 2. Iniciar sesión y verificar POS Terminal
    const emailInput = await page.$('input[placeholder="correo@ejemplo.com"]');
    const passInput = await page.$('input[placeholder="••••••••"]');
    const submitBtn = await page.$('button[type="submit"]');

    if (emailInput && passInput && submitBtn) {
      await emailInput.fill('martin@comercio.com');
      await passInput.fill('1234');
      await submitBtn.click();
      await page.waitForTimeout(500);
    }

    const posScroll = await page.evaluate(() => ({
      bodyScrollHeight: document.body.scrollHeight,
      windowHeight: window.innerHeight,
      hasScroll: document.body.scrollHeight > window.innerHeight
    }));

    // Verificar que el botón de emisión es visible en pantalla sin scroll
    const emitBtnVisible = await page.evaluate(() => {
      const btn = document.querySelector('.pos-emit-btn');
      if (!btn) return false;
      const rect = btn.getBoundingClientRect();
      return rect.top >= 0 && rect.bottom <= window.innerHeight;
    });

    console.log(`\n[${vp.name} (${vp.width}x${vp.height})]:`);
    console.log(`  - AuthScreen Scroll: ${authScroll.hasScroll ? '⚠️ Scroll detectado' : '✅ Cero Scroll'}`);
    console.log(`  - POS Terminal Scroll: ${posScroll.hasScroll ? '⚠️ Scroll detectado' : '✅ Cero Scroll'}`);
    console.log(`  - Botón Emitir Comprobante 100% en Viewport: ${emitBtnVisible ? '✅ VISIBLE SIN SCROLL' : '❌ FUERA DE PANTALLA'}`);

    await page.screenshot({ path: `playwright-screenshots/viewport-${vp.name.replace(/\s+/g, '-').toLowerCase()}.png` });

    await page.close();
  }

  await browser.close();
}

verifyResponsive().catch(console.error);
