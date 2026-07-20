// Navegação compartilhada (evita dependência circular entre app.js e views.js).
export function navigate(path) {
  if (location.hash === `#${path}`) {
    // Mesma rota: força re-render manualmente.
    rerender();
  } else {
    location.hash = path;
  }
}

// Pede para o app renderizar novamente a rota atual (ex.: após criar/deletar).
export function rerender() {
  window.dispatchEvent(new CustomEvent('route:refresh'));
}
