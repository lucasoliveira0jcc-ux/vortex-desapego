// Gerenciamento de sessão do usuário no navegador (token JWT + dados básicos),
// persistido no localStorage para o login sobreviver ao recarregar a página.
const TOKEN_KEY = 'vortex_token';
const USER_KEY = 'vortex_user';

export const session = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },
  getUser() {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY));
    } catch {
      return null;
    }
  },
  isLoggedIn() {
    return Boolean(this.getToken());
  },
  set(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};
