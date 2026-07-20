// Servidor estático mínimo (sem dependências) para servir a PWA localmente.
// Service Workers exigem "secure context" — http://localhost conta como seguro,
// então isto é suficiente para instalar e testar o PWA na máquina local.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname, normalize } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 5173;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

const server = createServer(async (req, res) => {
  try {
    let urlPath = decodeURIComponent(req.url.split('?')[0]);
    if (urlPath === '/') urlPath = '/index.html';

    // Impede path traversal (../) resolvendo para dentro do ROOT.
    let filePath = normalize(join(ROOT, urlPath));
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403).end('Forbidden');
      return;
    }

    let info;
    try {
      info = await stat(filePath);
    } catch {
      // Fallback SPA: qualquer rota desconhecida devolve o index.html.
      filePath = join(ROOT, 'index.html');
    }
    if (info?.isDirectory()) filePath = join(filePath, 'index.html');

    const data = await readFile(filePath);
    const type = MIME[extname(filePath).toLowerCase()] || 'application/octet-stream';

    // O Service Worker não deve ser cacheado agressivamente pelo browser.
    const headers = { 'Content-Type': type };
    if (filePath.endsWith('sw.js')) headers['Cache-Control'] = 'no-cache';

    res.writeHead(200, headers).end(data);
  } catch (err) {
    res.writeHead(500).end('Erro interno: ' + err.message);
  }
});

server.listen(PORT, () => {
  console.log('\n=============================================');
  console.log('  🌐 Frontend (PWA) servido em:');
  console.log(`  🔗 http://localhost:${PORT}`);
  console.log('  (certifique-se de que a API está em http://localhost:4000)');
  console.log('=============================================\n');
});
