import { chromium } from 'playwright';

async function testAuth() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  const consoleLogs = [];
  page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => consoleLogs.push(`[PAGE ERROR] ${err.message}`));

  console.log('1. Navegando a localhost:5173 con localStorage limpio...');
  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(1000);

  // Ver qué hay en el DOM
  const titleText = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    return h1 ? h1.innerText : 'No H1 found';
  });
  console.log('Título encontrado en pantalla:', titleText);

  // Ver si hay sesión en localStorage
  const currentSession = await page.evaluate(() => localStorage.getItem('autoarca_session_v2'));
  console.log('autoarca_session_v2 en localStorage:', currentSession ? 'EXISTE' : 'NULL');

  // Si no está en AuthScreen, hacer logout
  const logoutBtn = await page.$('.header-logout-btn');
  if (logoutBtn) {
    console.log('Existe botón logout en Header. Haciendo clic para ir a AuthScreen...');
    await logoutBtn.click();
    await page.waitForTimeout(500);
  }

  // Ahora debemos estar en AuthScreen
  const authTitle = await page.evaluate(() => document.querySelector('.uui-auth-title')?.innerText);
  console.log('Título en AuthScreen:', authTitle);

  // Test 1: Iniciar Sesión con credenciales
  console.log('\n--- Probando Iniciar Sesión ---');
  // Buscar inputs de login
  const emailInput = await page.$('input[type="email"]');
  const passInput = await page.$('input[type="password"]');
  const submitBtn = await page.$('button[type="submit"]');

  if (emailInput && passInput && submitBtn) {
    console.log('Llenando correo y contraseña...');
    await emailInput.fill('martin@comercio.com');
    await passInput.fill('1234');
    console.log('Haciendo clic en submit...');
    await submitBtn.click();
    await page.waitForTimeout(1000);

    const postLoginH1 = await page.evaluate(() => document.querySelector('h1')?.innerText);
    const postLoginSession = await page.evaluate(() => localStorage.getItem('autoarca_session_v2'));
    console.log('H1 post-login:', postLoginH1);
    console.log('Sesión post-login:', postLoginSession ? 'ESTABLECIDA' : 'NO ESTABLECIDA');
  } else {
    console.log('No se encontraron inputs de login:', { emailInput: !!emailInput, passInput: !!passInput, submitBtn: !!submitBtn });
  }

  // Hacer logout de nuevo para probar Registro
  console.log('\n--- Probando Registro de Nuevo Usuario ---');
  const logoutBtn2 = await page.$('.header-logout-btn');
  if (logoutBtn2) {
    await logoutBtn2.click();
    await page.waitForTimeout(500);
  }

  // Cambiar a tab "Registrarse"
  const registerTab = await page.$('button.uui-auth-tab:has-text("Registrarse")');
  if (registerTab) {
    await registerTab.click();
    await page.waitForTimeout(500);
    console.log('Tab Registrarse activada.');

    // Rellenar formulario de registro
    const regNameInput = await page.$('input[placeholder*="Martín González"]');
    const regEmailInput = await page.$('input[placeholder="correo@ejemplo.com"]');
    const regPassInput = await page.$('input[placeholder="Mín. 4 caracteres"]');
    const regCuitInput = await page.$('input[placeholder="20301234567"]');
    const regSubmitBtn = await page.$('button[type="submit"]');

    console.log('Inputs encontrados:', {
      name: !!regNameInput,
      email: !!regEmailInput,
      pass: !!regPassInput,
      cuit: !!regCuitInput,
      submit: !!regSubmitBtn
    });

    const testEmail = `nuevo_usuario_${Date.now()}@test.com`;
    if (regNameInput) await regNameInput.fill('Carlos Monotributista');
    if (regEmailInput) await regEmailInput.fill(testEmail);
    if (regPassInput) await regPassInput.fill('password123');
    if (regCuitInput) await regCuitInput.fill('20334455667');

    console.log('Enviando formulario de registro...');
    if (regSubmitBtn) {
      await regSubmitBtn.click();
      await page.waitForTimeout(1000);
    }

    const errorBox = await page.evaluate(() => {
      const err = document.querySelector('.uui-auth-box div[style*="rgba(239, 68, 68"]');
      return err ? err.innerText : null;
    });
    if (errorBox) {
      console.log('ERROR visible en pantalla tras registro:', errorBox);
    }

    const postRegisterH1 = await page.evaluate(() => document.querySelector('h1')?.innerText);
    const postRegisterSession = await page.evaluate(() => localStorage.getItem('autoarca_session_v2'));
    console.log('H1 post-registro:', postRegisterH1);
    console.log('Sesión post-registro:', postRegisterSession);
  }

  console.log('\n--- Console Logs capturados ---');
  consoleLogs.forEach(l => console.log(l));

  await browser.close();
}

testAuth().catch(console.error);
