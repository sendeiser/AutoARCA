import { chromium } from 'playwright';

const MOBILE_VIEWPORTS = [
  { name: 'iPhone 13/14', width: 390, height: 844 },
  { name: 'Android Galaxy', width: 360, height: 800 },
  { name: 'iPhone SE (Compact)', width: 375, height: 667 }
];

async function testMobileZeroScroll() {
  const browser = await chromium.launch({ headless: true });
  console.log('📱 Comprobando Zero-Scroll en múltiples resoluciones móviles...');

  for (const vp of MOBILE_VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await page.goto('http://localhost:5173/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForTimeout(400);

    // 1. Login Mode
    const loginCheck = await page.evaluate(() => {
      const left = document.querySelector('.uui-auth-left');
      const box = document.querySelector('.uui-auth-box');
      return {
        leftScroll: left ? left.scrollHeight > left.clientHeight : false,
        bodyScroll: document.body.scrollHeight > window.innerHeight,
        boxH: box?.getBoundingClientRect().height
      };
    });

    // 2. Register Client Mode
    await page.click('button[role="tab"]:has-text("Registrarse")');
    await page.waitForTimeout(300);

    const regClientCheck = await page.evaluate(() => {
      const left = document.querySelector('.uui-auth-left');
      const box = document.querySelector('.uui-auth-box');
      return {
        leftScroll: left ? left.scrollHeight > left.clientHeight : false,
        bodyScroll: document.body.scrollHeight > window.innerHeight,
        boxH: box?.getBoundingClientRect().height
      };
    });

    // 3. Register Accountant Mode
    await page.click('.uui-role-card:has-text("Estudio Contable")');
    await page.waitForTimeout(300);

    const regAccCheck = await page.evaluate(() => {
      const left = document.querySelector('.uui-auth-left');
      const box = document.querySelector('.uui-auth-box');
      return {
        leftScroll: left ? left.scrollHeight > left.clientHeight : false,
        bodyScroll: document.body.scrollHeight > window.innerHeight,
        boxH: box?.getBoundingClientRect().height
      };
    });

    console.log(`\n[${vp.name} (${vp.width}x${vp.height})]:`);
    console.log(`  - Login: ${!loginCheck.leftScroll && !loginCheck.bodyScroll ? '✅ CERO SCROLL' : '⚠️ SCROLL'} (Alt: ${loginCheck.boxH?.toFixed(0)}px)`);
    console.log(`  - Registro Comercio: ${!regClientCheck.leftScroll && !regClientCheck.bodyScroll ? '✅ CERO SCROLL' : '⚠️ SCROLL'} (Alt: ${regClientCheck.boxH?.toFixed(0)}px)`);
    console.log(`  - Registro Contador: ${!regAccCheck.leftScroll && !regAccCheck.bodyScroll ? '✅ CERO SCROLL' : '⚠️ SCROLL'} (Alt: ${regAccCheck.boxH?.toFixed(0)}px)`);

    await page.screenshot({ path: `playwright-screenshots/mobile-${vp.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png` });
    await page.close();
  }

  await browser.close();
  console.log('\n🎉 Verificación móvil completada con éxito.');
}

testMobileZeroScroll().catch(console.error);
