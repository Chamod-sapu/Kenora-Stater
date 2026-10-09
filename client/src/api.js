import axios from 'axios';

const api = axios.create({ baseURL: '/api' });
api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

export const errMsg = (err) => {
  const e = err.response?.data?.error;
  const first = e?.details?.[0];
  return first?.path ? `${first.path.join('.')}: ${first.message}` : e?.message || 'Something went wrong';
};

export default api;