import { chromium } from 'playwright';

async function check() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto('http://localhost:5173/');
  await page.evaluate(() => {
    localStorage.clear();
    document.documentElement.setAttribute('data-theme', 'light');
    document.body.setAttribute('data-theme', 'light');
  });
  await page.reload();
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    document.body.setAttribute('data-theme', 'light');
  });

  const styles = await page.evaluate(() => {
    const el = document.querySelector('.uui-input-box');
    if (!el) return 'No el';
    const cs = window.getComputedStyle(el);
    return {
      background: cs.backgroundColor,
      color: cs.color,
      borderColor: cs.borderColor
    };
  });

  console.log('Estilos computados de .uui-input-box en modo light:', styles);
  await browser.close();
}

check().catch(console.error);
