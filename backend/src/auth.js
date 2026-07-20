// Helpers de autenticação: geração/validação de JWT e middleware de proteção de rotas.
import jwt from 'jsonwebtoken';
import { config } from './config.js';

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, name: user.name, email: user.email },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

// Middleware obrigatório: bloqueia a requisição se não houver um token válido.
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Token de autenticação ausente. Faça login.' });
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = { id: payload.sub, name: payload.name, email: payload.email };
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}

// Middleware opcional: se houver token válido preenche req.user, senão segue sem erro.
// Útil na listagem pública para marcar quais anúncios são do próprio usuário.
export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme === 'Bearer' && token) {
    try {
      const payload = jwt.verify(token, config.jwtSecret);
      req.user = { id: payload.sub, name: payload.name, email: payload.email };
    } catch {
      /* token inválido é ignorado no fluxo opcional */
    }
  }
  next();
}
