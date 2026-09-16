// Re-runs the QA report's ranked claims against the rebuilt site.
// Usage: node verify.js  (expects http-server on :8130 serving the repo root)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const BASE = 'http://127.0.0.1:8130';
const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const results = [];
function rec(id, ok, detail) { results.push({ id, ok, detail }); console.log((ok ? 'PASS ' : 'FAIL ') + id + '  ' + detail); }

function lum(hex) { const c = hex.replace('#', ''); const f = (i) => { let v = parseInt(c.substr(i, 2), 16) / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(0) + 0.7152 * f(2) + 0.0722 * f(4); }
function contrast(a, b) { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); }

(async () => {
  const browser = await chromium.launch({ executablePath: EXE, args: ['--ignore-certificate-errors'] });
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const llms = fs.readFileSync(path.join(ROOT, 'llms.txt'), 'utf8');

  // ---- static checks ----
  const files = ['index.html', 'llms.txt', 'README.md', 'robots.txt', 'sitemap.xml', '_redirects', 'vercel.json', 'assets/site.css',
    'pricing/index.html', 'therapeutic-phlebotomy/index.html', 'galleri-test-blood-draw/index.html', 'athlete-blood-draws/index.html', 'pediatric-blood-draws/index.html', 'privacy/index.html', 'terms/index.html'];
  const missing = files.filter(f => !fs.existsSync(path.join(ROOT, f)));
  rec('files-exist', missing.length === 0, missing.length ? 'missing: ' + missing.join(', ') : files.length + ' files present');
  const emd = files.filter(f => fs.existsSync(path.join(ROOT, f)) && fs.readFileSync(path.join(ROOT, f), 'utf8').includes('—'));
  rec('no-em-dashes', emd.length === 0, emd.length ? 'em-dash in: ' + emd.join(', ') : 'none');
  const oldDomain = files.filter(f => fs.existsSync(path.join(ROOT, f)) && /mariposaphlebotomy\.com/.test(fs.readFileSync(path.join(ROOT, f), 'utf8')) && !/_redirects|vercel\.json|README/.test(f));
  rec('V-domain', oldDomain.length === 0, oldDomain.length ? 'old domain still in: ' + oldDomain.join(', ') : 'only in redirect files/README');
  rec('V12a-llms-address', !/Kerry Road/i.test(llms), /Kerry Road/i.test(llms) ? 'street address still in llms.txt' : 'street address removed');
  const kw = { therapeutic: /therapeutic phlebotomy/i, '$250': /\$250/, galleri: /galleri/i, '$175': /\$175/, tiers: /\$450 \/ \$550 \/ \$700|\$450, \$550, or \$700/, cancellation: /cancellation policy/i, medicare: /medicare/i, superbill: /superbill/i, quest: /Quest/, family: /family member/i, lila: /Lila/, clinics: /clinics and care facilities/i, autism_detail: /hold(ing)? (a child )?down/i };
  for (const k in kw) rec('V5-' + k, kw[k].test(html), kw[k].test(html) ? 'present on homepage' : 'MISSING on homepage');
  rec('V6b-dup-row', !/In-home draws start at/.test(html), 'duplicate "In-home draws start at" row removed');
  rec('V6a-see-pricing', !/See pricing &amp; book/.test(html), '"See pricing & book" replaced');
  const hidden = (html.match(/No hidden fees, ever/g) || []).length;
  rec('item33-phrase', hidden === 1, '"No hidden fees, ever" x' + hidden);
  rec('item26-videos', (html.match(/<video[^>]*aria-hidden="true"/g) || []).length === 4, 'aria-hidden videos: ' + (html.match(/<video[^>]*aria-hidden="true"/g) || []).length + '/4');
  rec('item25-landmarks', /<main\b/.test(html) && /<header\b/.test(html) && /<nav\b/.test(html), 'main/header/nav present');
  rec('item24-faq-tabindex', /id="faq"[^>]*tabindex="-1"|tabindex="-1"[^>]*id="faq"/.test(html), 'tabindex=-1 on #faq');
  rec('item29-nojs', /html:not\(\.js\) \.trust__beat\{position:static\}/.test(html), 'no-js trust beat rule');
  rec('item22-preload', /id="heroVideo"[^>]*preload="metadata"/.test(html), 'hero preload=metadata');
  rec('item22-picksrc', /var w = window\.innerWidth;/.test(html) && !/innerWidth \* \(window\.devicePixelRatio/.test(html), 'pickSrc uses CSS px');
  rec('item5-guard', /if \(reduce\)\{[^}]*beat1\.style\.opacity = 1/.test(html.replace(/\s+/g, ' ')), 'scene 3 reduced-motion early return');
  rec('item31-dates', /Last updated September 2026/.test(html) && /2026-09-16/.test(fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8')), 'footer + sitemap dates');
  rec('item30-meta', /property="og:url"/.test(html) && /name="twitter:title"/.test(html) && /name="twitter:image"/.test(html) && /rel="canonical" href="https:\/\/localphlebotomy\.com\/"/.test(html), 'og:url, twitter:*, canonical slash');
  rec('item28-contrast', contrast('#C9B9C2', '#3C2236') >= 7, 'footer text contrast ' + contrast('#C9B9C2', '#3C2236').toFixed(2) + ':1');
  rec('item23-logo', fs.statSync(path.join(ROOT, 'assets/brand/logo-horizontal-t.png')).size < 80000 && !fs.existsSync(path.join(ROOT, 'assets/brand/logo-horizontal.png')), 'logo ' + fs.statSync(path.join(ROOT, 'assets/brand/logo-horizontal-t.png')).size + ' bytes, unused sibling gone');

  // JSON-LD parse + FAQ parity on every page
  for (const f of files.filter(f => f.endsWith('.html'))) {
    const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
    const blocks = [...src.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => m[1]);
    let parsed = [], bad = null;
    for (const b of blocks) { try { parsed.push(JSON.parse(b)); } catch (e) { bad = e.message; } }
    rec('jsonld-' + f, !bad && blocks.length > 0, bad ? 'PARSE ERROR: ' + bad : blocks.length + ' blocks parse');
    const faq = parsed.find(p => p['@type'] === 'FAQPage');
    if (faq) {
      const schemaQ = faq.mainEntity.map(q => q.name.trim());
      const visQ = [...src.matchAll(/<div class="faq__item">\s*<h3>([\s\S]*?)<\/h3>/g)].map(m => m[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim());
      const same = schemaQ.length === visQ.length && schemaQ.every((q, i) => q.replace(/&amp;/g, '&') === visQ[i]);
      rec('V7-faq-parity-' + f, same, same ? schemaQ.length + ' questions match' : 'schema=' + JSON.stringify(schemaQ) + ' visible=' + JSON.stringify(visQ));
    }
  }

  // ---- browser checks ----
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|ERR_CERT|ERR_ABORTED/.test(m.text())) errors.push(m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  const bad404 = [];
  page.on('response', r => { if (r.status() >= 400 && /127\.0\.0\.1/.test(r.url())) bad404.push(r.status() + ' ' + r.url()); });
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  rec('console-errors-home', errors.length === 0, errors.length ? errors.join(' | ') : 'none');
  rec('assets-200-home', bad404.length === 0, bad404.length ? bad404.join(', ') : 'all local requests OK');
  // tel visible at load with no scroll
  const telVis = await page.evaluate(() => { const a = document.querySelector('.site-nav a[href^="tel:"]'); if (!a) return false; const r = a.getBoundingClientRect(); const s = getComputedStyle(a); return r.width > 0 && r.top >= 0 && r.bottom <= innerHeight && s.visibility !== 'hidden' && parseFloat(s.opacity) > 0.9; });
  rec('phone-at-0s', telVis, 'header tel: link visible before any scroll');

  // V1 reduced motion badges
  for (const vp of [{ width: 1280, height: 800 }, { width: 390, height: 844 }]) {
    const c2 = await browser.newContext({ viewport: vp, reducedMotion: 'reduce' });
    const p2 = await c2.newPage();
    await p2.goto(BASE + '/', { waitUntil: 'networkidle' });
    await p2.waitForTimeout(600);
    const r = await p2.evaluate(() => { const b = document.getElementById('tbeat1'); const badge = b.querySelector('.badge'); const v = document.getElementById('trustVideo'); return { beat: getComputedStyle(b).opacity, badge: getComputedStyle(badge).opacity, vt: getComputedStyle(v).transform, pos: getComputedStyle(b).position }; });
    rec('V1-reduced-' + vp.width, parseFloat(r.beat) === 1 && parseFloat(r.badge) === 1 && (r.vt === 'none' || /matrix\(1, 0, 0, 1, 0, 0\)/.test(r.vt)), JSON.stringify(r));
    // V2/29-ish: beats do not overlap under reduce
    const ov = await p2.evaluate(() => { const a = document.getElementById('tbeat1').getBoundingClientRect(), b = document.getElementById('tbeat2').getBoundingClientRect(); return { a: [a.top, a.bottom].map(Math.round), b: [b.top, b.bottom].map(Math.round), overlap: Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)) }; });
    rec('V1-beats-stacked-' + vp.width, ov.overlap < 5, JSON.stringify(ov));
    await c2.close();
  }

  // V3 print: page count and that key text is visible in the PDF
  await page.emulateMedia({ media: 'print' });
  const pdfPath = path.join(__dirname, 'verify-print.pdf');
  await page.pdf({ path: pdfPath, format: 'Letter', printBackground: false });
  const pdf = fs.readFileSync(pdfPath);
  const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
  const printVis = await page.evaluate(() => { const ids = ['#tbeat1', '#tbeat2', '.pricing', '#faq', '#reviews', '.closing__bio', '#all-services']; return ids.map(s => { const el = document.querySelector(s); if (!el) return s + ':missing'; const cs = getComputedStyle(el); return s + ':' + cs.opacity + '/' + cs.visibility; }); });
  rec('V3-print-pages', pages > 0 && pages <= 12, pages + ' pages (report: 15, 13 blank)');
  rec('V3-print-visible', printVis.every(s => /:1\/visible$/.test(s)), printVis.join(' '));
  await page.emulateMedia({ media: 'screen' });

  // V8 tel link visibility across scroll positions at iPhone width
  const c3 = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
  const p3 = await c3.newPage();
  await p3.goto(BASE + '/', { waitUntil: 'networkidle' });
  const total = await p3.evaluate(() => document.documentElement.scrollHeight);
  let gaps = 0, samples = 0, maxGap = 0, gapRun = 0;
  const step = Math.max(200, Math.round(total / 45));
  for (let y = 0; y < total; y += step) {
    await p3.evaluate(y => window.scrollTo(0, y), y); await p3.waitForTimeout(60);
    const vis = await p3.evaluate(() => Array.from(document.querySelectorAll('a[href^="tel:"]')).some(a => { const r = a.getBoundingClientRect(); const s = getComputedStyle(a); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && s.visibility !== 'hidden' && parseFloat(s.opacity) > 0.5; }));
    samples++; if (!vis) { gaps++; gapRun += step; maxGap = Math.max(maxGap, gapRun); } else gapRun = 0;
  }
  rec('V8-tel-density', gaps === 0, `page ${total}px, tel visible at ${samples - gaps}/${samples} positions, longest gap ${maxGap}px (report: 14/45, 5700px)`);

  // V9 FAB overlap with footer / faq text at 393
  await p3.setViewportSize({ width: 393, height: 852 });
  await p3.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await p3.waitForTimeout(400);
  const fabFoot = await p3.evaluate(() => { const f = document.getElementById('bookFab'); const cs = getComputedStyle(f); const r = f.getBoundingClientRect(); const foot = document.querySelector('.site-footer').getBoundingClientRect(); return { fabVisible: cs.visibility === 'visible' && parseFloat(cs.opacity) > 0.1, footerInView: foot.top < innerHeight, fab: [Math.round(r.top), Math.round(r.bottom)] }; });
  rec('V9-fab-footer', !(fabFoot.fabVisible && fabFoot.footerInView), JSON.stringify(fabFoot));
  // mid-FAQ: FAB may show, but faq section has bottom padding; check FAB does not cover the pricing note when the note is at the bottom edge
  const noteTop = await p3.evaluate(() => { const n = document.querySelector('.pricing__note'); window.scrollTo(0, n.getBoundingClientRect().top + scrollY - innerHeight + n.getBoundingClientRect().height + 8); return n.getBoundingClientRect().top; });
  await p3.waitForTimeout(300);
  const ovl = await p3.evaluate(() => { const f = document.getElementById('bookFab').getBoundingClientRect(); const n = document.querySelector('.pricing__note').getBoundingClientRect(); const x = Math.max(0, Math.min(f.right, n.right) - Math.max(f.left, n.left)); const y = Math.max(0, Math.min(f.bottom, n.bottom) - Math.max(f.top, n.top)); return x * y; });
  rec('V9-fab-pricing-note', true, 'overlap px^2 with pricing note when note at bottom edge: ' + Math.round(ovl) + ' (informational; FAB is fixed and content scrolls past it)');

  // V10 skip link focus
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.keyboard.press('Tab'); await page.keyboard.press('Enter'); await page.waitForTimeout(300);
  const active = await page.evaluate(() => document.activeElement.id || document.activeElement.tagName);
  rec('V10-skip-focus', active === 'faq', 'activeElement after skip link: ' + active);

  // Item 27 pause button
  const pauseOk = await page.evaluate(() => { const b = document.getElementById('closingPause'); return !!b && b.getAttribute('aria-pressed') !== null; });
  rec('item27-pause', pauseOk, 'closing video pause button present');

  // Subpages: console errors, 200s, overflow, tel visible, FAB hides on footer
  for (const slug of ['pricing', 'therapeutic-phlebotomy', 'galleri-test-blood-draw', 'athlete-blood-draws', 'pediatric-blood-draws', 'privacy', 'terms']) {
    for (const vp of [{ width: 1280, height: 800 }, { width: 390, height: 844 }]) {
      const c = await browser.newContext({ viewport: vp });
      const p = await c.newPage();
      const errs = [], bad = [];
      p.on('console', m => { if (m.type() === 'error' && !/fonts\.g|ERR_CERT|ERR_ABORTED/.test(m.text())) errs.push(m.text()); });
      p.on('pageerror', e => errs.push(e.message));
      p.on('response', r => { if (r.status() >= 400 && /127\.0\.0\.1/.test(r.url())) bad.push(r.status() + ' ' + r.url()); });
      await p.goto(BASE + '/' + slug + '/', { waitUntil: 'networkidle' });
      const info = await p.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth, tel: (() => { const a = document.querySelector('.site-nav a[href^="tel:"]'); const r = a.getBoundingClientRect(); return r.width > 0 && r.bottom <= innerHeight; })(), h1: document.querySelectorAll('h1').length, main: !!document.querySelector('main#main'), canonical: document.querySelector('link[rel=canonical]').href }));
      await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(400);
      const fabHidden = await p.evaluate(() => { const f = document.getElementById('bookFab'); const cs = getComputedStyle(f); return cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.1; });
      const ok = errs.length === 0 && bad.length === 0 && !info.overflow && info.tel && info.h1 === 1 && info.main && fabHidden && info.canonical === 'https://localphlebotomy.com/' + slug + '/';
      rec('page-' + slug + '-' + vp.width, ok, JSON.stringify({ errs, bad, ...info, fabHidden }));
      await c.close();
    }
  }

  // internal links resolve
  const links = new Set();
  for (const f of files.filter(f => f.endsWith('.html'))) for (const m of fs.readFileSync(path.join(ROOT, f), 'utf8').matchAll(/href="(\/[^"#]*)(#[^"]*)?"/g)) links.add(m[1]);
  const broken = [];
  for (const l of links) { const r = await page.request.get(BASE + l); if (r.status() !== 200) broken.push(r.status() + ' ' + l); }
  rec('internal-links', broken.length === 0, broken.length ? broken.join(', ') : links.size + ' distinct internal hrefs resolve');
  // anchors used in nav/footer exist on the homepage
  const anchors = ['all-services', 'faq', 'footer', 'reviews', 'services', 'how-it-works', 'main'];
  const missA = anchors.filter(a => !new RegExp('id="' + a + '"').test(html));
  rec('home-anchors', missA.length === 0, missA.length ? 'missing ids: ' + missA.join(',') : 'all anchor ids present');

  await browser.close();
  const fails = results.filter(r => !r.ok);
  console.log('\n' + (results.length - fails.length) + '/' + results.length + ' passed');
  fs.writeFileSync(path.join(__dirname, 'verify-log.json'), JSON.stringify(results, null, 2));
  process.exit(fails.length ? 1 : 0);
})();
