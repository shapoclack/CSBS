import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [isLoggedIn, setIsLoggedIn] = useState(
        () => localStorage.getItem('isAuthenticated') === 'true'
    );
    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
    });

    const login = useCallback(async (email, password) => {
        await authService.login(email, password);
        localStorage.setItem('isAuthenticated', 'true');
        const freshUser = await authService.getMe();
        localStorage.setItem('user', JSON.stringify(freshUser));
        setUser(freshUser);
        setIsLoggedIn(true);
        return freshUser;
    }, []);

    const register = useCallback(async (name, email, phone, password, role) => {
        await authService.register(name, email, phone, password, role);
        return login(email, password);
    }, [login]);

    const logout = useCallback(async () => {
        await authService.logout();
        setUser(null);
        setIsLoggedIn(false);
    }, []);

    const refreshUser = useCallback(async () => {
        try {
            const freshUser = await authService.getMe();
            if (freshUser) {
                setUser(freshUser);
                localStorage.setItem('user', JSON.stringify(freshUser));
            }
            return freshUser;
        } catch {
            setUser(null);
            setIsLoggedIn(false);
            localStorage.removeItem('user');
            localStorage.removeItem('isAuthenticated');
            return null;
        }
    }, []);

    return (
        <AuthContext.Provider value={{ isLoggedIn, user, login, register, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
