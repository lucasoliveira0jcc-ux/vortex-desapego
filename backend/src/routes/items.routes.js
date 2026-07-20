// Rotas de anúncios (itens): CRUD completo com filtros.
// Listagem e leitura são públicas; criar, editar e deletar exigem autenticação.
import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { db, nowISO } from '../db.js';
import { requireAuth, optionalAuth } from '../auth.js';
import { validateItem } from '../validate.js';
import { CATEGORIES } from '../config.js';

export const itemsRouter = Router();

// Junta os dados do anúncio com o nome do dono e marca se é do usuário atual.
const SELECT_WITH_OWNER = `
  SELECT items.*, users.name AS owner_name
  FROM items
  JOIN users ON users.id = items.user_id
`;

function decorate(row, currentUserId) {
  if (!row) return row;
  return {
    ...row,
    is_owner: currentUserId ? row.user_id === currentUserId : false,
  };
}

// GET /api/items  — vitrine pública com filtros
// Query params: category, q (busca por texto), type (venda|doacao), sort (recent|price_asc|price_desc), limit
itemsRouter.get('/', optionalAuth, (req, res) => {
  const { category, q, type, sort = 'recent', limit } = req.query;

  const where = [];
  const params = [];

  if (category && category !== 'Todos' && CATEGORIES.includes(String(category))) {
    where.push('items.category = ?');
    params.push(category);
  }
  if (type === 'venda' || type === 'doacao') {
    where.push('items.type = ?');
    params.push(type);
  }
  if (q && String(q).trim()) {
    where.push('(items.title LIKE ? OR items.description LIKE ?)');
    const like = `%${String(q).trim()}%`;
    params.push(like, like);
  }

  const orderBy =
    sort === 'price_asc' ? 'items.price ASC'
    : sort === 'price_desc' ? 'items.price DESC'
    : 'items.created_at DESC';

  let sql = SELECT_WITH_OWNER;
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += ` ORDER BY ${orderBy}`;

  const max = Math.min(Number(limit) || 100, 200);
  sql += ' LIMIT ?';
  params.push(max);

  const rows = db.prepare(sql).all(...params);
  const items = rows.map((r) => decorate(r, req.user?.id));
  return res.json({ count: items.length, items });
});

// GET /api/items/mine  — anúncios do usuário logado (precisa vir antes de /:id)
itemsRouter.get('/mine', requireAuth, (req, res) => {
  const rows = db
    .prepare(SELECT_WITH_OWNER + ' WHERE items.user_id = ? ORDER BY items.created_at DESC')
    .all(req.user.id);
  const items = rows.map((r) => decorate(r, req.user.id));
  return res.json({ count: items.length, items });
});

// GET /api/items/:id — detalhe de um anúncio
itemsRouter.get('/:id', optionalAuth, (req, res) => {
  const row = db.prepare(SELECT_WITH_OWNER + ' WHERE items.id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Anúncio não encontrado.' });
  return res.json({ item: decorate(row, req.user?.id) });
});

// POST /api/items — cria um anúncio (protegido)
itemsRouter.post('/', requireAuth, (req, res) => {
  const { errors, data, valid } = validateItem(req.body);
  if (!valid) return res.status(400).json({ error: 'Dados inválidos', fields: errors });

  const id = randomUUID();
  db.prepare(
    `INSERT INTO items
       (id, title, description, category, type, price, condition, image_url, contact, campus, user_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id, data.title, data.description, data.category, data.type, data.price,
    data.condition, data.image_url, data.contact, data.campus, req.user.id, nowISO()
  );

  const row = db.prepare(SELECT_WITH_OWNER + ' WHERE items.id = ?').get(id);
  return res.status(201).json({ item: decorate(row, req.user.id) });
});

// PUT /api/items/:id — edita um anúncio (protegido, só o dono)
itemsRouter.put('/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Anúncio não encontrado.' });
  if (existing.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Você só pode editar seus próprios anúncios.' });
  }

  const { errors, data, valid } = validateItem(req.body, { partial: true });
  if (!valid) return res.status(400).json({ error: 'Dados inválidos', fields: errors });

  const merged = { ...existing, ...data };
  db.prepare(
    `UPDATE items SET
       title = ?, description = ?, category = ?, type = ?, price = ?,
       condition = ?, image_url = ?, contact = ?, campus = ?
     WHERE id = ?`
  ).run(
    merged.title, merged.description, merged.category, merged.type, merged.price,
    merged.condition, merged.image_url, merged.contact, merged.campus, req.params.id
  );

  const row = db.prepare(SELECT_WITH_OWNER + ' WHERE items.id = ?').get(req.params.id);
  return res.json({ item: decorate(row, req.user.id) });
});

// DELETE /api/items/:id — remove um anúncio (protegido, só o dono)
itemsRouter.delete('/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Anúncio não encontrado.' });
  if (existing.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Você só pode deletar seus próprios anúncios.' });
  }

  db.prepare('DELETE FROM items WHERE id = ?').run(req.params.id);
  return res.json({ ok: true, deleted: req.params.id });
});
