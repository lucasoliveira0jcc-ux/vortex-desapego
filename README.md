# ♻️ Vortex Desapego — Marketplace de Economia Circular do Campus

> Plataforma web/PWA de **desapego universitário**: estudantes doam, vendem e encontram livros, calculadoras, jalecos, eletrônicos e móveis dentro do campus da UNIFOR. Menos desperdício, mais acesso para quem está ingressando na universidade.
>
> Projeto desenvolvido para o **Desafio Técnico do Laboratório de Inovação Vortex — Processo Seletivo 2026**.

![Node](https://img.shields.io/badge/Node.js-24-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/API-Express-000000?logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/DB-SQLite%20(node%3Asqlite)-003B57?logo=sqlite&logoColor=white)
![PWA](https://img.shields.io/badge/Frontend-PWA-5A0FC8?logo=pwa&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT-EB5424?logo=jsonwebtokens&logoColor=white)

---

## 📌 Índice

- [Visão geral da proposta](#-visão-geral-da-proposta)
- [Funcionalidades](#-funcionalidades)
- [Arquitetura e estrutura de pastas](#-arquitetura-e-estrutura-de-pastas)
- [Tecnologias utilizadas](#-tecnologias-utilizadas)
- [Como rodar o projeto (passo a passo)](#-como-rodar-o-projeto-passo-a-passo)
- [Documentação da API REST](#-documentação-da-api-rest)
- [PWA: manifesto, service worker e instalação](#-pwa-manifesto-service-worker-e-instalação)
- [Deploy (opcional)](#-deploy-opcional)
- [🤖 Diário de Bordo da IA](#-diário-de-bordo-da-ia)
- [Autor](#-autor)

---

## 🎯 Visão geral da proposta

Todo semestre, milhares de universitários acumulam materiais que deixam de usar: livros de cadeiras já concluídas, jalecos de estágios encerrados, calculadoras, componentes de eletrônica, móveis de repúblicas desfeitas. Ao mesmo tempo, calouros gastam muito para adquirir esses mesmos itens.

O **Vortex Desapego** conecta essas duas pontas dentro do campus, incentivando a **economia circular**: o que sobra para um estudante vira oportunidade (ou doação) para outro. A plataforma tem duas faces integradas:

- **Landing Page (desktop):** apresenta a proposta, exibe estatísticas do sistema e uma vitrine pública com os últimos anúncios e filtros por categoria.
- **App mobile (PWA):** experiência de aplicativo instalável, onde o usuário autenticado anuncia itens e gerencia seus próprios anúncios.

---

## ✨ Funcionalidades

### Requisitos obrigatórios atendidos ✅

**Backend (API REST)**
- ✅ API REST estruturada em Node.js/Express.
- ✅ CRUD completo de anúncios: **criar, listar, filtrar e deletar** (+ editar).
- ✅ Persistência funcional em arquivo (**SQLite** via `node:sqlite`).
- ✅ Todo o tráfego em **JSON**.

**Frontend & PWA**
- ✅ Interface em tecnologias web modernas (HTML5 + CSS3 + JavaScript ES Modules, bem estruturados em módulos).
- ✅ **`manifest.webmanifest` válido** + **Service Worker** → app instalável na tela inicial.
- ✅ **Responsividade completa**: landing rica no desktop ⇄ experiência de app no mobile (com _tab bar_ inferior).

### Diferenciais (bônus) implementados ⭐

- ⭐ **Autenticação JWT** com senhas protegidas por hash (`bcryptjs`).
- ⭐ **Validação robusta** de campos e **tratamento de erros** (respostas 400/401/403/404/409 com mensagens claras por campo).
- ⭐ Separação de dados **por usuário** (cada um vê e gerencia só os próprios anúncios).
- ⭐ **Service Worker com estratégias de cache** (network-first para API com _fallback_ offline, stale-while-revalidate para assets, cache-first para imagens) → **visualização offline dos dados já carregados**.
- ⭐ Interface polida: _skeletons_ de carregamento, _toasts_, modais, transições suaves, ícone maskable gerado por script.
- ⭐ Ícones do PWA (192/512/maskable/favicon/apple-touch) **gerados por código**, sem depender de ferramentas externas.
- ⭐ Endpoint de **estatísticas** (reais + simuladas) para a landing.

---

## 🗂 Arquitetura e estrutura de pastas

Monorepo com backend e frontend **totalmente desacoplados** (podem ser deployados separadamente):

```
Projeto unifor/
├── backend/                      # API RESTful (Node.js + Express)
│   ├── src/
│   │   ├── server.js             # Entrada: middlewares, rotas, tratamento de erros
│   │   ├── config.js             # Env vars + categorias/constantes
│   │   ├── db.js                 # SQLite (node:sqlite) + schema + seed inicial
│   │   ├── auth.js               # JWT: signToken, requireAuth, optionalAuth
│   │   ├── validate.js           # Validação de anúncios e cadastro
│   │   └── routes/
│   │       ├── auth.routes.js    # /register /login /me
│   │       ├── items.routes.js   # CRUD + filtros de anúncios
│   │       └── stats.routes.js   # Estatísticas da landing
│   ├── .env.example
│   └── package.json
│
├── frontend/                     # PWA (SPA em ES Modules, sem build)
│   ├── index.html                # Shell da SPA (header, main, tabbar, footer)
│   ├── offline.html              # Página de fallback offline
│   ├── manifest.webmanifest      # Manifesto do PWA
│   ├── sw.js                     # Service Worker (estratégias de cache)
│   ├── css/styles.css            # Estilos (mobile-first, responsivo)
│   ├── js/
│   │   ├── app.js                # Roteador por hash + bootstrap + registro do SW
│   │   ├── views.js              # Renderização das telas (home, explorar, anunciar...)
│   │   ├── api.js                # Cliente HTTP (fetch + JWT)
│   │   ├── session.js            # Sessão do usuário (localStorage)
│   │   ├── ui.js                 # Helpers: toasts, modais, formatação, escape
│   │   ├── nav.js                # Navegação compartilhada
│   │   └── config.js             # Detecção da URL da API + categorias
│   ├── icons/                    # Ícones PNG gerados
│   ├── scripts/generate-icons.mjs# Gerador de ícones (PNG na mão, via zlib)
│   └── server.js                 # Servidor estático mínimo (sem dependências)
│
└── README.md
```

**Por que SPA em ES Modules puro (sem React/build)?** Para manter o projeto **fácil de rodar, de auditar e de explicar na banca** — cada arquivo tem uma responsabilidade clara e o código roda direto no navegador, sem transpilação. As estratégias de PWA (manifest + service worker) ficam explícitas e didáticas.

---

## 🛠 Tecnologias utilizadas

| Camada        | Tecnologia | Papel |
|---------------|-----------|-------|
| **Backend**   | Node.js 24 | Runtime |
|               | Express 4 | Framework da API REST |
|               | `node:sqlite` | Banco relacional em arquivo (nativo, sem build) |
|               | jsonwebtoken | Autenticação JWT |
|               | bcryptjs | Hash de senhas |
|               | cors | Liberação de origem para o frontend |
| **Frontend**  | HTML5 + CSS3 | Estrutura e estilo (mobile-first) |
|               | JavaScript (ES Modules) | Lógica da SPA, sem framework/build |
|               | Service Worker + Web App Manifest | Recursos de PWA (offline + instalação) |
|               | Fetch API | Comunicação com o backend |

> **Nota sobre o banco:** o desafio permite banco em arquivo (SQLite) ou em memória. Optei pelo **`node:sqlite`** (SQLite nativo do Node 24) porque entrega SQL de verdade **sem nenhuma dependência nativa que precise ser compilada** — evitando os problemas clássicos de instalação do `better-sqlite3` no Windows. Migrar para PostgreSQL/MongoDB exigiria trocar apenas o arquivo `db.js`.

---

## 🚀 Como rodar o projeto (passo a passo)

### Pré-requisitos
- **Node.js 22.5 ou superior** (recomendado **24+**, testado no 24). O SQLite nativo (`node:sqlite`) exige essa versão.
- **npm** (vem com o Node).
- Nenhum banco de dados externo é necessário — o SQLite é criado automaticamente.

Verifique sua versão:
```bash
node --version   # deve mostrar v22.5+ (ideal v24+)
```

### 1️⃣ Backend (API)

Abra um terminal na pasta do projeto:

```bash
cd backend
npm install          # instala express, cors, jsonwebtoken, bcryptjs
npm start            # sobe a API em http://localhost:4000
```

Na primeira execução o banco é criado e **populado automaticamente** com uma conta demo e 6 anúncios de exemplo. Você verá:

```
🌱 Banco populado com usuário demo (demo@unifor.br / 123456) e 6 anúncios.
🚀 Vortex Desapego API rodando! → http://localhost:4000
```

> Opcional: copie `.env.example` para `.env` para customizar `PORT`, `JWT_SECRET`, etc.

### 2️⃣ Frontend (PWA)

Abra **outro** terminal (deixe a API rodando):

```bash
cd frontend
npm start            # sobe a PWA em http://localhost:5173
```

> O frontend usa um servidor estático próprio (sem dependências). Service Workers só funcionam em _secure context_ — `http://localhost` conta como seguro, então tudo funciona localmente. **Não** abra o `index.html` via `file://`, pois o SW e o `fetch` não funcionam nesse esquema.

### 3️⃣ Acessar

Abra **http://localhost:5173** no navegador.

- **Conta demo para testar rápido:** `demo@unifor.br` / `123456`
- Ou clique em **Entrar → Cadastre-se** e crie a sua conta.

### 4️⃣ Testar a experiência mobile / PWA

1. Abra o **DevTools** (F12) → ícone de dispositivo (📱 _Toggle device toolbar_) e escolha um celular (ex.: iPhone/Pixel). A navegação passa a exibir a **tab bar inferior** de app.
2. Para **instalar**: no Chrome desktop aparece o botão **"⤓ Instalar app"** no cabeçalho (ou o ícone de instalar na barra de endereço); no celular, use **"Adicionar à tela inicial"**.
3. Para testar **offline**: em DevTools → aba _Network_ → marque **Offline** e recarregue. Os anúncios já carregados continuam visíveis (cache do Service Worker).

---

## 📡 Documentação da API REST

Base URL local: `http://localhost:4000`

| Método | Rota | Auth | Descrição |
|--------|------|:----:|-----------|
| `GET` | `/api/health` | — | Status da API |
| `GET` | `/api/categories` | — | Lista de categorias |
| `GET` | `/api/stats` | — | Estatísticas (reais + simuladas) para a landing |
| `POST` | `/api/auth/register` | — | Cadastro `{ name, email, password }` → `{ token, user }` |
| `POST` | `/api/auth/login` | — | Login `{ email, password }` → `{ token, user }` |
| `GET` | `/api/auth/me` | 🔒 | Dados do usuário logado |
| `GET` | `/api/items` | — | Lista pública. Filtros: `?category=&q=&type=venda\|doacao&sort=recent\|price_asc\|price_desc&limit=` |
| `GET` | `/api/items/mine` | 🔒 | Anúncios do usuário logado |
| `GET` | `/api/items/:id` | — | Detalhe de um anúncio |
| `POST` | `/api/items` | 🔒 | Cria anúncio |
| `PUT` | `/api/items/:id` | 🔒 | Edita anúncio (somente o dono) |
| `DELETE` | `/api/items/:id` | 🔒 | Remove anúncio (somente o dono) |

🔒 = requer header `Authorization: Bearer <token>`.

**Exemplos com `curl`:**

```bash
# Listar itens da categoria Livros
curl "http://localhost:4000/api/items?category=Livros"

# Login (guarde o token retornado)
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@unifor.br","password":"123456"}'

# Criar um anúncio (troque <TOKEN>)
curl -X POST http://localhost:4000/api/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"title":"Livro de Física","category":"Livros","type":"venda","price":50}'
```

**Corpo de um anúncio:**
```json
{
  "title": "Cálculo - Volume 1",
  "description": "Ótimo estado, sem grifos",
  "category": "Livros",
  "type": "venda",
  "price": 90,
  "condition": "seminovo",
  "image_url": "https://...",
  "contact": "(85) 99999-0000",
  "campus": "Bloco K"
}
```

---

## 📱 PWA: manifesto, service worker e instalação

- **`manifest.webmanifest`** — nome, ícones (incluindo `maskable`), `theme_color`, `display: standalone`, atalhos (_shortcuts_) e `start_url`. É o que permite "instalar" o app.
- **`sw.js` (Service Worker)** — implementa 4 estratégias:
  1. **App shell** — _precache_ dos arquivos essenciais no `install` (o app abre offline).
  2. **Navegação (HTML)** — _network-first_ com _fallback_ para `offline.html`.
  3. **API (`GET /api/...`)** — _network-first_ com **cache de _fallback_** → dados já vistos aparecem offline.
  4. **Assets/imagens** — _stale-while-revalidate_ / _cache-first_.

Os ícones são **gerados por código** (`frontend/scripts/generate-icons.mjs`) — um codificador PNG escrito à mão usando apenas o `zlib` nativo, desenhando a "folha" da economia circular. Para regenerar:
```bash
cd frontend && npm run icons
```

---

## 🌍 Deploy (opcional)

O projeto foi pensado para deploy **separado** de backend e frontend:

- **Backend** → Render / Railway / Fly.io
  - Comando de start: `npm start` · Porta via `process.env.PORT` (já suportado).
  - Garanta **Node 22.5+** no serviço (por causa do `node:sqlite`).
- **Frontend** → Vercel / Netlify / GitHub Pages
  - São arquivos estáticos. Basta apontar a raiz para `frontend/`.
  - **Importante:** em produção, defina a URL da API adicionando no `index.html`, antes de `js/app.js`:
    ```html
    <script>window.__API_URL__ = "https://SUA-API.onrender.com/api";</script>
    ```

> **Links de produção:** _(preencha aqui após o deploy)_
> - 🌐 Frontend: `https://...`
> - 🔗 API: `https://...`

---

## 🤖 Diário de Bordo da IA

Esta seção documenta, de forma transparente, como utilizei IA generativa como **ferramenta de produtividade e aprendizado** durante o desenvolvimento — conforme exigido pelo edital.

### 🧰 Ferramentas utilizadas

- **Claude (Anthropic)** — parceiro principal de arquitetura, geração de código, revisão e depuração.
- **GitHub Copilot** — autocompletar durante a escrita, especialmente em trechos repetitivos (CSS, mapeamento de rotas).
- _(Adapte esta lista às ferramentas que **você** de fato usou: ChatGPT, v0, Lovable, etc.)_

### 🧠 Estratégia de engenharia de prompts

Minha estratégia foi **não pedir "faça o projeto inteiro"**, e sim quebrar o desafio em decisões e blocos, sempre pedindo à IA que **justificasse** as escolhas para eu poder validar. Alguns prompts reais que destravaram o desenvolvimento:

**Prompt 1 — Decisão de arquitetura e persistência (evitando armadilhas de ambiente):**
> "Preciso de uma API REST para um marketplace de desapego universitário rodando em **Windows com Node 24**. Quero persistência real em SQLite, mas **sem dependências nativas que precisem compilar** (já tive problemas com `better-sqlite3` exigindo build tools). Quais são minhas opções? Compare `better-sqlite3`, o `node:sqlite` nativo e um store em JSON, e recomende uma para um projeto que a banca precisa clonar e rodar sem fricção. Depois esboce a camada `db.js` com schema de `users` e `items` e um seed inicial."

**Prompt 2 — Service Worker com múltiplas estratégias de cache:**
> "Escreva um Service Worker para uma PWA (HTML/JS puro) que: (1) faça _precache_ do app shell no `install`; (2) responda navegação HTML com _network-first_ e _fallback_ para `offline.html`; (3) trate requisições `GET` de API (`/api/...`) com _network-first_ **guardando a última resposta em cache** para funcionar offline; (4) use _stale-while-revalidate_ para CSS/JS e _cache-first_ para imagens externas. Versione os caches e limpe os antigos no `activate`. Explique cada bloco em comentário para eu conseguir apresentar isso na banca."

**Prompt 3 — Depuração de um erro específico:**
> "Ao testar via `curl` no Windows, meu `POST /api/items` com `\"category\":\"Móveis\"` retorna 400 dizendo categoria inválida, mas com `\"Livros\"` funciona. O código compara a categoria com uma lista fixa que contém 'Móveis'. O que pode estar acontecendo e como confirmo se o bug é no backend ou no meu teste?"

Esse último prompt levou à conclusão de que **o problema não estava no código**, e sim no _encoding_ do acento no terminal do Windows ao passar o JSON pelo `curl`. A confirmação veio ao testar o mesmo fluxo via `fetch` (que envia UTF-8 corretamente) — aí a categoria acentuada passou sem erro. Lição registrada: **testar o caminho real (o que o navegador faz), não só o atalho do terminal.**

### 🔍 Reflexão crítica — quando a IA errou

Dois momentos em que precisei corrigir/guiar a IA:

1. **Alucinação de API de banco:** em uma primeira versão do `db.js`, a IA misturou a sintaxe do `better-sqlite3` com a do `node:sqlite` (métodos como `.all()`/`.get()` existem em ambos, mas a criação da conexão é diferente: `new Database()` vs `new DatabaseSync()`). Percebi ao rodar e receber um erro de import. Corrigi fixando o alvo em `node:sqlite` e validando a query mínima antes de escrever o resto.

2. **Bug real que a IA introduziu (e eu peguei):** o Service Worker listava no _precache_ apenas parte dos módulos JS — faltavam `ui.js` e `nav.js`. Como esses arquivos existem, o app não quebrava, mas o **offline ficaria incompleto**. Detectei revisando o array `SHELL_ASSETS` contra a lista real de imports e adicionei os dois módulos que faltavam. Isso reforça que **código gerado por IA precisa de revisão humana** — o "parece que funciona" esconde furos.

> **(Opcional) Histórico público de uma conversa longa:** _cole aqui o link de um chat em que você debateu arquitetura/bugs com a IA (ChatGPT/Claude permitem gerar link público)._

---

## 👤 Autor

**Lucas Oliveira** — candidato ao estágio Full-Stack do Laboratório de Inovação **Vortex (UNIFOR, 2026)**.

- 💼 GitHub: https://github.com/SEU-USUARIO
- 🔗 LinkedIn: _(opcional)_
- 📧 Contato: _(opcional)_

> ℹ️ _Antes de publicar, confirme o nome acima e substitua `SEU-USUARIO` pelo seu usuário do GitHub._

---

<p align="center"><i>♻️ Menos desperdício, mais acesso. Feito com foco na comunidade universitária.</i></p>
