# Mariposa Mobile Phlebotomy — website

Static, single-page marketing site for Mariposa Mobile Phlebotomy (certified in-home blood draws across the SF Bay Area).

- **No build step.** Plain `index.html` + `assets/`. Deploy the repo root as-is.
- Scroll-scrubbed video scenes, brand-kit styling (GFS Didot + Inter, Deep Plum palette), and AEO/SEO files (`robots.txt`, `sitemap.xml`, `llms.txt`, JSON-LD schema).

## Deploy (Vercel or Netlify)

Import this repo — no framework, no build command, output/publish directory = repo root (`.`). Both auto-detect a static site.

## Custom domain

Add `mariposaphlebotomy.com` in the host's domain settings, then point DNS at the host (records provided by Vercel/Netlify). This replaces the current Squarespace site once DNS propagates.
