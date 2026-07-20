// Renderização das telas (views) da SPA. Cada view retorna { html, onMount }.
// O onMount é chamado após o HTML entrar no DOM, para buscar dados e ligar eventos.
import { api } from './api.js';
import { session } from './session.js';
import { CATEGORIES, CATEGORY_ICONS } from './config.js';
import { esc, formatPrice, timeAgo, toast, openModal, closeModal } from './ui.js';
import { navigate, rerender } from './nav.js';

// ---------------------------------------------------------------------------
// Componentes reutilizáveis
// ---------------------------------------------------------------------------
function itemCard(item) {
  const img = item.image_url
    ? `<img src="${esc(item.image_url)}" alt="${esc(item.title)}" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'card-noimg',textContent:'${CATEGORY_ICONS[item.category] || '📦'}'}))" />`
    : `<div class="card-noimg">${CATEGORY_ICONS[item.category] || '📦'}</div>`;

  const badge = item.type === 'doacao'
    ? `<span class="badge badge-donation">Doação</span>`
    : `<span class="badge badge-sale">${formatPrice(item)}</span>`;

  return `
    <article class="item-card" data-item="${esc(item.id)}" tabindex="0">
      <div class="item-thumb">
        ${img}
        ${badge}
        <span class="item-cat">${CATEGORY_ICONS[item.category] || '📦'} ${esc(item.category)}</span>
      </div>
      <div class="item-body">
        <h3 class="item-title">${esc(item.title)}</h3>
        <p class="item-desc">${esc(item.description || 'Sem descrição.')}</p>
        <div class="item-meta">
          <span>${esc(item.owner_name || 'Anônimo')}</span>
          <span>${timeAgo(item.created_at)}</span>
        </div>
      </div>
    </article>`;
}

function grid(items) {
  if (!items.length) {
    return `<div class="empty-state">
      <div class="empty-emoji">🔍</div>
      <p>Nenhum item encontrado por aqui.</p>
      <a class="btn btn-primary" href="#/anunciar" data-link>Seja o primeiro a anunciar</a>
    </div>`;
  }
  return `<div class="items-grid">${items.map(itemCard).join('')}</div>`;
}

function skeletonGrid(n = 6) {
  return `<div class="items-grid">${Array.from({ length: n })
    .map(() => `<div class="item-card skeleton"><div class="sk sk-thumb"></div><div class="sk sk-line"></div><div class="sk sk-line short"></div></div>`)
    .join('')}</div>`;
}

function categoryChips(active, basePath) {
  const all = ['Todos', ...CATEGORIES];
  return `<div class="chips" role="tablist">${all
    .map((c) => {
      const isActive = (active || 'Todos') === c;
      const q = c === 'Todos' ? basePath : `${basePath}?category=${encodeURIComponent(c)}`;
      return `<a href="#${q}" data-link class="chip ${isActive ? 'chip-active' : ''}">${CATEGORY_ICONS[c] || ''} ${esc(c)}</a>`;
    })
    .join('')}</div>`;
}

// Preenche um container com a lista de itens (usado por home e explorar).
async function fillItems(selector, params) {
  const box = document.querySelector(selector);
  if (!box) return;
  box.innerHTML = skeletonGrid(params.limit || 6);
  try {
    const { items } = await api.listItems(params);
    box.innerHTML = grid(items);
  } catch (e) {
    box.innerHTML = `<div class="empty-state"><div class="empty-emoji">⚠️</div><p>${esc(e.message)}</p></div>`;
  }
}

// ---------------------------------------------------------------------------
// HOME / Landing page
// ---------------------------------------------------------------------------
function home() {
  const html = `
    <section class="hero">
      <div class="container hero-grid">
        <div class="hero-copy">
          <span class="pill">♻️ Economia circular no campus</span>
          <h1>O que não serve mais pra você pode <span class="hl">transformar</span> a rotina de outro estudante.</h1>
          <p class="lead">Doe, venda e encontre livros, calculadoras, jalecos, eletrônicos e móveis dentro da UNIFOR. Menos desperdício, mais acesso — direto entre universitários.</p>
          <div class="hero-cta">
            <a class="btn btn-primary btn-lg" href="#/anunciar" data-link>Anunciar um item</a>
            <a class="btn btn-outline btn-lg" href="#/explorar" data-link>Explorar a vitrine</a>
          </div>
          <div class="hero-stats" id="heroStats">
            <div class="hstat"><strong>—</strong><span>itens circulando</span></div>
            <div class="hstat"><strong>—</strong><span>doações feitas</span></div>
            <div class="hstat"><strong>—</strong><span>estudantes</span></div>
          </div>
        </div>
        <div class="hero-art" aria-hidden="true">
          <div class="art-card art-1"><span>📚</span><div><b>Cálculo Vol. 1</b><small>R$ 90 · seminovo</small></div></div>
          <div class="art-card art-2"><span>🥼</span><div><b>Jaleco M</b><small>Doação</small></div></div>
          <div class="art-card art-3"><span>💻</span><div><b>Notebook p/ peças</b><small>Doação</small></div></div>
          <div class="art-glow"></div>
        </div>
      </div>
    </section>

    <section class="stats-band container" id="statsBand"></section>

    <section class="section container">
      <div class="section-head">
        <div>
          <h2>Últimos anúncios</h2>
          <p class="muted">O que a comunidade acabou de disponibilizar.</p>
        </div>
        <a class="link-more" href="#/explorar" data-link>Ver todos →</a>
      </div>
      ${categoryChips('Todos', '/')}
      <div id="homeItems"></div>
    </section>

    <section class="section container how">
      <h2 class="center">Como funciona</h2>
      <div class="steps">
        <div class="step"><div class="step-ico">📸</div><h3>1. Anuncie</h3><p>Cadastre o item com foto, categoria e escolha entre <b>doar</b> ou <b>vender</b>.</p></div>
        <div class="step"><div class="step-ico">🔎</div><h3>2. Encontre</h3><p>Estudantes buscam por categoria e acham o que precisam pertinho, no campus.</p></div>
        <div class="step"><div class="step-ico">🤝</div><h3>3. Combine</h3><p>Vocês combinam a entrega pelo contato do anúncio. Simples e sem intermediário.</p></div>
      </div>
    </section>

    <section class="cta-band">
      <div class="container cta-inner">
        <h2>Tem algo parado juntando poeira?</h2>
        <p>Dê um novo destino agora mesmo e ajude quem está começando.</p>
        <a class="btn btn-light btn-lg" href="#/anunciar" data-link>Quero anunciar</a>
      </div>
    </section>
  `;

  async function onMount() {
    fillItems('#homeItems', { limit: 6 });
    try {
      const s = await api.stats();
      // Cartões da faixa de estatísticas
      const band = document.getElementById('statsBand');
      const cards = [
        { icon: '📦', value: s.totals.items.toLocaleString('pt-BR'), label: 'Itens já circularam' },
        { icon: '🎁', value: s.totals.donations.toLocaleString('pt-BR'), label: 'Doações realizadas' },
        { icon: '🎓', value: s.totals.users.toLocaleString('pt-BR'), label: 'Estudantes ativos' },
        { icon: '🌱', value: `${s.totals.co2SavedKg.toLocaleString('pt-BR')} kg`, label: 'CO₂ evitado (estim.)' },
      ];
      band.innerHTML = cards
        .map((c) => `<div class="stat-card"><div class="stat-ico">${c.icon}</div><strong>${c.value}</strong><span>${c.label}</span></div>`)
        .join('');

      // Mini-estatísticas do hero
      const hero = document.getElementById('heroStats');
      if (hero) {
        hero.innerHTML = `
          <div class="hstat"><strong>${s.totals.items.toLocaleString('pt-BR')}</strong><span>itens circulando</span></div>
          <div class="hstat"><strong>${s.totals.donations.toLocaleString('pt-BR')}</strong><span>doações feitas</span></div>
          <div class="hstat"><strong>${s.totals.users.toLocaleString('pt-BR')}</strong><span>estudantes</span></div>`;
      }
    } catch {
      /* silencioso: a landing continua utilizável sem as estatísticas */
    }
  }

  return { html, onMount };
}

// ---------------------------------------------------------------------------
// EXPLORAR
// ---------------------------------------------------------------------------
function explorar(params) {
  const active = params.category || 'Todos';
  const q = params.q || '';
  const type = params.type || '';
  const sort = params.sort || 'recent';

  const html = `
    <section class="section container">
      <div class="page-head">
        <h1>Explorar a vitrine</h1>
        <p class="muted">Filtre por categoria, tipo ou busque pelo nome do item.</p>
      </div>

      <div class="filters">
        <div class="search-box">
          <span>🔎</span>
          <input id="searchInput" type="search" placeholder="Buscar (ex: cálculo, arduino, jaleco...)" value="${esc(q)}" />
        </div>
        <div class="filter-row">
          <select id="typeSelect" class="select">
            <option value="" ${type === '' ? 'selected' : ''}>Tipo: todos</option>
            <option value="venda" ${type === 'venda' ? 'selected' : ''}>À venda</option>
            <option value="doacao" ${type === 'doacao' ? 'selected' : ''}>Doações</option>
          </select>
          <select id="sortSelect" class="select">
            <option value="recent" ${sort === 'recent' ? 'selected' : ''}>Mais recentes</option>
            <option value="price_asc" ${sort === 'price_asc' ? 'selected' : ''}>Menor preço</option>
            <option value="price_desc" ${sort === 'price_desc' ? 'selected' : ''}>Maior preço</option>
          </select>
        </div>
      </div>

      ${categoryChips(active, '/explorar')}
      <div class="results-count muted" id="resultsCount"></div>
      <div id="exploreItems"></div>
    </section>
  `;

  async function load() {
    const box = document.getElementById('exploreItems');
    const count = document.getElementById('resultsCount');
    box.innerHTML = skeletonGrid(8);
    const p = {
      category: active === 'Todos' ? '' : active,
      q: document.getElementById('searchInput')?.value || '',
      type: document.getElementById('typeSelect')?.value || '',
      sort: document.getElementById('sortSelect')?.value || 'recent',
      limit: 60,
    };
    try {
      const { items } = await api.listItems(p);
      count.textContent = `${items.length} ${items.length === 1 ? 'item encontrado' : 'itens encontrados'}`;
      box.innerHTML = grid(items);
    } catch (e) {
      box.innerHTML = `<div class="empty-state"><div class="empty-emoji">⚠️</div><p>${esc(e.message)}</p></div>`;
    }
  }

  function onMount() {
    load();
    let t;
    const debounced = () => {
      clearTimeout(t);
      t = setTimeout(load, 300);
    };
    document.getElementById('searchInput')?.addEventListener('input', debounced);
    document.getElementById('typeSelect')?.addEventListener('change', load);
    document.getElementById('sortSelect')?.addEventListener('change', load);
  }

  return { html, onMount };
}

// ---------------------------------------------------------------------------
// ANUNCIAR (formulário protegido)
// ---------------------------------------------------------------------------
function anunciar() {
  if (!session.isLoggedIn()) {
    return {
      html: authGate(
        'Anuncie seu item',
        'Você precisa estar logado para cadastrar um anúncio. É rápido: só nome, e-mail e senha.'
      ),
      onMount: bindAuthGate,
    };
  }

  const catOptions = CATEGORIES.map((c) => `<option value="${c}">${CATEGORY_ICONS[c]} ${c}</option>`).join('');

  const html = `
    <section class="section container narrow">
      <div class="page-head">
        <h1>Anunciar um item</h1>
        <p class="muted">Preencha os dados abaixo. Itens com foto recebem muito mais interesse!</p>
      </div>

      <form id="itemForm" class="form-card" novalidate>
        <div class="type-toggle" role="group" aria-label="Tipo de anúncio">
          <button type="button" class="tt-btn active" data-type="venda">💰 Vender</button>
          <button type="button" class="tt-btn" data-type="doacao">🎁 Doar</button>
          <input type="hidden" name="type" value="venda" />
        </div>

        <div class="field">
          <label for="f-title">Título *</label>
          <input id="f-title" name="title" maxlength="120" placeholder="Ex: Livro de Cálculo Volume 1" required />
          <small class="field-error" data-error="title"></small>
        </div>

        <div class="grid-2">
          <div class="field">
            <label for="f-category">Categoria *</label>
            <select id="f-category" name="category" class="select" required>
              <option value="" disabled selected>Selecione...</option>
              ${catOptions}
            </select>
            <small class="field-error" data-error="category"></small>
          </div>
          <div class="field" id="priceField">
            <label for="f-price">Preço (R$) *</label>
            <input id="f-price" name="price" type="number" min="0" step="0.01" placeholder="0,00" />
            <small class="field-error" data-error="price"></small>
          </div>
        </div>

        <div class="grid-2">
          <div class="field">
            <label for="f-condition">Condição</label>
            <select id="f-condition" name="condition" class="select">
              <option value="novo">Novo</option>
              <option value="seminovo">Seminovo</option>
              <option value="usado" selected>Usado</option>
            </select>
          </div>
          <div class="field">
            <label for="f-campus">Local / Campus</label>
            <input id="f-campus" name="campus" maxlength="120" placeholder="Ex: Bloco K, UNIFOR" />
          </div>
        </div>

        <div class="field">
          <label for="f-image">URL da imagem</label>
          <input id="f-image" name="image_url" placeholder="https://... (link de uma foto do item)" />
          <small class="field-error" data-error="image_url"></small>
          <div class="img-preview" id="imgPreview" hidden><img alt="Prévia" /></div>
        </div>

        <div class="field">
          <label for="f-contact">Contato (WhatsApp ou e-mail)</label>
          <input id="f-contact" name="contact" maxlength="120" placeholder="(85) 99999-9999" />
        </div>

        <div class="field">
          <label for="f-desc">Descrição</label>
          <textarea id="f-desc" name="description" rows="4" maxlength="2000" placeholder="Conte o estado do item, motivo do desapego, detalhes importantes..."></textarea>
        </div>

        <button type="submit" class="btn btn-primary btn-lg btn-block" id="submitBtn">Publicar anúncio</button>
      </form>
    </section>
  `;

  function onMount() {
    const form = document.getElementById('itemForm');
    const typeInput = form.querySelector('input[name="type"]');
    const priceField = document.getElementById('priceField');
    const priceInput = document.getElementById('f-price');

    // Alterna Vender / Doar
    form.querySelectorAll('.tt-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        form.querySelectorAll('.tt-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const t = btn.dataset.type;
        typeInput.value = t;
        priceField.style.display = t === 'doacao' ? 'none' : '';
      });
    });

    // Prévia da imagem
    const imgInput = document.getElementById('f-image');
    const preview = document.getElementById('imgPreview');
    imgInput.addEventListener('input', () => {
      const url = imgInput.value.trim();
      if (/^https?:\/\/.+/i.test(url)) {
        preview.querySelector('img').src = url;
        preview.hidden = false;
      } else {
        preview.hidden = true;
      }
    });

    // Envio
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      form.querySelectorAll('.field-error').forEach((el) => (el.textContent = ''));
      const btn = document.getElementById('submitBtn');
      btn.disabled = true;
      btn.textContent = 'Publicando...';

      const fd = new FormData(form);
      const payload = Object.fromEntries(fd.entries());
      if (payload.type === 'doacao') payload.price = 0;

      try {
        await api.createItem(payload);
        toast('Anúncio publicado com sucesso! 🎉', 'success');
        navigate('/meus');
      } catch (err) {
        if (err.fields) {
          Object.entries(err.fields).forEach(([field, msg]) => {
            const el = form.querySelector(`[data-error="${field}"]`);
            if (el) el.textContent = msg;
          });
          toast('Revise os campos destacados.', 'error');
        } else {
          toast(err.message, 'error');
        }
        btn.disabled = false;
        btn.textContent = 'Publicar anúncio';
      }
    });
  }

  return { html, onMount };
}

// ---------------------------------------------------------------------------
// MEUS ANÚNCIOS (protegido)
// ---------------------------------------------------------------------------
function meus() {
  if (!session.isLoggedIn()) {
    return {
      html: authGate('Meus anúncios', 'Faça login para ver e gerenciar os itens que você cadastrou.'),
      onMount: bindAuthGate,
    };
  }

  const html = `
    <section class="section container">
      <div class="section-head">
        <div>
          <h1>Meus anúncios</h1>
          <p class="muted">Gerencie os itens que você cadastrou.</p>
        </div>
        <a class="btn btn-primary" href="#/anunciar" data-link>+ Novo anúncio</a>
      </div>
      <div id="myItems"></div>
    </section>
  `;

  async function onMount() {
    const box = document.getElementById('myItems');
    box.innerHTML = skeletonGrid(3);
    try {
      const { items } = await api.myItems();
      if (!items.length) {
        box.innerHTML = `<div class="empty-state">
          <div class="empty-emoji">📦</div>
          <p>Você ainda não tem anúncios.</p>
          <a class="btn btn-primary" href="#/anunciar" data-link>Criar meu primeiro anúncio</a>
        </div>`;
        return;
      }
      box.innerHTML = `<div class="items-grid">${items
        .map(
          (it) => `
        <article class="item-card owned">
          ${itemThumb(it)}
          <div class="item-body">
            <h3 class="item-title">${esc(it.title)}</h3>
            <p class="item-desc">${esc(it.description || 'Sem descrição.')}</p>
            <div class="owned-actions">
              <button class="btn btn-sm btn-outline" data-edit="${esc(it.id)}">✏️ Editar</button>
              <button class="btn btn-sm btn-danger" data-delete="${esc(it.id)}">🗑️ Excluir</button>
            </div>
          </div>
        </article>`
        )
        .join('')}</div>`;

      // Excluir
      box.querySelectorAll('[data-delete]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.delete;
          if (!confirm('Tem certeza que deseja excluir este anúncio?')) return;
          btn.disabled = true;
          try {
            await api.deleteItem(id);
            toast('Anúncio excluído.', 'success');
            rerender();
          } catch (e) {
            toast(e.message, 'error');
            btn.disabled = false;
          }
        });
      });

      // Editar
      box.querySelectorAll('[data-edit]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const item = items.find((i) => i.id === btn.dataset.edit);
          if (item) openEditModal(item);
        });
      });
    } catch (e) {
      box.innerHTML = `<div class="empty-state"><div class="empty-emoji">⚠️</div><p>${esc(e.message)}</p></div>`;
    }
  }

  return { html, onMount };
}

function itemThumb(item) {
  const badge = item.type === 'doacao'
    ? `<span class="badge badge-donation">Doação</span>`
    : `<span class="badge badge-sale">${formatPrice(item)}</span>`;
  const img = item.image_url
    ? `<img src="${esc(item.image_url)}" alt="${esc(item.title)}" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'card-noimg',textContent:'${CATEGORY_ICONS[item.category] || '📦'}'}))" />`
    : `<div class="card-noimg">${CATEGORY_ICONS[item.category] || '📦'}</div>`;
  return `<div class="item-thumb">${img}${badge}<span class="item-cat">${CATEGORY_ICONS[item.category] || '📦'} ${esc(item.category)}</span></div>`;
}

// ---------------------------------------------------------------------------
// PERFIL
// ---------------------------------------------------------------------------
function perfil() {
  if (!session.isLoggedIn()) {
    return {
      html: authGate('Seu perfil', 'Entre ou crie uma conta para anunciar itens e acompanhar seus desapegos.'),
      onMount: bindAuthGate,
    };
  }
  const user = session.getUser();
  const html = `
    <section class="section container narrow">
      <div class="profile-card">
        <div class="avatar">${esc((user.name || '?').charAt(0).toUpperCase())}</div>
        <h1>${esc(user.name)}</h1>
        <p class="muted">${esc(user.email)}</p>
        <div class="profile-stats" id="profileStats"><span class="muted">Carregando seus anúncios...</span></div>
        <div class="profile-actions">
          <a class="btn btn-primary" href="#/anunciar" data-link>+ Anunciar item</a>
          <a class="btn btn-outline" href="#/meus" data-link>Ver meus anúncios</a>
          <button class="btn btn-ghost" id="logoutBtn">Sair da conta</button>
        </div>
      </div>
    </section>
  `;
  async function onMount() {
    document.getElementById('logoutBtn').addEventListener('click', () => {
      session.clear();
      toast('Você saiu da conta.', 'info');
      window.dispatchEvent(new CustomEvent('auth:changed'));
      navigate('/');
    });
    try {
      const { count } = await api.myItems();
      document.getElementById('profileStats').innerHTML =
        `<div class="pstat"><strong>${count}</strong><span>anúncios ativos</span></div>`;
    } catch {
      document.getElementById('profileStats').textContent = '';
    }
  }
  return { html, onMount };
}

// ---------------------------------------------------------------------------
// Portão de autenticação (quando a rota exige login)
// ---------------------------------------------------------------------------
function authGate(title, message) {
  return `
    <section class="section container narrow">
      <div class="gate-card">
        <div class="gate-emoji">🔐</div>
        <h1>${esc(title)}</h1>
        <p class="muted">${esc(message)}</p>
        <button class="btn btn-primary btn-lg" id="gateLogin">Entrar / Criar conta</button>
      </div>
    </section>`;
}
function bindAuthGate() {
  document.getElementById('gateLogin')?.addEventListener('click', () => openAuthModal('login'));
}

// ---------------------------------------------------------------------------
// Modal de autenticação (login + cadastro)
// ---------------------------------------------------------------------------
export function openAuthModal(mode = 'login') {
  const isLogin = mode === 'login';
  const card = openModal(`
    <div class="auth-modal">
      <h2>${isLogin ? 'Entrar' : 'Criar conta'}</h2>
      <p class="muted">${isLogin ? 'Bem-vindo(a) de volta!' : 'Leva menos de um minuto.'}</p>
      <div class="demo-hint">💡 Conta demo: <b>demo@unifor.br</b> / <b>123456</b></div>
      <form id="authForm">
        <div class="field name-field" ${isLogin ? 'hidden' : ''}>
          <label>Nome</label>
          <input name="name" placeholder="Seu nome" ${isLogin ? '' : 'required'} />
        </div>
        <div class="field">
          <label>E-mail</label>
          <input name="email" type="email" placeholder="voce@unifor.br" required />
        </div>
        <div class="field">
          <label>Senha</label>
          <input name="password" type="password" placeholder="mínimo 6 caracteres" required />
        </div>
        <p class="auth-error" id="authError"></p>
        <button type="submit" class="btn btn-primary btn-block btn-lg" id="authSubmit">
          ${isLogin ? 'Entrar' : 'Cadastrar'}
        </button>
      </form>
      <p class="auth-switch">
        ${isLogin ? 'Ainda não tem conta?' : 'Já tem conta?'}
        <a href="#" id="authSwitch">${isLogin ? 'Cadastre-se' : 'Entrar'}</a>
      </p>
    </div>
  `);

  card.querySelector('#authSwitch').addEventListener('click', (e) => {
    e.preventDefault();
    openAuthModal(isLogin ? 'register' : 'login');
  });

  const form = card.querySelector('#authForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = card.querySelector('#authError');
    errEl.textContent = '';
    const btn = card.querySelector('#authSubmit');
    btn.disabled = true;
    btn.textContent = 'Aguarde...';

    const payload = Object.fromEntries(new FormData(form).entries());
    try {
      const res = isLogin ? await api.login(payload) : await api.register(payload);
      session.set(res.token, res.user);
      toast(`Olá, ${res.user.name.split(' ')[0]}! 👋`, 'success');
      closeModal();
      window.dispatchEvent(new CustomEvent('auth:changed'));
    } catch (err) {
      errEl.textContent = err.message + (err.fields ? ' ' + Object.values(err.fields).join(' ') : '');
      btn.disabled = false;
      btn.textContent = isLogin ? 'Entrar' : 'Cadastrar';
    }
  });
}

// ---------------------------------------------------------------------------
// Modal de detalhe do item
// ---------------------------------------------------------------------------
export async function openItemModal(id) {
  const card = openModal(`<div class="item-modal"><div class="skeleton sk-modal"></div></div>`);
  try {
    const { item } = await api.getItem(id);
    const img = item.image_url
      ? `<img class="im-img" src="${esc(item.image_url)}" alt="${esc(item.title)}" onerror="this.style.display='none'" />`
      : `<div class="im-noimg">${CATEGORY_ICONS[item.category] || '📦'}</div>`;
    const contact = item.contact
      ? `<a class="btn btn-primary btn-block btn-lg" href="${esc(contactHref(item.contact))}" target="_blank" rel="noopener">Falar com ${esc((item.owner_name || '').split(' ')[0] || 'anunciante')}</a>`
      : `<p class="muted">O anunciante não informou contato.</p>`;
    card.querySelector('.item-modal').innerHTML = `
      ${img}
      <div class="im-head">
        <span class="badge ${item.type === 'doacao' ? 'badge-donation' : 'badge-sale'}">${formatPrice(item)}</span>
        <span class="im-cat">${CATEGORY_ICONS[item.category]} ${esc(item.category)} · ${esc(item.condition || 'usado')}</span>
      </div>
      <h2>${esc(item.title)}</h2>
      <p class="im-desc">${esc(item.description || 'Sem descrição.')}</p>
      <ul class="im-meta">
        <li>👤 ${esc(item.owner_name || 'Anônimo')}</li>
        ${item.campus ? `<li>📍 ${esc(item.campus)}</li>` : ''}
        <li>🕒 ${timeAgo(item.created_at)}</li>
      </ul>
      ${contact}
    `;
  } catch (e) {
    card.querySelector('.item-modal').innerHTML = `<p class="muted">${esc(e.message)}</p>`;
  }
}

function contactHref(contact) {
  const digits = contact.replace(/\D/g, '');
  if (digits.length >= 10) return `https://wa.me/55${digits}`;
  if (contact.includes('@')) return `mailto:${contact}`;
  return '#';
}

// ---------------------------------------------------------------------------
// Modal de edição de item
// ---------------------------------------------------------------------------
function openEditModal(item) {
  const catOptions = CATEGORIES.map(
    (c) => `<option value="${c}" ${c === item.category ? 'selected' : ''}>${CATEGORY_ICONS[c]} ${c}</option>`
  ).join('');
  const card = openModal(`
    <div class="auth-modal">
      <h2>Editar anúncio</h2>
      <form id="editForm">
        <div class="field"><label>Título</label><input name="title" value="${esc(item.title)}" required /></div>
        <div class="grid-2">
          <div class="field"><label>Categoria</label><select name="category" class="select">${catOptions}</select></div>
          <div class="field"><label>Preço (R$)</label><input name="price" type="number" min="0" step="0.01" value="${item.price}" /></div>
        </div>
        <div class="field"><label>URL da imagem</label><input name="image_url" value="${esc(item.image_url || '')}" /></div>
        <div class="field"><label>Descrição</label><textarea name="description" rows="3">${esc(item.description || '')}</textarea></div>
        <p class="auth-error" id="editError"></p>
        <button type="submit" class="btn btn-primary btn-block btn-lg">Salvar alterações</button>
      </form>
    </div>
  `);
  const form = card.querySelector('#editForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(form).entries());
    try {
      await api.updateItem(item.id, payload);
      toast('Anúncio atualizado!', 'success');
      closeModal();
      rerender();
    } catch (err) {
      card.querySelector('#editError').textContent =
        err.message + (err.fields ? ' ' + Object.values(err.fields).join(' ') : '');
    }
  });
}

// ---------------------------------------------------------------------------
// Mapa de rotas
// ---------------------------------------------------------------------------
export const views = {
  home,
  explorar,
  anunciar,
  meus,
  perfil,
  notFound: () => ({
    html: `<section class="section container"><div class="empty-state"><div class="empty-emoji">🤷</div><p>Página não encontrada.</p><a class="btn btn-primary" href="#/" data-link>Voltar ao início</a></div></section>`,
  }),
};
