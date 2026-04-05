const API_URL = 'http://localhost:8080/api';

export const authService = {
    async register(name, email, phone, password, role = 'client') {
        const res = await fetch(`${API_URL}/users/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ name, email, phone, password, role })
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
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });
        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(errorText || 'Login failed');
        }
        const data = await res.json();
        // The token is now set in an HttpOnly cookie by the backend,
        // so we don't store it in localStorage anymore.
        return data;
    },

    async getMe() {
        // We use isAuthenticated flag instead of auth_token existence to check if logged in
        if (localStorage.getItem('isAuthenticated') !== 'true') return null;
        
        const res = await fetch(`${API_URL}/users/me`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!res.ok) {
            if (res.status === 401) {
                // Token invalid or expired (cookie might be gone)
                localStorage.removeItem('isAuthenticated');
            }
            throw new Error('Failed to fetch user');
        }
        return res.json();
    },

    async logout() {
        try {
            await fetch(`${API_URL}/users/logout`, {
                method: 'POST',
                credentials: 'include',
            });
        } catch (e) {
            console.error('Logout request failed', e);
        }
        
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
        window.dispatchEvent(new Event('authChange'));
    }
};

export const apiService = {
    async fetchWithAuth(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };
        
        // Let the browser send the secure HttpOnly cookie for auth
        const res = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
            credentials: 'include' // crucial for cookies to be sent
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

    async getTariffs() {
        // Tariffs are public, no auth needed, but fetchWithAuth is fine or normal fetch
        const res = await fetch(`${API_URL}/tariffs`);
        if (!res.ok) throw new Error('Failed to fetch tariffs');
        return res.json();
    },

    async getReservations() {
        return this.fetchWithAuth('/reservations');
    },

    async createReservation(data) {
        return this.fetchWithAuth('/reservations', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async sendAiMessage(message) {
        return this.fetchWithAuth('/chat', {
            method: 'POST',
            body: JSON.stringify({ message })
        });
    }
};
