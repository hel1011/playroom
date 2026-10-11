// Renders the store icon and splash art from Pip's drawing in the web app.
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
const here = path.resolve(import.meta.dirname, '..'), html = fs.readFileSync(path.join(here, '..', 'index.html'), 'utf8');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 2732, height: 2732 } });
await p.route('http://app.test/**', r => r.fulfill({ status: 200, body: html, contentType: 'text/html; charset=utf-8' }));
await p.goto('http://app.test/'); await p.waitForTimeout(300);
const art = await p.evaluate(() => document.querySelector('svg.pip').innerHTML);
const BG = 'radial-gradient(circle at 50% 38%, #ffffff 0, #cfeefb 45%, #8fd3ff 100%)';
async function shot(name, size, { bg = BG, pip = .8, perch = true, transparent = false } = {}) {
  await p.setViewportSize({ width: size, height: size });
  await p.setContent(`<html><body style="margin:0;background:transparent"><div id="i" style="width:${size}px;height:${size}px;background:${bg};display:flex;align-items:center;justify-content:center;position:relative">
    ${perch ? `<div style="position:absolute;left:${50 - pip * 47.5}%;right:${50 - pip * 47.5}%;top:${50 + pip * 37}%;height:${size * pip * .0625}px;border-radius:99px;background:#9a6a3c"></div>` : ''}
    ${pip ? `<svg viewBox="0 0 100 100" style="width:${size * pip}px;height:${size * pip}px;position:relative">${art}</svg>` : ''}</div></body></html>`);
  await p.addStyleTag({ content: '*{animation:none!important}' });
  await p.locator('#i').screenshot({ path: path.join(here, 'assets', name), omitBackground: transparent });
}
await shot('icon-only.png', 1024);                                                   // App Store / iOS icon: square, no transparency
await shot('icon-foreground.png', 1024, { bg: 'transparent', pip: .56, transparent: true }); // Android adaptive icon: Pip inside the safe zone
await shot('icon-background.png', 1024, { pip: 0, perch: false });
await shot('splash.png', 2732, { bg: '#e3f3fb', pip: .26 });
await shot('splash-dark.png', 2732, { bg: '#e3f3fb', pip: .26 });
await b.close(); console.log('assets ready');
