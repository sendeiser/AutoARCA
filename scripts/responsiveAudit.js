import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const VIEWPORTS = [
  { name: 'mobile_360', width: 360, height: 740 },
  { name: 'mobile_390', width: 390, height: 844 },
  { name: 'tablet_768', width: 768, height: 1024 },
  { name: 'laptop_1024', width: 1024, height: 768 },
  { name: 'desktop_1440', width: 1440, height: 900 }
];

const OUTPUT_DIR = path.resolve('./audit_screenshots');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function auditViewports() {
  const browser = await chromium.launch({ headless: true });
  const report = [];

  for (const vp of VIEWPORTS) {
    console.log(`\n========================================`);
    console.log(`AUDITING VIEWPORT: ${vp.name} (${vp.width}x${vp.height})`);
    console.log(`========================================`);

    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height }
    });
    const page = await context.newPage();

    try {
      await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(1000);

      // Check Body Horizontal Overflow
      const overflowInfo = await page.evaluate(() => {
        const docWidth = document.documentElement.scrollWidth;
        const winWidth = window.innerWidth;
        const hasOverflow = docWidth > winWidth + 1;

        // Find elements wider than window
        const wideElements = [];
        const all = document.querySelectorAll('*');
        for (const el of all) {
          const rect = el.getBoundingClientRect();
          if (rect.width > winWidth + 2) {
            const tag = el.tagName.toLowerCase();
            const cls = el.className ? `.${String(el.className).replace(/\s+/g, '.')}` : '';
            const id = el.id ? `#${el.id}` : '';
            wideElements.push({
              selector: `${tag}${id}${cls}`,
              width: Math.round(rect.width),
              scrollWidth: el.scrollWidth,
              windowWidth: winWidth
            });
          }
        }
        return { hasOverflow, docWidth, winWidth, wideElements: wideElements.slice(0, 10) };
      });

      console.log(`Viewport: ${vp.name} -> Body scrollWidth: ${overflowInfo.docWidth}px, window: ${overflowInfo.winWidth}px. Overflow: ${overflowInfo.hasOverflow}`);
      if (overflowInfo.wideElements.length > 0) {
        console.log(`Wide elements detected:`, JSON.stringify(overflowInfo.wideElements, null, 2));
      }

      // Screenshot 1: Initial View
      const shot1 = path.join(OUTPUT_DIR, `${vp.name}_01_initial.png`);
      await page.screenshot({ path: shot1, fullPage: false });

      // Click on ¿Cómo funciona? to check modal responsiveness
      const guideBtn = page.locator('[data-testid="system-guide-btn"]');
      if (await guideBtn.isVisible()) {
        await guideBtn.click();
        await page.waitForTimeout(600);

        const modalOverflow = await page.evaluate(() => {
          const modalBox = document.querySelector('.uui-modal-box');
          if (!modalBox) return null;
          const rect = modalBox.getBoundingClientRect();
          return {
            modalWidth: Math.round(rect.width),
            windowWidth: window.innerWidth,
            overflows: rect.width > window.innerWidth
          };
        });
        console.log(`Modal in ${vp.name}:`, modalOverflow);

        const shotModal = path.join(OUTPUT_DIR, `${vp.name}_02_guide_modal.png`);
        await page.screenshot({ path: shotModal, fullPage: false });

        // Close modal
        const closeBtn = page.locator('.uui-modal-close-btn, text="Entendido, Continuar"').first();
        if (await closeBtn.isVisible()) {
          await closeBtn.click();
          await page.waitForTimeout(400);
        }
      }

      // Check Accountant Portal if available or check Navigation
      report.push({ viewport: vp.name, overflowInfo });
    } catch (err) {
      console.error(`Error in ${vp.name}:`, err.message);
    } finally {
      await context.close();
    }
  }

  await browser.close();
  console.log('\nAudit completed! Results saved to ./audit_screenshots');
}

auditViewports().catch(console.error);
