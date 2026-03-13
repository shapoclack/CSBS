const API_URL = 'http://localhost:8080/api';

export const authService = {
    async register(name, email, phone, password) {
        const res = await fetch(`${API_URL}/users/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, phone, password })
        });
        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(errorText || 'Registration failed');
        }
        return res.json();
    },

    async login(email, password) {
        const res = await fetch(`${API_URL}/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(errorText || 'Login failed');
        }
        const data = await res.json();
        if (data.token) {
            localStorage.setItem('auth_token', data.token);
        }
        return data;
    },

    async getMe() {
        const token = localStorage.getItem('auth_token');
        if (!token) return null;
        
        const res = await fetch(`${API_URL}/users/me`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!res.ok) {
            if (res.status === 401) {
                // Token invalid or expired
                localStorage.removeItem('auth_token');
            }
            throw new Error('Failed to fetch user');
        }
        return res.json();
    },

    logout() {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
        window.dispatchEvent(new Event('authChange'));
    }
};

export const apiService = {
    async fetchWithAuth(endpoint, options = {}) {
        const token = localStorage.getItem('auth_token');
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers
        });

        if (!res.ok) {
            if (res.status === 401) {
                authService.logout();
            }
            const errorText = await res.text();
            throw new Error(errorText || 'API Request Failed');
        }
        return res.json();
    },

    async getWorkspaces() {
        return this.fetchWithAuth('/workspaces');
    },

    async getReservations() {
        return this.fetchWithAuth('/reservations');
    },

    async createReservation(data) {
        return this.fetchWithAuth('/reservations', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
};
