// Camada de persistência usando o SQLite nativo do Node (node:sqlite).
// Guardamos o banco em um arquivo (src/data/vortex.db) para que os dados
// sobrevivam entre reinícios do servidor.
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, 'data');
if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });

const dbPath = join(dataDir, 'vortex.db');
export const db = new DatabaseSync(dbPath);

// Habilita foreign keys e cria as tabelas caso ainda não existam.
db.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL UNIQUE,
    password   TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS items (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    description TEXT,
    category    TEXT NOT NULL,
    type        TEXT NOT NULL DEFAULT 'venda',   -- 'venda' ou 'doacao'
    price       REAL NOT NULL DEFAULT 0,
    condition   TEXT DEFAULT 'usado',            -- 'novo' | 'seminovo' | 'usado'
    image_url   TEXT,
    contact     TEXT,
    campus      TEXT,
    user_id     TEXT NOT NULL,
    created_at  TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
  CREATE INDEX IF NOT EXISTS idx_items_created  ON items(created_at);
`);

export function nowISO() {
  return new Date().toISOString();
}

// Popula o banco com um usuário demo e alguns anúncios na primeira execução,
// para que a vitrine e as estatísticas não apareçam vazias na avaliação.
export function seedIfEmpty() {
  const { c } = db.prepare('SELECT COUNT(*) AS c FROM users').get();
  if (c > 0) return;

  const userId = randomUUID();
  const passwordHash = bcrypt.hashSync('123456', 10);
  db.prepare(
    `INSERT INTO users (id, name, email, password, created_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(userId, 'Ana Beatriz (demo)', 'demo@unifor.br', passwordHash, nowISO());

  const seedItems = [
    {
      title: 'Cálculo - Volume 1 (James Stewart)',
      description: 'Livro em ótimo estado, usei só no primeiro semestre. Sem grifos.',
      category: 'Livros', type: 'venda', price: 90, condition: 'seminovo',
      image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80',
      contact: '(85) 99999-0001', campus: 'Campus UNIFOR',
    },
    {
      title: 'Calculadora HP 12C Financeira',
      description: 'Perfeita para as cadeiras de Engenharia Econômica. Funcionando 100%.',
      category: 'Engenharia', type: 'venda', price: 180, condition: 'usado',
      image_url: 'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?w=600&q=80',
      contact: '(85) 99999-0002', campus: 'Bloco K',
    },
    {
      title: 'Jaleco branco tamanho M',
      description: 'Doação! Terminei o curso e quero repassar. Mangas longas.',
      category: 'Vestuário', type: 'doacao', price: 0, condition: 'usado',
      image_url: 'https://images.unsplash.com/photo-1580281658223-9b93f18ae9ae?w=600&q=80',
      contact: 'demo@unifor.br', campus: 'Área da Saúde',
    },
    {
      title: 'Arduino Uno + kit de sensores',
      description: 'Kit completo para projetos de IoT. Acompanha protoboard e jumpers.',
      category: 'Eletrônicos', type: 'venda', price: 120, condition: 'seminovo',
      image_url: 'https://images.unsplash.com/photo-1553406830-ef2513450d76?w=600&q=80',
      contact: '(85) 99999-0003', campus: 'Lab. de Computação',
    },
    {
      title: 'Notebook Dell antigo (para peças)',
      description: 'Não liga, mas HD e memória funcionam. Doação para quem quiser aproveitar.',
      category: 'Computação', type: 'doacao', price: 0, condition: 'usado',
      image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80',
      contact: 'demo@unifor.br', campus: 'Bloco M',
    },
    {
      title: 'Cadeira de escritório ergonômica',
      description: 'Mudei de cidade e preciso desapegar. Muito confortável para estudar.',
      category: 'Móveis', type: 'venda', price: 150, condition: 'usado',
      image_url: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=600&q=80',
      contact: '(85) 99999-0004', campus: 'Próximo à UNIFOR',
    },
  ];

  const insert = db.prepare(
    `INSERT INTO items
       (id, title, description, category, type, price, condition, image_url, contact, campus, user_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const base = Date.now();
  seedItems.forEach((it, idx) => {
    // Datas escalonadas para dar sensação de "últimos anúncios".
    const created = new Date(base - idx * 36e5).toISOString();
    insert.run(
      randomUUID(), it.title, it.description, it.category, it.type, it.price,
      it.condition, it.image_url, it.contact, it.campus, userId, created
    );
  });

  console.log(`🌱 Banco populado com usuário demo (demo@unifor.br / 123456) e ${seedItems.length} anúncios.`);
}
