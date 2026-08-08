// Self-check: every icon imported from lucide-react must actually exist in the
// installed version. A missing one imports as `undefined`, and React throws
// "Element type is invalid" at render time -> blank white page, no build error.
// Run: node check-icons.cjs
const fs = require('fs');
const path = require('path');
const lucide = require('lucide-react');

function walk(dir) {
  let out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out = out.concat(walk(p));
    else if (/\.jsx?$/.test(e.name)) out.push(p);
  }
  return out;
}

let missing = 0;
for (const file of walk(path.join(__dirname, 'src'))) {
  const src = fs.readFileSync(file, 'utf8');
  const re = /import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/g;
  let m;
  while ((m = re.exec(src))) {
    for (let name of m[1].split(',')) {
      name = name.trim().split(/\s+as\s+/)[0].trim();
      if (name && !(name in lucide)) {
        console.error(`MISSING: ${name}  <- ${path.relative(__dirname, file)}`);
        missing++;
      }
    }
  }
}

if (missing) {
  console.error(`FAIL: ${missing} unresolved lucide-react import(s)`);
  process.exit(1);
}
console.log('PASS: all lucide-react icon imports resolve');
