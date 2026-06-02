const fs = require('fs');
let c = fs.readFileSync('app/page.tsx', 'utf8');
const m = c.match(/const css = `([\s\S]*?)`;/);
if (m) {
  fs.writeFileSync('app/page.css', m[1]);
  c = c.replace(m[0], 'import "./page.css";');
  c = c.replace('<style dangerouslySetInnerHTML={{ __html: css }} />', '');
  fs.writeFileSync('app/page.tsx', c);
  console.log('Extracted to app/page.css');
} else {
  console.log('Not found');
}
