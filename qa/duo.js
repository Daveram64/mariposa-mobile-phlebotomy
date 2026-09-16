// iPhone Duo matrix: folded 466x678 and unfolded 626x890, both DPR 3, plus a live fold/unfold resize mid-scroll.
const { chromium } = require('playwright');
const BASE = 'http://127.0.0.1:8130'; process.chdir(require('os').tmpdir());
const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const pages = ['/', '/pricing/', '/therapeutic-phlebotomy/', '/galleri-test-blood-draw/', '/athlete-blood-draws/', '/pediatric-blood-draws/', '/privacy/', '/terms/'];
const vps = { folded: { width: 466, height: 678 }, unfolded: { width: 626, height: 890 } };
let fails = 0;
function rec(ok, id, detail) { if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + id + '  ' + detail); }
(async () => {
  const browser = await chromium.launch({ executablePath: EXE, args: ['--ignore-certificate-errors'] });
  for (const [name, vp] of Object.entries(vps)) {
    for (const url of pages) {
      const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
      const p = await ctx.newPage();
      const errs = [];
      p.on('console', m => { if (m.type() === 'error' && !/fonts\.g|ERR_CERT|ERR_ABORTED/.test(m.text())) errs.push(m.text()); });
      p.on('pageerror', e => errs.push(e.message));
      await p.goto(BASE + url, { waitUntil: 'networkidle' });
      await p.waitForTimeout(500);
      // scroll through the whole page, sampling overflow and tap targets
      const total = await p.evaluate(() => document.documentElement.scrollHeight);
      let overflow = false, smallTargets = new Set(), telGaps = 0, samples = 0;
      for (let y = 0; y <= total; y += Math.max(300, Math.round(total / 30))) {
        await p.evaluate(y => window.scrollTo(0, y), y); await p.waitForTimeout(40);
        const r = await p.evaluate(() => {
          const ov = document.documentElement.scrollWidth > window.innerWidth + 1;
          const small = [];
          document.querySelectorAll('a,button').forEach(el => {
            const b = el.getBoundingClientRect(); const cs = getComputedStyle(el);
            if (b.width === 0 || b.height === 0 || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.5) return;
            if (b.bottom < 0 || b.top > innerHeight) return;
            if (el.closest('p, li.faq__item, .prose, .faq__item, .pricing__list, .foot__clinics, .cta__note, .crumbs')) return;
            if (b.height < 44 && b.width < 44) small.push((el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30) + ' ' + Math.round(b.width) + 'x' + Math.round(b.height));
          });
          const tel = Array.from(document.querySelectorAll('a[href^="tel:"]')).some(a => { const b = a.getBoundingClientRect(); const cs = getComputedStyle(a); return b.width > 0 && b.bottom > 0 && b.top < innerHeight && cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0.5; });
          return { ov, small, tel };
        });
        if (r.ov) overflow = true; r.small.forEach(s => smallTargets.add(s)); samples++; if (!r.tel) telGaps++;
      }
      const logo = await p.evaluate(() => { const i = document.querySelector('.site-nav__brand img'); return i ? (i.currentSrc || i.src).split('/').pop() + ' @' + Math.round(i.getBoundingClientRect().width * devicePixelRatio) + 'dpx' : 'none'; });
      const hero = url === '/' ? await p.evaluate(() => { const v = document.getElementById('heroVideo'); return (v.currentSrc || v.src).split('/').pop(); }) : '';
      rec(errs.length === 0 && !overflow && smallTargets.size === 0 && telGaps === 0, name + ' ' + url, JSON.stringify({ errs, overflow, small: [...smallTargets], telGaps: telGaps + '/' + samples, logo, hero, height: total }));
      if (url === '/' ) await p.screenshot({ path: 'duo-' + name + '-home.png' });
      if (url === '/pricing/') await p.screenshot({ path: 'duo-' + name + '-pricing.png' });
      await ctx.close();
    }
  }
  // live fold/unfold mid-scroll on the homepage: resize 466 -> 626 -> 466 while pinned scenes are active
  const ctx = await browser.newContext({ viewport: vps.folded, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + '/', { waitUntil: 'networkidle' });
  for (const frac of [0.3, 0.6, 0.85]) {
    await p.evaluate(f => { const s = document.getElementById('services'); window.scrollTo(0, s.offsetTop + (s.offsetHeight - innerHeight) * f); }, frac);
    await p.waitForTimeout(200);
    for (const vp of [vps.unfolded, vps.folded, vps.unfolded]) {
      await p.setViewportSize(vp); await p.waitForTimeout(350);
      const r = await p.evaluate(() => { const w = document.getElementById('s2window').getBoundingClientRect(); const ov = document.documentElement.scrollWidth > innerWidth + 1; const bad = [w.left, w.top, w.width, w.height].some(n => !isFinite(n)); return { ov, bad, win: [w.left, w.top, w.width, w.height].map(Math.round), nav: document.querySelector('.site-nav').getBoundingClientRect().width }; });
      rec(!r.ov && !r.bad && r.nav === vp.width, 'fold-transition services@' + frac + ' -> ' + vp.width, JSON.stringify(r));
    }
  }
  await p.evaluate(() => { const s = document.getElementById('trust'); window.scrollTo(0, s.offsetTop + (s.offsetHeight - innerHeight) * 0.9); }); await p.waitForTimeout(300);
  await p.setViewportSize(vps.folded); await p.waitForTimeout(400);
  const t = await p.evaluate(() => { const b = document.getElementById('tbeat2'); const ov = document.documentElement.scrollWidth > innerWidth + 1; return { ov, beat2op: getComputedStyle(b.children[0]).opacity, vt: document.getElementById('trustVideo').style.transform }; });
  rec(!t.ov && parseFloat(t.beat2op) > 0.9, 'fold-transition trust beat2 after fold', JSON.stringify(t));
  rec(errs.length === 0, 'fold-transition pageerrors', errs.join(' | ') || 'none');
  await p.screenshot({ path: 'duo-fold-trust.png' });
  await browser.close();
  console.log(fails ? fails + ' FAILED' : 'ALL PASS');
  process.exit(fails ? 1 : 0);
})();
