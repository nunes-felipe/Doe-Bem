import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('@doebem:token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const cadastrar = (dados) => api.post('/api/auth/cadastro', dados);
export const login = (dados) => api.post('/api/auth/login', dados);

export const listarDoacoes = (lat, lng) =>
  api.get('/api/doacoes', { params: { lat, lng } });
export const listarMinhasDoacoes = () => api.get('/api/doacoes/minhas');
export const detalheDoacao = (id) => api.get(`/api/doacoes/${id}`);
export const criarDoacao = (dados) => api.post('/api/doacoes', dados);
export const aceitarColeta = (id) => api.patch(`/api/doacoes/${id}/aceitar`);
export const cancelarDoacao = (id, motivo) =>
  api.patch(`/api/doacoes/${id}/cancelar`, { motivo });
export const confirmarEntrega = (id, dados) =>
  api.patch(`/api/doacoes/${id}/confirmar`, dados);

export const uploadFoto = (dados) => api.post('/api/uploads/foto', dados);

export const buscarPerfil = () => api.get('/api/usuarios/perfil');
export const buscarImpacto = () => api.get('/api/usuarios/impacto');
export const buscarImpactoMensal = () => api.get('/api/usuarios/impacto/mensal');
export const buscarDashboardOng = () => api.get('/api/usuarios/dashboard-ong');
export const buscarQrRecebimento = () => api.get('/api/usuarios/qr-recebimento');
export const atualizarPerfil = (dados) => api.patch('/api/usuarios/perfil', dados);
export const registrarPushToken = (push_token) =>
  api.patch('/api/usuarios/push-token', { push_token });
export const listarNotificacoes = () => api.get('/api/usuarios/notificacoes');
export const marcarNotificacaoLida = (id) =>
  api.patch(`/api/usuarios/notificacoes/${id}/lida`);

export default api;
