// Generates LAUNCH-CHECKLIST.md from every <!-- CONFIRM(...) --> / # CONFIRM(...) marker in the repo.
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const files = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (e.name.startsWith('.') || e.name === 'node_modules' || e.name === 'assets') continue; const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (/\.(html|txt|md|json)$|_redirects$/.test(e.name) && e.name !== 'LAUNCH-CHECKLIST.md') files.push(p); } })(ROOT);
const byQ = {};
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8').split('\n');
  src.forEach((line, i) => {
    const m = line.match(/CONFIRM\(([^)]+)\):\s*(.*?)\s*(-->|$)/);
    if (!m) return;
    const q = m[1].trim(), what = m[2].trim();
    const next = (src[i + 1] || '').replace(/<[^>]+>/g, '').trim().slice(0, 140);
    (byQ[q] = byQ[q] || []).push({ file: path.relative(ROOT, f), line: i + 1, what, next });
  });
}
const keys = Object.keys(byQ).sort((a, b) => { const na = parseInt(a.replace(/\D/g, '')) || 0, nb = parseInt(b.replace(/\D/g, '')) || 0; return na - nb || a.localeCompare(b); });
let out = `# Launch checklist: facts to confirm before DNS moves to localphlebotomy.com

Every unconfirmed fact on the site is marked in the source with a \`CONFIRM(...)\` comment on the line above the sentence it applies to. This file is generated from those markers (\`node checklist.js\` in the QA scratchpad). Fix the copy, delete the marker, regenerate.

Numbers tagged DRAFT were written so the page reads complete; they are proposals, not facts. Ellie must confirm or change them.

`;
for (const q of keys) {
  out += `## ${q}\n\n`;
  const seen = new Set();
  for (const e of byQ[q]) {
    const key = e.what + '|' + e.next;
    out += `- **${e.what}**  \n  \`${e.file}:${e.line}\`` + (e.next && !seen.has(key) ? `\n  > ${e.next}` : '') + '\n';
    seen.add(key);
  }
  out += '\n';
}
out += `## Cutover steps (no facts needed)

1. Decide www vs apex. The build uses the apex \`https://localphlebotomy.com\`; if www is preferred, search-and-replace the domain in every HTML file, \`sitemap.xml\`, \`robots.txt\`, \`llms.txt\`, \`_redirects\`, and \`vercel.json\`.
2. Copy the real Squarespace slugs for the athlete and pediatric pages from the Squarespace sitemap into \`_redirects\` and \`vercel.json\` (the current ones are guesses).
3. Create the \`care@localphlebotomy.com\` mailbox (or replace it everywhere with the address Ellie wants).
4. Add \`mariposaphlebotomy.com\` and \`www.mariposaphlebotomy.com\` to the host as redirect domains pointing at this project, so the old URLs 301 to the new site.
5. New Google Search Console property for the new domain; submit \`https://localphlebotomy.com/sitemap.xml\`. Update the Google Business Profile website field. Expect the current geo citations to reset.
6. Set the footer "Last updated" month and \`sitemap.xml\` lastmod at deploy time.
`;
fs.writeFileSync(path.join(ROOT, 'LAUNCH-CHECKLIST.md'), out);
console.log(keys.length + ' question groups, ' + Object.values(byQ).flat().length + ' markers');
