import fs from 'node:fs';

const file = 'scripts/render-prepare.mjs';
let source = fs.readFileSync(file, 'utf8');

// render-prepare.mjs contains a template literal that generates TypeScript.
// Previous patches over-escaped nested template delimiters, making the .mjs
// file itself fail to parse before it could patch server.ts.
source = source.replace(/\\{2,}`/g, '\\`');
source = source.replace(/\\{2,}\$\{/g, '\\${');

fs.writeFileSync(file, source, 'utf8');
console.log('[fix-render-prepare-escaping] normalized nested template delimiters.');
