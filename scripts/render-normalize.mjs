import fs from 'node:fs';

// Normalize generated OTP patch escaping.
const prepareFile = 'scripts/render-prepare.mjs';
let prepareSource = fs.readFileSync(prepareFile, 'utf8');
prepareSource = prepareSource.replaceAll('\\\\`', '\\`');
prepareSource = prepareSource.replaceAll('\\\\${', '\\${');
fs.writeFileSync(prepareFile, prepareSource, 'utf8');

// Render supplies PORT at runtime. Keep the repository source compatible with
// both local development and Render without adding another runtime dependency.
const serverFile = 'server.ts';
let serverSource = fs.readFileSync(serverFile, 'utf8');
serverSource = serverSource.replace(
  'const PORT = 3000;',
  'const PORT = Number(process.env.PORT) || 3000;'
);

// Frontend is hosted separately on wiup.vn / www.wiup.vn. Allow only those
// browser origins to call the Render API; keep non-browser/server requests
// working without requiring an Origin header.
const corsMarker = '  // BizOne API CORS';
if (!serverSource.includes(corsMarker)) {
  const corsMiddleware = `\n${corsMarker}\n  app.use((req, res, next) => {\n    const origin = req.headers.origin;\n    const allowedOrigins = new Set([\n      'https://wiup.vn',\n      'https://www.wiup.vn'\n    ]);\n\n    if (origin && allowedOrigins.has(origin)) {\n      res.setHeader('Access-Control-Allow-Origin', origin);\n      res.setHeader('Vary', 'Origin');\n      res.setHeader('Access-Control-Allow-Credentials', 'true');\n      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');\n      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');\n    }\n\n    if (req.method === 'OPTIONS') {\n      return res.sendStatus(204);\n    }\n\n    next();\n  });\n`;

  const middlewareAnchor = '  // Middleware\n';
  if (!serverSource.includes(middlewareAnchor)) {
    throw new Error('[render-normalize] Could not locate server middleware anchor.');
  }
  serverSource = serverSource.replace(middlewareAnchor, corsMiddleware + '\n' + middlewareAnchor);
}

fs.writeFileSync(serverFile, serverSource, 'utf8');
console.log('[render-normalize] Render API CORS + dynamic PORT normalization applied.');
