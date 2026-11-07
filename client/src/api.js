import axios from 'axios';

const TOKEN_KEY = 'innoventure_token';

export const tokenStore = {
  get: () => { try { return sessionStorage.getItem(TOKEN_KEY); } catch { return null; } },
  set: (t) => { try { sessionStorage.setItem(TOKEN_KEY, t); } catch { /* ignore */ } },
  clear: () => { try { sessionStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ } }
};

const api = axios.create({ baseURL: '/api', timeout: 90000 });

api.interceptors.request.use((config) => {
  const t = tokenStore.get();
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const onLogin = window.location.pathname === '/login';
    if (err.response && err.response.status === 401 && !onLogin) {
      tokenStore.clear();
      window.location.assign('/login');
    }
    return Promise.reject(err);
  }
);

export function errorMessage(err) {
  return (err.response && err.response.data && err.response.data.error) || err.message || 'Something went wrong.';
}

export default api;
