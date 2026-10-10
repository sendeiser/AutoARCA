import { chromium } from 'playwright';

async function testInteractiveAuth() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(500);

  // Hacer logout para ir a AuthScreen
  const logoutBtn = await page.$('.header-logout-btn');
  if (logoutBtn) {
    await logoutBtn.click();
    await page.waitForTimeout(500);
  }

  console.log('--- EN AUTHTEXT / AUTHMENU ---');
  await page.screenshot({ path: 'auth-login-screen.png' });

  // 1. Probar Login con usuario inexistente
  const emailInput = await page.$('input[placeholder="correo@ejemplo.com"]');
  const passInput = await page.$('input[placeholder="••••••••"]');
  const submitBtn = await page.$('button[type="submit"]');

  await emailInput.fill('noexiste@mail.com');
  await passInput.fill('1234');
  await submitBtn.click();
  await page.waitForTimeout(500);

  let errText = await page.evaluate(() => document.querySelector('.uui-auth-box div[style*="rgba(239, 68, 68"]')?.innerText);
  console.log('Error con usuario inexistente:', errText);

  // 2. Probar Login con Martín González
  await emailInput.fill('martin@comercio.com');
  await passInput.fill('1234');
  await submitBtn.click();
  await page.waitForTimeout(800);

  let isInsideApp = await page.evaluate(() => !!document.querySelector('.app-shell-navbar'));
  console.log('¿Ingresó correctamente a la app con martin@comercio.com?:', isInsideApp);

  // Hacer logout de nuevo
  const logoutBtn2 = await page.$('.header-logout-btn');
  if (logoutBtn2) {
    await logoutBtn2.click();
    await page.waitForTimeout(500);
  }

  // 3. Probar Registro como Cliente
  const regTab = await page.$('button.uui-auth-tab:has-text("Registrarse")');
  await regTab.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'auth-register-client-screen.png' });

  // Llenar campos de cliente
  const nameInput = await page.$('input[placeholder*="Martín González"]');
  const regEmailInput = await page.$('input[placeholder="correo@ejemplo.com"]');
  const regPassInput = await page.$('input[placeholder="Mín. 4 caracteres"]');
  const regCuitInput = await page.$('input[placeholder="20301234567"]');

  await nameInput.fill('Nuevo Cliente Juan');
  await regEmailInput.fill('juan.cliente@test.com');
  await regPassInput.fill('secreto123');
  await regCuitInput.fill('20387654321');

  const regSubmitBtn = await page.$('button[type="submit"]');
  await regSubmitBtn.click();
  await page.waitForTimeout(800);

  isInsideApp = await page.evaluate(() => !!document.querySelector('.app-shell-navbar'));
  let userDisplay = await page.evaluate(() => document.querySelector('.user-chip-name')?.innerText);
  console.log('¿Ingresó tras registrar cliente nuevo?:', isInsideApp, '| Usuario mostrado:', userDisplay);

  // Hacer logout
  const logoutBtn3 = await page.$('.header-logout-btn');
  if (logoutBtn3) {
    await logoutBtn3.click();
    await page.waitForTimeout(500);
  }

  // 4. Probar Registro como Contador
  const regTab2 = await page.$('button.uui-auth-tab:has-text("Registrarse")');
  await regTab2.click();
  await page.waitForTimeout(500);

  // Click en tarjeta de Contador
  const accountantCard = await page.$('.uui-role-card:has-text("Estudio Contable")');
  await accountantCard.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'auth-register-accountant-screen.png' });

  const accNameInput = await page.$('input[placeholder*="Estudio Contable"]');
  const accEmailInput = await page.$('input[placeholder="correo@ejemplo.com"]');
  const accPassInput = await page.$('input[placeholder="Mín. 4 caracteres"]');
  const accMatricula = await page.$('input[placeholder*="T° 142"]');
  const accCuit = await page.$('input[placeholder="30712345678"]');

  console.log('Inputs contador encontrados:', {
    accNameInput: !!accNameInput,
    accEmailInput: !!accEmailInput,
    accPassInput: !!accPassInput,
    accMatricula: !!accMatricula,
    accCuit: !!accCuit
  });

  if (accNameInput) await accNameInput.fill('Estudio Impositivo Rodríguez');
  if (accEmailInput) await accEmailInput.fill('rodriguez@contable.com');
  if (accPassInput) await accPassInput.fill('clave456');
  if (accMatricula) await accMatricula.fill('T° 88 F° 12');
  if (accCuit) await accCuit.fill('30765432109');

  const accSubmitBtn = await page.$('button[type="submit"]');
  await accSubmitBtn.click();
  await page.waitForTimeout(800);

  isInsideApp = await page.evaluate(() => !!document.querySelector('.app-shell-navbar'));
  userDisplay = await page.evaluate(() => document.querySelector('.user-chip-name')?.innerText);
  let roleActive = await page.evaluate(() => document.querySelector('.role-seg-btn.active')?.innerText);
  console.log('¿Ingresó tras registrar contador nuevo?:', isInsideApp, '| Usuario mostrado:', userDisplay, '| Rol activo:', roleActive);

  // Verificar si hay scroll en la ventana
  const scrollInfo = await page.evaluate(() => ({
    bodyScrollHeight: document.body.scrollHeight,
    windowInnerHeight: window.innerHeight,
    hasVerticalScroll: document.body.scrollHeight > window.innerHeight
  }));
  console.log('Información de Scroll en la app:', scrollInfo);

  await browser.close();
}

testInteractiveAuth().catch(console.error);
