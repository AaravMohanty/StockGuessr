import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

console.log('API_BASE_URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Log responses
api.interceptors.response.use(
  (response) => {
    console.log('Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('Response Error:', error.message);
    if (error.response) {
      console.error('Error Status:', error.response.status);
      console.error('Error Data:', error.response.data);
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  register: (email: string, username: string, password: string) =>
    api.post('/auth/register', { email, username, password }),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  getCurrentUser: () => api.get('/auth/me'),
};

// Scenarios endpoints
export const scenariosAPI = {
  getRandomScenario: () => api.get('/scenarios/random'),
  getAllScenarios: () => api.get('/scenarios'),
  getScenarioById: (id: string) => api.get(`/scenarios/${id}`),
};

// Matches endpoints
export const matchesAPI = {
  createMatch: (scenarioId?: string) =>
    api.post('/matches', { scenarioId }),
  joinMatch: (joinCode: string) =>
    api.post('/matches/join', { joinCode }),
  getMatch: (id: string) => api.get(`/matches/${id}`),
  updateMatch: (id: string, data: any) =>
    api.put(`/matches/${id}`, data),
  getUserMatches: (userId: string) =>
    api.get(`/matches/history/${userId}`),
  getAnalysis: (id: string) => api.get(`/matches/${id}/analysis`),
  addNote: (matchId: string, note: string) =>
    api.patch(`/matches/${matchId}/note`, { note }),
  deleteMatch: (id: string) => api.delete(`/matches/${id}`),
};

export default api;
