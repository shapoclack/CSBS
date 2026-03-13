import { useState, useEffect } from 'react';
import { User, Calendar, Settings, Users, ShieldAlert, CreditCard, Building2, Terminal } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { authService, apiService } from '../services/api';
import './Profile.css';

const maskEmail = (email) => {
    if (!email || !email.includes('@')) return email;
    const [local, domain] = email.split('@');
    if (local.length <= 4) return local + '@' + domain;
    return local.substring(0, 3) + '***' + local.slice(-1) + '@' + domain;
};

const maskPhone = (phone) => {
    if (!phone) return phone;
    const clean = phone.replace(/\D/g, '');
    if (clean.length < 5) return phone;
    const front = clean.substring(0, 3); // 799
    const back = clean.slice(-1); // 7
    return `+${front[0]} (${front.substring(1, 4)}*) ***-**-*${back}`;
};

const roleNames = {
    'client': 'Зарегистрированный пользователь',
    'manager': 'Администратор коворкинга',
    'sysadmin': 'Системный администратор'
};

export default function Profile() {
    const [user, setUser] = useState(null);
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadProfile = async () => {
            try {
                // Try from local first for fast render
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }

                // Fetch fresh data
                const freshUser = await authService.getMe();
                if (freshUser) {
                    setUser(freshUser);
                    localStorage.setItem('user', JSON.stringify(freshUser));
                    
                    if (freshUser.role === 'client') {
                        const resData = await apiService.getReservations();
                        setReservations(resData || []);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch profile", err);
            } finally {
                setLoading(false);
            }
        };
        
        loadProfile();
    }, []);

    if (loading) return <div className="profile-page" style={{textAlign: 'center', paddingTop: '100px'}}>Загрузка...</div>;
    
    // Protect route
    if (!user && localStorage.getItem('isAuthenticated') !== 'true') {
        return <Navigate to="/" />;
    }

    // Default to client if no role
    const profileUser = user || { name: 'Гость', email: 'guest@example.com', phone: '', role: 'client' };
    const role = profileUser.role || 'client';

    const renderClientPanel = () => (
        <div className="profile-card glass-panel">
            <h2><Calendar size={24} className="text-accent" /> Мои бронирования</h2>
            <div className="mock-table-container">
                <table className="mock-table">
                    <thead>
                        <tr>
                            <th>Место</th>
                            <th>Дата начала</th>
                            <th>Дата конца</th>
                            <th>Тариф</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reservations.length > 0 ? (
                            reservations.map((res, i) => (
                                <tr key={i}>
                                    <td>Место #{res.workspace_id}</td>
                                    <td>{new Date(res.start_time).toLocaleString()}</td>
                                    <td>{new Date(res.end_time).toLocaleString()}</td>
                                    <td>Тариф {res.tariff_id}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" style={{textAlign:'center', padding: '2rem'}}>У вас пока нет бронирований.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderManagerPanel = () => (
        <div className="profile-card glass-panel">
            <h2><Building2 size={24} className="text-accent" /> Управление коворкингом</h2>
            <div className="admin-grid">
                <div className="admin-action-card">
                    <Calendar size={32} className="text-accent" />
                    <h3>Бронирования клиентов</h3>
                    <p>Просмотр, изменение и отмена любых броней.</p>
                </div>
                <div className="admin-action-card">
                    <Building2 size={32} className="text-accent" />
                    <h3>Рабочие места</h3>
                    <p>Изменение статусов, удаление и добавление мест.</p>
                </div>
                <div className="admin-action-card">
                    <CreditCard size={32} className="text-accent" />
                    <h3>Тарифы и услуги</h3>
                    <p>Управление ценами и дополнительными услугами.</p>
                </div>
                <div className="admin-action-card">
                    <Users size={32} className="text-accent" />
                    <h3>Клиенты</h3>
                    <p>Просмотр списка зарегистрированных пользователей.</p>
                </div>
            </div>
        </div>
    );

    const renderSysAdminPanel = () => (
        <div className="profile-card glass-panel">
            <h2><ShieldAlert size={24} className="text-accent" /> Системное администрирование</h2>
            <div className="admin-grid">
                <div className="admin-action-card">
                    <Users size={32} className="text-accent" />
                    <h3>Управление пользователями</h3>
                    <p>Блокировка клиентов, управление администраторами.</p>
                </div>
                <div className="admin-action-card">
                    <Settings size={32} className="text-accent" />
                    <h3>Глобальные параметры</h3>
                    <p>Настройка системы и конфигурация сервера.</p>
                </div>
                <div className="admin-action-card">
                    <Terminal size={32} className="text-accent" />
                    <h3>Журналы событий</h3>
                    <p>Просмотр и анализ логов системы.</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="profile-page">
            <div className="profile-header">
                <div className="container">
                    <h1>Личный кабинет</h1>
                    <p>Управление вашим аккаунтом и сервисами.</p>
                </div>
            </div>

            <div className="container profile-content">
                <div className="profile-card glass-panel">
                    <h2><User size={24} className="text-accent" /> Личные данные</h2>
                    
                    <div className="user-info-grid">
                        <div className="info-group">
                            <span className="info-label">Имя</span>
                            <span className="info-value">{profileUser.name}</span>
                        </div>
                        <div className="info-group">
                            <span className="info-label">Email</span>
                            <span className="info-value">{maskEmail(profileUser.email)}</span>
                        </div>
                        <div className="info-group">
                            <span className="info-label">Телефон</span>
                            <span className="info-value">{maskPhone(profileUser.phone)}</span>
                        </div>
                        <div className="info-group">
                            <span className="info-label">Роль в системе</span>
                            <span className="info-value">
                                <span className="role-badge">{roleNames[role] || 'Неизвестно'}</span>
                            </span>
                        </div>
                    </div>
                </div>

                {role === 'client' && renderClientPanel()}
                {role === 'manager' && renderManagerPanel()}
                {role === 'sysadmin' && renderSysAdminPanel()}
            </div>
        </div>
    );
}
