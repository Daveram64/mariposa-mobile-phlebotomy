# Mariposa Mobile Phlebotomy: website

Static marketing site for Mariposa Mobile Phlebotomy (certified in-home blood draws across the SF Bay Area).

- **No build step.** Plain HTML pages plus `assets/`. Deploy the repo root as-is.
- Scroll-scrubbed video scenes on the homepage, brand-kit styling (GFS Didot + Inter, Deep Plum palette), and AEO/SEO files (`robots.txt`, `sitemap.xml`, `llms.txt`, JSON-LD schema).
- Served entirely from the repo root: every asset reference is root-relative (`/assets/...`), so the site works the same from any subdirectory page.

## Pages

- `/` (`index.html`): the homepage, with the scroll scenes, the services and pricing grid, reviews, and the FAQ.
- `/pricing/`: the full price list, what every visit includes, insurance and superbill info, the cancellation policy, and the clinics and care-facility section.
- `/therapeutic-phlebotomy/`: in-home therapeutic phlebotomy (unit draws) for hemochromatosis, polycythemia vera, and similar provider orders.
- `/galleri-test-blood-draw/`: the Galleri multi-cancer early detection test draw, and how other mail-in kits are handled.
- `/athlete-blood-draws/`: the three athlete performance packages (Baseline, Performance, Complete).
- `/pediatric-blood-draws/`: pediatric and autism-informed, sensory-aware draws.
- `/privacy/`: the privacy policy, plus the HIPAA notice of privacy practices at `/privacy/#hipaa`.
- `/terms/`: terms of service and the cancellation policy, also linked at `/terms/#cancellation`.

Every page shares the same header, footer, and persistent Book button, and pulls its styling from `assets/site.css`.

## Deploy (Vercel or Netlify)

Import this repo. There is no framework and no build command; the output/publish directory is the repo root (`.`). Both hosts auto-detect a static site.

- `_redirects` is the Netlify redirect map.
- `vercel.json` is the equivalent Vercel configuration (`redirects`, plus `trailingSlash: true` and `cleanUrls: false` so every page keeps its trailing slash).

Both files encode the same two things:

1. Old Squarespace paths (`/pricing`, `/therapeutic-phlebotomy`, `/services`, `/faq`, and so on) redirecting 301 to the matching page or section on this site.
2. The old Squarespace domain (`mariposaphlebotomy.com` and `www.mariposaphlebotomy.com`), plus `www.localphlebotomy.com`, redirecting 301 to the apex `https://localphlebotomy.com`.

The old-path map was built from the live Squarespace sitemap on 2026-09-16 (20 URLs, including `/monarch-endur`, `/autism-friendly`, the three older athlete tier pages, `/privacy-policy`, `/terms-and-conditions`, `/llms`, `/blog` and `/store`). If a page is added on Squarespace before cutover, add it to both `_redirects` and `vercel.json`.

## Hosting headers

`_headers` (Netlify) and the `headers` key in `vercel.json` (Vercel) carry the same cache and security policy: files under `/assets/` are cached as `public, max-age=31536000, immutable`, HTML pages get `Cache-Control: public, max-age=0, must-revalidate`, and every route gets `X-Content-Type-Options`, `Referrer-Policy`, and `X-Frame-Options`. Because assets are cached as immutable, changing an asset's contents needs a renamed file (a new filename), not an overwrite of the old one, or caches will keep serving the old bytes for up to a year.

## Cutover to localphlebotomy.com

This is a fresh launch on a new domain, `localphlebotomy.com`, replacing the old `mariposaphlebotomy.com` Squarespace site. Steps:

1. Add `localphlebotomy.com` as the primary domain in the host's (Vercel or Netlify) domain settings, and point DNS at the host using the records it provides.
2. Add `mariposaphlebotomy.com` and `www.mariposaphlebotomy.com` as additional domains on the same project, pointed at the same host, so the `_redirects` and `vercel.json` rules above can 301 them to the new apex. Do the same for `www.localphlebotomy.com`.
3. Create a new Google Search Console property for `localphlebotomy.com` and submit `sitemap.xml`. Search Console properties do not carry over from the old domain automatically.
4. Update the website field on the Google Business Profile to `https://localphlebotomy.com/`.
5. Expect the site's current geo and directory citations (Yelp, Nextdoor, and similar) to reset or lag while they pick up the new domain. Update them as time allows; this is not a blocker for launch.
6. Before DNS actually moves, confirm every fact marked `CONFIRM(Ellie Q...)` in the page HTML with Ellie. See `LAUNCH-CHECKLIST.md` for the full list of what still needs her sign-off.

## Foldables and high-density screens

The layout is fluid with one breakpoint at 760px, plus a 600px to 760px range that keeps the section links in the header (iPhone Duo unfolded is 626px wide; folded is 466px). Every raster asset is exported for 3x displays: the logo ships a 2x `srcset`, the founder photo is 480px for an 88px slot, and the video posters are 1280px or wider. `qa/duo.js` checks both Duo viewports and the fold transition.

## Local preview

Any static file server works, for example:

```bash
npx http-server -p 8080
```
