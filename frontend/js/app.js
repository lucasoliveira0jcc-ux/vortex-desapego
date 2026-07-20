// Bootstrap da SPA: roteador por hash, estado de sessão no header,
// registro do Service Worker e prompt de instalação do PWA.
import { views, openAuthModal, openItemModal } from './views.js';
import { session } from './session.js';
import { navigate } from './nav.js';

const app = document.getElementById('app');

// Converte "#/explorar?category=Livros" em { name:'explorar', params:{category:'Livros'} }
function parseRoute() {
  const hash = location.hash.slice(1) || '/';
  const [path, query = ''] = hash.split('?');
  const clean = path.replace(/^\/+|\/+$/g, ''); // remove barras extras
  const name = clean === '' ? 'home' : clean;
  const params = Object.fromEntries(new URLSearchParams(query).entries());
  return { name, params };
}

let currentName = null;

async function render() {
  const { name, params } = parseRoute();
  const view = views[name] || views.notFound;
  const { html, onMount } = view(params);

  app.innerHTML = html;
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  updateActiveNav(name);
  currentName = name;
  if (onMount) await onMount();
}

function updateActiveNav(name) {
  document.querySelectorAll('[data-nav]').forEach((el) => {
    el.classList.toggle('active', el.dataset.nav === name);
  });
}

// ---- Estado de autenticação no cabeçalho ----
function refreshAuthUI() {
  const chip = document.getElementById('userChip');
  const authBtn = document.getElementById('authBtn');
  if (session.isLoggedIn()) {
    const user = session.getUser();
    chip.hidden = false;
    chip.textContent = `👋 ${user.name.split(' ')[0]}`;
    chip.onclick = () => navigate('/perfil');
    authBtn.textContent = 'Perfil';
    authBtn.onclick = () => navigate('/perfil');
  } else {
    chip.hidden = true;
    authBtn.textContent = 'Entrar';
    authBtn.onclick = () => openAuthModal('login');
  }
}

// ---- Delegação global de cliques ----
document.addEventListener('click', (e) => {
  // Links internos (data-link) — deixa o hashchange cuidar do resto, mas
  // garante navegação mesmo em elementos aninhados.
  const link = e.target.closest('a[data-link]');
  if (link) {
    const href = link.getAttribute('href');
    if (href?.startsWith('#')) {
      // comportamento nativo de hash já navega; nada extra necessário
      return;
    }
  }

  // Clique num card de item abre o modal de detalhe.
  const cardEl = e.target.closest('[data-item]');
  if (cardEl) {
    openItemModal(cardEl.dataset.item);
  }
});

// Acessibilidade: abrir card com Enter.
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const cardEl = e.target.closest?.('[data-item]');
    if (cardEl) openItemModal(cardEl.dataset.item);
  }
});

// ---- Eventos de navegação e atualização ----
window.addEventListener('hashchange', render);
window.addEventListener('route:refresh', render);
window.addEventListener('auth:changed', () => {
  refreshAuthUI();
  render();
});

// Header encolhe ao rolar (efeito visual).
window.addEventListener('scroll', () => {
  document.getElementById('siteHeader')?.classList.toggle('scrolled', window.scrollY > 12);
});

// ---- Instalação do PWA (beforeinstallprompt) ----
let deferredPrompt = null;
const installBtn = document.getElementById('installBtn');
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.hidden = false;
});
installBtn?.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === 'accepted') installBtn.hidden = true;
  deferredPrompt = null;
});
window.addEventListener('appinstalled', () => {
  installBtn.hidden = true;
});

// ---- Registro do Service Worker ----
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch((err) => {
      console.warn('Falha ao registrar o Service Worker:', err);
    });
  });
}

// ---- Início ----
refreshAuthUI();
render();
