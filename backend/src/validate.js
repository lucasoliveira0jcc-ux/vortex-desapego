// Validação simples e explícita dos dados de entrada dos anúncios.
// Retornamos uma lista de erros por campo (400) em vez de deixar o banco quebrar.
import { CATEGORIES, CONDITIONS, TYPES } from './config.js';

export function validateItem(body, { partial = false } = {}) {
  const errors = {};
  const data = {};

  const has = (k) => body[k] !== undefined && body[k] !== null && body[k] !== '';

  // title
  if (!partial || has('title')) {
    const title = String(body.title ?? '').trim();
    if (title.length < 3) errors.title = 'O título precisa ter ao menos 3 caracteres.';
    else if (title.length > 120) errors.title = 'O título pode ter no máximo 120 caracteres.';
    else data.title = title;
  }

  // description (opcional)
  if (has('description')) {
    const desc = String(body.description).trim();
    if (desc.length > 2000) errors.description = 'A descrição pode ter no máximo 2000 caracteres.';
    else data.description = desc;
  } else if (!partial) {
    data.description = '';
  }

  // category
  if (!partial || has('category')) {
    const category = String(body.category ?? '').trim();
    if (!CATEGORIES.includes(category)) {
      errors.category = `Categoria inválida. Use uma de: ${CATEGORIES.join(', ')}.`;
    } else {
      data.category = category;
    }
  }

  // type
  if (!partial || has('type')) {
    const type = String(body.type ?? 'venda').trim();
    if (!TYPES.includes(type)) errors.type = `Tipo inválido. Use "venda" ou "doacao".`;
    else data.type = type;
  }

  // price — só é obrigatório/relevante quando o tipo é "venda"
  const effectiveType = data.type ?? body.type ?? 'venda';
  if (effectiveType === 'doacao') {
    data.price = 0;
  } else if (!partial || has('price')) {
    const price = Number(body.price);
    if (Number.isNaN(price) || price < 0) {
      errors.price = 'Informe um preço válido (número maior ou igual a zero).';
    } else {
      data.price = price;
    }
  }

  // condition (opcional, com default)
  if (has('condition')) {
    const condition = String(body.condition).trim();
    if (!CONDITIONS.includes(condition)) {
      errors.condition = `Condição inválida. Use: ${CONDITIONS.join(', ')}.`;
    } else {
      data.condition = condition;
    }
  } else if (!partial) {
    data.condition = 'usado';
  }

  // image_url (opcional) — validação leve de URL
  if (has('image_url')) {
    const url = String(body.image_url).trim();
    if (!/^https?:\/\/.+/i.test(url)) {
      errors.image_url = 'A URL da imagem deve começar com http:// ou https://';
    } else {
      data.image_url = url;
    }
  } else if (!partial) {
    data.image_url = '';
  }

  // contact e campus (opcionais, texto livre)
  if (has('contact')) data.contact = String(body.contact).trim().slice(0, 120);
  else if (!partial) data.contact = '';

  if (has('campus')) data.campus = String(body.campus).trim().slice(0, 120);
  else if (!partial) data.campus = '';

  return { errors, data, valid: Object.keys(errors).length === 0 };
}

export function validateRegister(body) {
  const errors = {};
  const name = String(body.name ?? '').trim();
  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');

  if (name.length < 2) errors.name = 'Informe seu nome (mínimo 2 caracteres).';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'E-mail inválido.';
  if (password.length < 6) errors.password = 'A senha precisa ter ao menos 6 caracteres.';

  return { errors, data: { name, email, password }, valid: Object.keys(errors).length === 0 };
}
