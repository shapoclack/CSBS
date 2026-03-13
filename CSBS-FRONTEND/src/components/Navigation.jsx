import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bot, MapPin, User } from 'lucide-react';
import cowLogo from '../assets/cow.png';
import AuthModal from './AuthModal';
import './Navigation.css';

export default function Navigation() {
    const location = useLocation();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authMode, setAuthMode] = useState('login');
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const checkAuth = () => setIsLoggedIn(localStorage.getItem('isAuthenticated') === 'true');
        checkAuth();
        window.addEventListener('authChange', checkAuth);
        return () => window.removeEventListener('authChange', checkAuth);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('isAuthenticated');
        window.dispatchEvent(new Event('authChange'));
    };

    const openAuthModal = (mode) => {
        setAuthMode(mode);
        setIsAuthModalOpen(true);
    };

    return (
        <nav className="navbar glass-panel">
            <div className="container nav-container">
                <Link to="/" className="nav-logo">
                    <img src={cowLogo} className="logo-icon neon-border" alt="Cow Logo" />
                    <span className="brand-name">COW</span>
                </Link>
                <div className="nav-links">
                    <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
                        Главная
                    </Link>
                    <Link to="/booking" className={`nav-link ${location.pathname === '/booking' ? 'active' : ''}`}>
                        Бронирование
                    </Link>
                    <Link to="/ai-assistant" className={`nav-link nav-link-ai ${location.pathname === '/ai-assistant' ? 'active' : ''}`}>
                        <Bot size={18} />
                        ИИ-Ассистент
                    </Link>
                    
                    {isLoggedIn && (
                        <Link to="/profile" className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}>
                            <User size={18} />
                            Личный кабинет
                        </Link>
                    )}
                    
                    {isLoggedIn ? (
                        <button className="btn btn-outline" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-main)' }} onClick={handleLogout}>
                            Выйти
                        </button>
                    ) : (
                        <button className="btn btn-primary" onClick={() => openAuthModal('login')}>
                            Вход/Регистрация
                        </button>
                    )}
                </div>
            </div>

            <AuthModal 
                isOpen={isAuthModalOpen} 
                onClose={() => setIsAuthModalOpen(false)} 
                initialMode={authMode} 
            />
        </nav>
    );
}
