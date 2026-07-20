// Estatísticas para a Landing Page. Misturamos números reais do banco com
// uma linha de base "simulada" (como pede o edital) para dar a sensação de
// uma comunidade ativa no campus.
import { Router } from 'express';
import { db } from '../db.js';
import { CATEGORIES } from '../config.js';

export const statsRouter = Router();

// Linha de base simulada — somada aos números reais.
const SIMULATED = {
  users: 1240,
  items: 3180,
  donations: 870,
  co2SavedKg: 5420, // estimativa de CO2 evitado por reaproveitar itens
};

// GET /api/stats
statsRouter.get('/', (_req, res) => {
  const totalItems = db.prepare('SELECT COUNT(*) AS c FROM items').get().c;
  const totalUsers = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  const donations = db.prepare("SELECT COUNT(*) AS c FROM items WHERE type = 'doacao'").get().c;
  const forSale = db.prepare("SELECT COUNT(*) AS c FROM items WHERE type = 'venda'").get().c;

  // Contagem real por categoria (para o gráfico/pílulas da landing).
  const byCategoryRows = db
    .prepare('SELECT category, COUNT(*) AS c FROM items GROUP BY category')
    .all();
  const byCategoryMap = Object.fromEntries(byCategoryRows.map((r) => [r.category, r.c]));
  const byCategory = CATEGORIES.map((cat) => ({ category: cat, count: byCategoryMap[cat] || 0 }));

  return res.json({
    // Números "de vitrine" (reais + simulados) para impressionar na landing.
    totals: {
      items: totalItems + SIMULATED.items,
      users: totalUsers + SIMULATED.users,
      donations: donations + SIMULATED.donations,
      co2SavedKg: SIMULATED.co2SavedKg + totalItems * 3,
    },
    // Números crus reais (úteis para debug / transparência).
    real: { items: totalItems, users: totalUsers, donations, forSale },
    byCategory,
  });
});
