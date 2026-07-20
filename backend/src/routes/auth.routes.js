// Rotas de autenticação: cadastro, login e "quem sou eu".
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { db, nowISO } from '../db.js';
import { signToken, requireAuth } from '../auth.js';
import { validateRegister } from '../validate.js';

export const authRouter = Router();

// Remove o campo de senha antes de devolver o usuário na resposta.
function publicUser(row) {
  return { id: row.id, name: row.name, email: row.email, created_at: row.created_at };
}

// POST /api/auth/register
authRouter.post('/register', (req, res) => {
  const { errors, data, valid } = validateRegister(req.body);
  if (!valid) return res.status(400).json({ error: 'Dados inválidos', fields: errors });

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(data.email);
  if (existing) {
    return res.status(409).json({ error: 'Já existe uma conta com esse e-mail.' });
  }

  const user = {
    id: randomUUID(),
    name: data.name,
    email: data.email,
    password: bcrypt.hashSync(data.password, 10),
    created_at: nowISO(),
  };
  db.prepare(
    'INSERT INTO users (id, name, email, password, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(user.id, user.name, user.email, user.password, user.created_at);

  const token = signToken(user);
  return res.status(201).json({ token, user: publicUser(user) });
});

// POST /api/auth/login
authRouter.post('/login', (req, res) => {
  const email = String(req.body.email ?? '').trim().toLowerCase();
  const password = String(req.body.password ?? '');

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
  }

  const token = signToken(user);
  return res.json({ token, user: publicUser(user) });
});

// GET /api/auth/me  (rota protegida)
authRouter.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
  return res.json({ user: publicUser(user) });
});
