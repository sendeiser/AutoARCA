import { chromium } from 'playwright';

async function testScreen() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  // 1. Limpiar localStorage para que no haya sesión
  await page.goto('http://localhost:5173/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForTimeout(1000);

  // Tomar captura inicial
  await page.screenshot({ path: 'test-initial.png' });
  console.log('Captura inicial guardada.');

  // Ver si estamos en AuthScreen o en la App
  const isAuthScreen = await page.evaluate(() => !!document.querySelector('.uui-auth-container'));
  console.log('¿Está en AuthScreen al inicio sin sesión?:', isAuthScreen);

  await browser.close();
}

testScreen().catch(console.error);
