// Ponto de entrada da API RESTful do Marketplace de Economia Circular (Vortex/UNIFOR).
import express from 'express';
import cors from 'cors';
import { config, CATEGORIES } from './config.js';
import { seedIfEmpty } from './db.js';
import { authRouter } from './routes/auth.routes.js';
import { itemsRouter } from './routes/items.routes.js';
import { statsRouter } from './routes/stats.routes.js';

const app = express();

// --- Middlewares globais ---
app.use(
  cors({
    origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(',').map((s) => s.trim()),
  })
);
app.use(express.json({ limit: '1mb' }));

// Log simples de requisições (ajuda na demonstração do vídeo).
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()}  ${req.method} ${req.url}`);
  next();
});

// --- Rotas ---
app.get('/', (_req, res) => {
  res.json({
    name: 'Vortex Desapego API',
    description: 'API RESTful do Marketplace de Economia Circular do Campus (UNIFOR).',
    status: 'online',
    endpoints: [
      'GET    /api/health',
      'GET    /api/categories',
      'GET    /api/stats',
      'POST   /api/auth/register',
      'POST   /api/auth/login',
      'GET    /api/auth/me            (protegido)',
      'GET    /api/items              (filtros: ?category=&q=&type=&sort=)',
      'GET    /api/items/mine         (protegido)',
      'GET    /api/items/:id',
      'POST   /api/items              (protegido)',
      'PUT    /api/items/:id          (protegido)',
      'DELETE /api/items/:id          (protegido)',
    ],
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.get('/api/categories', (_req, res) => {
  res.json({ categories: CATEGORIES });
});

app.use('/api/auth', authRouter);
app.use('/api/items', itemsRouter);
app.use('/api/stats', statsRouter);

// --- 404 para rotas desconhecidas ---
app.use((req, res) => {
  res.status(404).json({ error: `Rota não encontrada: ${req.method} ${req.url}` });
});

// --- Tratamento central de erros (ex.: JSON malformado no body) ---
app.use((err, _req, res, _next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON inválido no corpo da requisição.' });
  }
  console.error('Erro não tratado:', err);
  return res.status(500).json({ error: 'Erro interno do servidor.' });
});

// --- Inicialização ---
seedIfEmpty();
app.listen(config.port, () => {
  console.log('\n=============================================');
  console.log('  🚀 Vortex Desapego API rodando!');
  console.log(`  🔗 http://localhost:${config.port}`);
  console.log(`  📚 Categorias: ${CATEGORIES.join(', ')}`);
  console.log('=============================================\n');
});
