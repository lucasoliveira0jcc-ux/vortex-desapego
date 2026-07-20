// Configuração do frontend. Detecta automaticamente a URL da API:
//  - Em localhost, aponta para a API local na porta 4000.
//  - Em produção, usa window.__API_URL__ (se você definir no HTML) ou o
//    mesmo host trocando para /api. Ajuste conforme o seu deploy.
const isLocalhost = ['localhost', '127.0.0.1', ''].includes(location.hostname);

export const API_BASE =
  window.__API_URL__ ||
  (isLocalhost ? 'http://localhost:4000/api' : `${location.origin.replace(/:\d+$/, '')}/api`);

// Categorias e rótulos usados na interface.
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

export const CATEGORY_ICONS = {
  Livros: '📚',
  Engenharia: '📐',
  Computação: '💻',
  Eletrônicos: '🔌',
  Vestuário: '🥼',
  Móveis: '🪑',
  Papelaria: '✏️',
  Outros: '📦',
  Todos: '✨',
};
