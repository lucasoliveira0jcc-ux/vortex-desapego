// Carrega variáveis de ambiente do arquivo .env (recurso nativo do Node 20.6+),
// sem precisar da biblioteca "dotenv". Se o arquivo não existir, seguimos com os defaults.
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env');

if (existsSync(envPath) && typeof process.loadEnvFile === 'function') {
  process.loadEnvFile(envPath);
}

export const config = {
  port: Number(process.env.PORT) || 4000,
  jwtSecret: process.env.JWT_SECRET || 'vortex-dev-secret-nao-use-em-producao',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || '*',
};

// Lista fixa de categorias aceitas pelo sistema (usada na validação e nos filtros).
export const CATEGORIES = [
  'Livros',
  'Engenharia',
  'Computação',
  'Eletrônicos',
  'Vestuário',
  'Móveis',
  'Papelaria',
  'Outros',
];

export const CONDITIONS = ['novo', 'seminovo', 'usado'];
export const TYPES = ['venda', 'doacao'];
