# Handoff: launch tasks for Claude Code or Claude Cowork

Repo: `Daveram64/mariposa-mobile-phlebotomy` (mirror: `Daveram64/mariposa-mobile-phlebotomy-5cad8`), branch `qa-fixes-launch`.

Rules for whoever works on this: no em-dashes anywhere in the site, keep every remaining `<!-- CONFIRM(...) -->` marker unless the fact is confirmed, run `node qa/checklist.js` after edits, and commit on `qa-fixes-launch`.

---

## Status as of 2026-09-16 (Cowork session with live-site access)

| Task | Status |
|---|---|
| 1. Real email | Done. `mariposaphlebotomymobile@gmail.com`, copied from the live site footer ("Contact us ... Email- mariposaphlebotomymobile@gmail.com"). Replaced in 49 places; `CONFIRM(Ellie Q10)` narrowed to the "one business day" reply promise, which is still unconfirmed. |
| 2. Real Squarespace slugs | Done. Pulled all 20 URLs from `https://www.mariposaphlebotomy.com/sitemap.xml`. Athlete is `/monarch-endur` (plus three older tier pages `/services-1`, `/nutrition`, `/elite-performance-blood-testing`); pediatric is `/autism-friendly`. Every published Squarespace page now has a 301 in both `_redirects` and `vercel.json`; the `Dave Q18` marker and the README "best guess" sentence are gone. |
| 3. Athlete tiers | Partly done, see below. The live page already defines the tiers, and two draft claims contradicted the live site, so those two were rewritten to the live wording. Tier names and analyte lists are handed back for Dave and Ellie. |
| Price discrepancy (was Dave Q20) | Resolved by Dave on 2026-09-16: the new site's prices stand (standard draw **$200**, autism-informed +$25). Markers removed. Follow-ups: (a) update the live Squarespace `/pricing` page and its FAQ schema to $200 before or at cutover, otherwise cached AI answers keep citing $175; (b) `CONFIRM(Dave Q21)`: the live list also has fertility/surrogate $150 and care-facility visits $175, which the new site does not price. |

## Task 3: athlete tier content (for Dave and Ellie to review)

What the live Squarespace page `/monarch-endur` already says, and therefore counts as confirmed:

- Brand: **MONARCH ENDUR by Mariposa Mobile Phlebotomy**. Lab: **Quest Diagnostics**. "All prices include the mobile draw and travel." "No referral is needed to book. Results are delivered securely and are intended to be reviewed with your healthcare or performance professional."
- Tier 1, **Performance Foundation, $450**: metabolic health markers, hydration status, stress response indicators, core performance metrics. For recreational athletes, first-time testing, off-season check-ins.
- Tier 2, **Nutrition & Recovery Intelligence, $550**: iron and nutrient status, vitamin levels (vitamin D and B vitamins), fatty acid balance, hydration and electrolyte markers. For endurance athletes, high-volume phases, plateaus.
- Tier 3, **Elite Performance Panel, $700**: recovery and inflammation markers, hormonal balance and stress response, muscle breakdown indicators, metabolic efficiency, hydration and nutrient status. For competitive athletes, quarterly tracking.

What changed on `/athlete-blood-draws/` in this session (all still under `CONFIRM(Ellie Q2)`):

- "Do I need a doctor's order? No. The packages include the lab order." was replaced in the FAQ and its schema with the live wording ("No referral is needed to book...") because a CPT-1 cannot authorize a lab order and the live site does not make that claim.
- "The package price covers the visit, the draw, and the lab fees for the panel. You don't pay the lab separately" was replaced with "Every package includes the mobile visit, the draw, and travel ... Specimens are processed through Quest Diagnostics." The live `/pricing` FAQ says lab processing fees, if any, are billed separately, so the old sentence contradicted it. The hero small print now says "travel included" instead of "panel included".
- Quest Diagnostics named in the lead and in step 3.

Still for Dave and Ellie to decide (edit the `<ul class="tiers">` block, the `Offer` names in that page's Service JSON-LD, the one-line summaries in `pricing/index.html`, `index.html` (services grid and FAQ answer 1), and `llms.txt` together):

| Draft on this site | Live Squarespace | Recommendation |
|---|---|---|
| Baseline $450: CBC + CMP, iron studies/ferritin, vitamin D | Performance Foundation $450: metabolic, hydration, stress response, core performance | Keep the live tier names (they carry the MONARCH ENDUR brand and have been indexed since July). The draft analytes are a reasonable reading of the live categories; Ellie confirms or edits. |
| Performance $550: testosterone, cortisol, thyroid, lipids, hs-CRP, magnesium, B12 | Nutrition & Recovery Intelligence $550: iron, vitamins D and B, fatty acids, electrolytes | Draft tier 2 is misaligned: it is a hormone/inflammation tier, but the live tier 2 is a nutrition tier. Move hormones, thyroid and hs-CRP to tier 3 and put iron, vitamins, fatty acids (omega-3 index) and electrolytes here. The FAQ "Which tier should I pick?" needs the same fix. |
| Complete $700: + estradiol, SHBG, DHEA-S, HbA1c, insulin, CK, folate, follow-up call | Elite Performance Panel $700: recovery/inflammation, hormones/stress, muscle breakdown (CK), metabolic efficiency, hydration/nutrients | Matches the live categories once hormones move here. The follow-up call is not on the live site; keep its marker until Ellie says yes. |
| "Book our 8am slot, or call about an earlier start" | nothing | `Ellie Q8`, unchanged. |
| Whether the panel (lab) fee is included in $450 to $700 | "prices include the mobile draw and travel"; pricing FAQ: lab fees, if any, billed separately | `Ellie Q2`. This is the single most important answer for this page: a $450 draw without the panel would be a very different offer. |

Once Ellie signs off, delete the `CONFIRM(Ellie Q2)` markers and run `node qa/checklist.js`.

## Also confirmed from the live site this session (useful for other markers)

- Autism-friendly page: Mariposa uses **Buzzy** (drug-free vibration and cold therapy device), does a pre-appointment prep conversation with parents, encourages a parent or caregiver present, and aims for "one gentle, successful draw". Ellie is also a **Certified Medical Assistant** with **5 years** of phlebotomy experience. Relevant to `Ellie Q4` (numbing cream and needle type are still unconfirmed) and to the pediatric page copy.
- Pricing page: "Hospital-grade specimen handling and same-day transport to the correct laboratory" and "detailed superbill on request". Athlete page: Quest Diagnostics. Relevant to `Ellie Q6` (labs delivered to; Quest confirmed, LabCorp not mentioned).
- Live site already has `/privacy-policy` and `/terms-and-conditions` pages (lastmod 2026-04-16); worth comparing with the new `/privacy/` and `/terms/` before launch so the two do not disagree.

## Already confirmed by Dave (September 2026)

- $50 late-cancel and no-draw fee: confirmed. Markers removed.

## Next run

```bash
node qa/checklist.js        # regenerates LAUNCH-CHECKLIST.md
npx http-server -p 8130 -s &  # then, in another shell:
node qa/verify.js           # all checks should pass
node qa/duo.js              # iPhone Duo matrix
```
