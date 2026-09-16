# Handoff: three launch tasks for Claude Code or Claude Cowork

Repo: `Daveram64/mariposa-mobile-phlebotomy` (mirror: `Daveram64/mariposa-mobile-phlebotomy-5cad8`), branch `qa-fixes-launch`.
The cloud session that built this branch could not reach `mariposaphlebotomy.com` (egress proxy), so these three items need a session with normal internet access, or Dave pasting the values in.

Rules for whoever does this: no em-dashes anywhere in the site, keep every remaining `<!-- CONFIRM(...) -->` marker unless the fact is confirmed, run `node qa/checklist.js` after edits, and commit on `qa-fixes-launch`.

---

## Task 1: replace the placeholder email

`care@localphlebotomy.com` is a placeholder. It appears 26 times across the site (footer on every page, homepage services grid, pricing page clinics section, privacy and terms contact sections, `llms.txt`, and the MedicalBusiness schema `email` field in `index.html`).

1. Get the real address: it is on the current Squarespace site at `https://www.mariposaphlebotomy.com/` (contact section or footer), or Dave supplies it.
2. Replace every occurrence in one pass from the repo root:

```bash
grep -rl "care@localphlebotomy.com" --include=*.html --include=*.txt --include=*.md . | xargs sed -i 's/care@localphlebotomy\.com/REAL_ADDRESS_HERE/g'
grep -rn "care@localphlebotomy.com" . ; echo "expect no output"
```

3. Delete the `<!-- CONFIRM(Ellie Q10): clinics email address ... -->` marker in `pricing/index.html` once the address is real.

## Task 2: real Squarespace slugs for the athlete and pediatric pages

`_redirects` (Netlify) and `vercel.json` (Vercel) 301 the old Squarespace paths to the new pages. Three of the five old paths are known from the QA report (`/pricing`, `/therapeutic-phlebotomy`, `/galleri-test-blood-draw`). The athlete and pediatric ones are guesses (`/athlete-performance`, `/pediatric`).

1. Open `https://www.mariposaphlebotomy.com/sitemap.xml` and copy every `<loc>` path. Squarespace sitemaps list every published page.
2. In `_redirects`, replace the guessed sources so they match the real paths. Keep the destinations:

```
/<real-athlete-slug>      /athlete-blood-draws/      301
/<real-pediatric-slug>    /pediatric-blood-draws/    301
```

   Add a line for any other Squarespace page in the sitemap that is not already mapped (for example a `/contact` or `/about` page), pointing at the closest new page or section (`/#footer`, `/#faq`, `/#all-services`, `/#reviews`).
3. Mirror the same changes in the `redirects` array of `vercel.json` (`source` is the old path, `destination` the new one, `permanent: true`). Validate with `node -e "JSON.parse(require('fs').readFileSync('vercel.json','utf8'))"`.
4. Remove the `# CONFIRM(Dave Q18)` comment at the top of `_redirects` and the matching sentence in `README.md` ("The athlete and pediatric slugs in that old-path map are a best guess...").

## Task 3: athlete tier content (for Dave and Ellie to review)

The three tiers on `/athlete-blood-draws/` were drafted so the page reads complete. Prices come from the QA report; the analyte lists and "panel included" are proposals. Edit the page directly, or hand this table back with corrections.

| Tier | Price | Who it is for | Included (draft) |
|---|---|---|---|
| Baseline | $450 | A first look, or an off-season checkpoint. | Complete blood count and comprehensive metabolic panel · Iron studies with ferritin · Vitamin D · Fasted draw at home, first slot of the morning · Results in your lab portal within a few days |
| Performance | $550 | In-season monitoring for endurance and strength athletes. | Everything in Baseline · Testosterone (total and free) and cortisol · Thyroid panel (TSH, free T4, free T3) · Lipid panel and hs-CRP · Magnesium and vitamin B12 |
| Complete | $700 | The full picture before a big block or a big race. | Everything in Performance · Estradiol, SHBG, DHEA-S · HbA1c and fasting insulin · Creatine kinase (CK) and folate · A follow-up call to walk through what changed since last time |

Statements on that page that depend on Ellie's answer (each has a `CONFIRM(Ellie Q2)` marker above it in `athlete-blood-draws/index.html`):

- "The package price covers the visit, the draw, and the lab fees for the panel. You don't pay the lab separately and there are no add-on charges."
- "Do I need a doctor's order? No. The packages include the lab order."
- The follow-up call in the Complete tier.
- "Book our 8am slot, or call about an earlier start" (this one is `Q8`, shared with the pediatric and FAQ hours copy).

Where the tier copy lives: the `<ul class="tiers">` block in `athlete-blood-draws/index.html`, the matching `Offer` entries in that page's `Service` JSON-LD, the one-line summaries in `pricing/index.html`, `index.html` (services grid and FAQ answer 1), and `llms.txt`. If a price changes, change it in all five places.

Once Ellie signs off, delete the `CONFIRM(Ellie Q2)` markers and run `node qa/checklist.js`.

---

## Already confirmed by Dave (September 2026)

- $50 late-cancel and no-draw fee: confirmed. Markers removed.

## After the three tasks

```bash
node qa/checklist.js        # regenerates LAUNCH-CHECKLIST.md
npx http-server -p 8130 -s &  # then, in another shell:
node qa/verify.js           # 75 checks, all should pass
node qa/duo.js              # iPhone Duo matrix
git add -A && git commit -m "Real email and Squarespace slugs; athlete tiers reviewed" && git push origin qa-fixes-launch
```
