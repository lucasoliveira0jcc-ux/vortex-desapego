// Cliente HTTP fino em torno do fetch. Injeta o token JWT automaticamente e
// padroniza o tratamento de erros (lança um Error com .fields quando a API
// devolve erros de validação por campo).
import { API_BASE } from './config.js';
import { session } from './session.js';

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = session.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Não foi possível conectar à API. Verifique se o backend está rodando.');
  }

  // 204 No Content
  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.error || `Erro ${res.status}`);
    err.status = res.status;
    err.fields = data.fields || null;
    throw err;
  }
  return data;
}

export const api = {
  // Público
  health: () => request('/health'),
  stats: () => request('/stats'),
  categories: () => request('/categories'),
  listItems: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null)
    ).toString();
    return request(`/items${qs ? `?${qs}` : ''}`);
  },
  getItem: (id) => request(`/items/${id}`),

  // Auth
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  me: () => request('/auth/me', { auth: true }),

  // Protegido
  myItems: () => request('/items/mine', { auth: true }),
  createItem: (payload) => request('/items', { method: 'POST', body: payload, auth: true }),
  updateItem: (id, payload) => request(`/items/${id}`, { method: 'PUT', body: payload, auth: true }),
  deleteItem: (id) => request(`/items/${id}`, { method: 'DELETE', auth: true }),
};
