// Pequenos utilitários de interface: escape de HTML, formatação, toasts e modal.

// Evita XSS ao interpolar conteúdo vindo da API dentro do HTML.
export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatPrice(item) {
  if (item.type === 'doacao') return 'Doação';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price || 0);
}

export function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'agora mesmo';
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`;
  return `há ${Math.floor(diff / 86400)} d`;
}

// ---------- Toasts ----------
export function toast(message, type = 'info') {
  const root = document.getElementById('toastRoot');
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = message;
  root.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, 3200);
}

// ---------- Modal ----------
export function openModal(html) {
  const root = document.getElementById('modalRoot');
  root.innerHTML = `
    <div class="modal-overlay" data-close>
      <div class="modal-card" role="dialog" aria-modal="true">
        <button class="modal-close" data-close aria-label="Fechar">✕</button>
        ${html}
      </div>
    </div>`;
  document.body.style.overflow = 'hidden';
  const overlay = root.querySelector('.modal-overlay');
  overlay.addEventListener('click', (e) => {
    if (e.target.hasAttribute('data-close')) closeModal();
  });
  document.addEventListener('keydown', escClose);
  return root.querySelector('.modal-card');
}

function escClose(e) {
  if (e.key === 'Escape') closeModal();
}

export function closeModal() {
  const root = document.getElementById('modalRoot');
  root.innerHTML = '';
  document.body.style.overflow = '';
  document.removeEventListener('keydown', escClose);
}
