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
        // 204 No Content or empty body — return null
        if (res.status === 204) return null;
        const text = await res.text();
        if (!text) return null;
        return JSON.parse(text);
    },

    // ── Workspaces ──
    async getWorkspaces() {
        return this.fetchWithAuth('/workspaces');
    },
    async createWorkspace(data) {
        return this.fetchWithAuth('/workspaces', { method: 'POST', body: JSON.stringify(data) });
    },
    async updateWorkspace(id, data) {
        return this.fetchWithAuth(`/workspaces/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },
    async deleteWorkspace(id) {
        return this.fetchWithAuth(`/workspaces/${id}`, { method: 'DELETE' });
    },

    // ── Tariffs ──
    async getTariffs() {
        const res = await fetch(`${API_URL}/tariffs`);
        if (!res.ok) throw new Error('Failed to fetch tariffs');
        return res.json();
    },
    async createTariff(data) {
        return this.fetchWithAuth('/tariffs', { method: 'POST', body: JSON.stringify(data) });
    },
    async updateTariff(id, data) {
        return this.fetchWithAuth(`/tariffs/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },
    async deleteTariff(id) {
        return this.fetchWithAuth(`/tariffs/${id}`, { method: 'DELETE' });
    },

    // ── Reservations ──
    async getReservations() {
        return this.fetchWithAuth('/reservations');
    },
    async getAllReservations() {
        return this.fetchWithAuth('/reservations/all');
    },
    async createReservation(data) {
        return this.fetchWithAuth('/reservations', { method: 'POST', body: JSON.stringify(data) });
    },
    async getUnavailableWorkspaces(startTime, endTime) {
        return this.fetchWithAuth(`/reservations/availability?start_time=${encodeURIComponent(startTime)}&end_time=${encodeURIComponent(endTime)}`);
    },

    // ── Admin: Users ──
    async getAllUsers() {
        return this.fetchWithAuth('/admin/users');
    },
    async updateUserStatus(id, status) {
        return this.fetchWithAuth(`/admin/users/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
    },
    async updateUserRole(id, role) {
        return this.fetchWithAuth(`/admin/users/${id}/role`, {
            method: 'PUT',
            body: JSON.stringify({ role })
        });
    },

    // ── Audit Logs ──
    async getAuditLogs() {
        return this.fetchWithAuth('/auditlogs');
    },

    // ── AI Chat ──
    async sendAiMessage(message, history = []) {
        return this.fetchWithAuth('/chat', {
            method: 'POST',
            body: JSON.stringify({ message, history })
        });
    }
};
