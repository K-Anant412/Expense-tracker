import axios from 'axios';

const API = axios.create({
    baseURL: "http://127.0.0.1:5000/api",
    headers: {
        'Content-Type': 'application/json',
    },
});

API.interceptors.request.use(
    ( config ) => {
        const token = localStorage.getItem('token');
        if ( token ) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    ( error ) => {
        return Promise.reject( error );
    }
);

export const authService = {
    register: (username, email, password) => API.post('/auth/register', { username, email, password }),
    login: (email, password) => API.post('/auth/login', { email, password }),
};

export const expenseService = {
  getCategories: () => API.get('/categories'),
  createCategory: (name) => API.post('/categories', { name }),
  getExpenses: () => API.get('/expenses'),
  createExpense: (expenseData) => API.post('/expenses', expenseData),
  getDashboardSummary: (month) => API.get(`/dashboard/summary?month=${month}`),
};

export default API;