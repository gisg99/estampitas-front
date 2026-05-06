const BASE = '/api';

const token = () => localStorage.getItem('token');

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token()}`,
});

export const login = (correo, password) =>
  fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo, password }),
  }).then(r => r.json());

export const signup = (nombre, correo, password, fecha_nacimiento, genero, seleccion_favorita, jugador_favorito) =>
  fetch(`${BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, correo, password, fecha_nacimiento, genero, seleccion_favorita, jugador_favorito }),
  }).then(r => r.json());

export const logout = () => localStorage.removeItem('token');

export const getSelecciones = () =>
  fetch(`${BASE}/selecciones`).then(r => r.json());

export const getStats = () =>
  fetch(`${BASE}/stats`, { headers: authHeaders() }).then(r => r.json());

export const getCollection = () =>
  fetch(`${BASE}/collection`, { headers: authHeaders() }).then(r => r.json());

export const addSticker = (id) =>
  fetch(`${BASE}/collection/${id}`, { method: 'POST', headers: authHeaders() }).then(r => r.json());

export const removeSticker = (id) =>
  fetch(`${BASE}/collection/${id}`, { method: 'DELETE', headers: authHeaders() }).then(r => r.json());

export const batchSetStickers = (changes) =>
  fetch(`${BASE}/collection`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ changes }),
  }).then(r => r.json());

export const getUser = () =>
  fetch(`${BASE}/user`, { headers: authHeaders() }).then(r => r.json());

export const updateUser = (data) =>
  fetch(`${BASE}/user`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(r => r.json());
