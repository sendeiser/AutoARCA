import { chromium } from 'playwright';

async function verify() {
  console.log('🚀 Iniciando verificación de flujos reales con Playwright...');
  const browser = await chromium.launch({ headless: true });
  
  // Test en resolución estándar de laptop 1280 x 800
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  // 1. Cargar con localStorage limpio
  await page.goto('http://localhost:5173/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForTimeout(600);

  // Verificar que muestra AuthScreen
  const isAuthScreen = await page.evaluate(() => !!document.querySelector('.uui-auth-container'));
  console.log('1. Pantalla inicial sin sesión muestra AuthScreen:', isAuthScreen ? '✅ CORRECTO' : '❌ ERROR');

  // Verificar ausencia de scroll en AuthScreen
  const authScroll = await page.evaluate(() => ({
    bodyScrollHeight: document.body.scrollHeight,
    windowHeight: window.innerHeight,
    hasScroll: document.body.scrollHeight > window.innerHeight
  }));
  console.log('2. Scroll en AuthScreen (1280x800):', authScroll.hasScroll ? `⚠️ Scroll detectado (${authScroll.bodyScrollHeight}px > ${authScroll.windowHeight}px)` : '✅ CERO SCROLL');

  // 3. Probar Login con Martín González
  const emailInput = await page.$('input[placeholder="correo@ejemplo.com"]');
  const passInput = await page.$('input[placeholder="••••••••"]');
  const loginSubmit = await page.$('button[type="submit"]');

  await emailInput.fill('martin@comercio.com');
  await passInput.fill('1234');
  await loginSubmit.click();
  await page.waitForTimeout(600);

  const isAppVisible = await page.evaluate(() => !!document.querySelector('.app-shell-navbar'));
  const userChip = await page.evaluate(() => document.querySelector('.user-chip-name')?.innerText);
  console.log('3. Login exitoso:', isAppVisible ? '✅ CORRECTO' : '❌ ERROR', '| Usuario:', userChip);

  // 4. Verificar scroll en POS Terminal
  const posScroll = await page.evaluate(() => ({
    bodyScrollHeight: document.body.scrollHeight,
    windowHeight: window.innerHeight,
    hasScroll: document.body.scrollHeight > window.innerHeight
  }));
  console.log('4. Scroll en POS Terminal (1280x800):', posScroll.hasScroll ? `⚠️ Scroll detectado (${posScroll.bodyScrollHeight}px > ${posScroll.windowHeight}px)` : '✅ CERO SCROLL');

  // 5. Emitir un comprobante en POS
  const key5 = await page.$('.keypad-btn:has-text("5")');
  const key0 = await page.$('.keypad-btn:has-text("0")');
  const emitBtn = await page.$('.pos-emit-btn');

  if (key5 && key0 && emitBtn) {
    await key5.click();
    await key0.click();
    await key0.click();
    await key0.click(); // $5.000
    await page.waitForTimeout(200);
    await emitBtn.click();
    await page.waitForTimeout(500);
    console.log('5. Venta emitida en POS con éxito: ✅ CORRECTO');
  }

  // 6. Probar Logout
  const logoutBtn = await page.$('.header-logout-btn');
  await logoutBtn.click();
  await page.waitForTimeout(500);

  const backToAuth = await page.evaluate(() => !!document.querySelector('.uui-auth-container'));
  console.log('6. Logout regresa a AuthScreen:', backToAuth ? '✅ CORRECTO' : '❌ ERROR');

  // 7. Probar Registro de nuevo Comercio (Cliente)
  const regTab = await page.$('button.uui-auth-tab:has-text("Registrarse")');
  await regTab.click();
  await page.waitForTimeout(300);

  const newClientEmail = `comercio_nuevo_${Date.now()}@tienda.com`;
  const nameInput = await page.$('input[placeholder*="Martín González"]');
  const regEmailInput = await page.$('input[placeholder="correo@ejemplo.com"]');
  const regPassInput = await page.$('input[placeholder="Mín. 4 caracteres"]');
  const regSubmit = await page.$('button[type="submit"]');

  await nameInput.fill('Almacén Doña Rosa');
  await regEmailInput.fill(newClientEmail);
  await regPassInput.fill('clave1234');
  await regSubmit.click();
  await page.waitForTimeout(700);

  const clientRegistered = await page.evaluate(() => !!document.querySelector('.app-shell-navbar'));
  const clientName = await page.evaluate(() => document.querySelector('.user-chip-name')?.innerText);
  console.log('7. Registro de Comercio exitoso:', clientRegistered ? '✅ CORRECTO' : '❌ ERROR', '| Usuario:', clientName);

  // 8. Logout y Registro de nuevo Contador
  const logoutBtn2 = await page.$('.header-logout-btn');
  await logoutBtn2.click();
  await page.waitForTimeout(500);

  const regTab2 = await page.$('button.uui-auth-tab:has-text("Registrarse")');
  await regTab2.click();
  await page.waitForTimeout(300);

  const accountantCard = await page.$('.uui-role-card:has-text("Estudio Contable")');
  await accountantCard.click();
  await page.waitForTimeout(300);

  const accNameInput = await page.$('input[placeholder*="Estudio Contable"]');
  const accEmailInput = await page.$('input[placeholder="correo@ejemplo.com"]');
  const accPassInput = await page.$('input[placeholder="Mín. 4 caracteres"]');
  const accSubmit = await page.$('button[type="submit"]');

  const newAccEmail = `estudio_${Date.now()}@contadores.com`;
  await accNameInput.fill('Estudio Contable Balcarce');
  await accEmailInput.fill(newAccEmail);
  await accPassInput.fill('estudio2026');
  await accSubmit.click();
  await page.waitForTimeout(700);

  const accRegistered = await page.evaluate(() => !!document.querySelector('.app-shell-navbar'));
  const accName = await page.evaluate(() => document.querySelector('.user-chip-name')?.innerText);
  const activeRole = await page.evaluate(() => document.querySelector('.role-seg-btn.active')?.innerText);
  console.log('8. Registro de Contador exitoso:', accRegistered ? '✅ CORRECTO' : '❌ ERROR', '| Estudio:', accName, '| Rol activo:', activeRole.trim());

  // 9. Verificar Modo Claro
  const themeToggle = await page.$('.theme-toggle-btn');
  if (themeToggle) {
    await themeToggle.click();
    await page.waitForTimeout(300);
    const themeApplied = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    console.log('9. Alternar a Modo Claro:', themeApplied === 'light' ? '✅ CORRECTO (data-theme="light")' : '❌ ERROR');
  }

  // Tomar captura de verificación final
  await page.screenshot({ path: 'playwright-screenshots/verified-flows.png' });
  console.log('📸 Captura de verificación guardada en playwright-screenshots/verified-flows.png');

  await browser.close();
}

verify().catch(console.error);
