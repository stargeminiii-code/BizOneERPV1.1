import fs from 'node:fs';

const file = 'scripts/render-prepare.mjs';
let source = fs.readFileSync(file, 'utf8');

// The OTP template is embedded in a template literal. Normalize only the
// accidental double escaping introduced by the generator; keep the actual
// generated server code unchanged.
source = source.replaceAll('\\\\`', '\\`');
source = source.replaceAll('\\\\${', '\\${');

fs.writeFileSync(file, source, 'utf8');
