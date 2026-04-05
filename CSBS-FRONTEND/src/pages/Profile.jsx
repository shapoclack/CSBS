import { useState, useEffect } from 'react';
import {
    User, Calendar, Settings, Users, ShieldAlert,
    CreditCard, Building2, Terminal, Trash2, FileText
} from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { authService, apiService } from '../services/api';
import './Profile.css';
import '../components/profile/ProfileTabs.css';

// Tab components
import BookingsManagement from '../components/profile/BookingsManagement';
import WorkspacesManagement from '../components/profile/WorkspacesManagement';
import TariffsManagement from '../components/profile/TariffsManagement';
import ClientsList from '../components/profile/ClientsList';
import AdminsManagement from '../components/profile/AdminsManagement';
import GlobalSettings from '../components/profile/GlobalSettings';
import SystemAuditLogs from '../components/profile/SystemAuditLogs';

/* ── helpers ── */

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
    const front = clean.substring(0, 3);
    const back = clean.slice(-1);
    return `+${front[0]} (${front.substring(1, 4)}*) ***-**-*${back}`;
};

const roleNames = {
    'client':   'Зарегистрированный пользователь',
    'manager':  'Администратор коворкинга',
    'sysadmin': 'Системный администратор',
};

/* ── nav config ── */

const NAV_ITEMS = [
    // User section
    { id: 'profile',     label: 'Профиль',             icon: User,        minRole: 0 },
    { id: 'my-bookings', label: 'Мои бронирования',    icon: Calendar,    minRole: 0 },

    // Admin section
    { id: '_admin_divider', divider: true, label: 'Администрирование', minRole: 1 },
    { id: 'bookings-mgmt', label: 'Управление бронированиями', icon: FileText,  minRole: 1 },
    { id: 'workspaces',    label: 'Рабочие места',              icon: Building2, minRole: 1 },
    { id: 'tariffs',       label: 'Тарифы и услуги',            icon: CreditCard,minRole: 1 },
    { id: 'clients',       label: 'Клиенты',                    icon: Users,     minRole: 1 },

    // Sysadmin section
    { id: '_sys_divider', divider: true, label: 'Система', minRole: 2 },
    { id: 'staff',          label: 'Управление персоналом',  icon: ShieldAlert, minRole: 2 },
    { id: 'global-settings',label: 'Глобальные настройки',   icon: Settings,    minRole: 2 },
    { id: 'system-logs',    label: 'Системные логи',         icon: Terminal,    minRole: 2 },
];

const ROLE_LEVEL = { client: 0, manager: 1, sysadmin: 2 };

/* ── component ── */

export default function Profile() {
    const [user, setUser] = useState(null);
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('profile');

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const storedUser = localStorage.getItem('user');
                if (storedUser) setUser(JSON.parse(storedUser));

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
                console.error('Failed to fetch profile', err);
                localStorage.removeItem('user');
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        loadProfile();
    }, []);

    if (loading)
        return <div className="profile-page" style={{ textAlign: 'center', paddingTop: '100px' }}>Загрузка...</div>;

    if (!user && localStorage.getItem('isAuthenticated') !== 'true')
        return <Navigate to="/" />;

    const defaultUser = { name: 'Гость', email: 'guest@example.com', phone: '', role: 'client' };
    const profileUser = (user && user.name) ? user : defaultUser;
    const role = profileUser.role || 'client';
    const level = ROLE_LEVEL[role] ?? 0;

    const visibleNav = NAV_ITEMS.filter(n => level >= n.minRole);

    /* ── User tab: Профиль ── */
    const renderProfileTab = () => (
        <div className="profile-card glass-panel fade-in">
            <h2><User size={22} className="text-accent" /> Личные данные</h2>
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
            <div className="danger-zone">
                <h3>Опасная зона</h3>
                <button className="btn-danger"><Trash2 size={16} /> Удалить аккаунт</button>
            </div>
        </div>
    );

    /* ── User tab: Мои бронирования ── */
    const renderMyBookings = () => (
        <div className="profile-card glass-panel fade-in">
            <h2><Calendar size={22} className="text-accent" /> Мои бронирования</h2>
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
                    {reservations.length > 0 ? reservations.map((res, i) => (
                        <tr key={i}>
                            <td>Место #{res.workspace_id}</td>
                            <td>{new Date(res.start_time).toLocaleString()}</td>
                            <td>{new Date(res.end_time).toLocaleString()}</td>
                            <td>Тариф {res.tariff_id}</td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan="4" className="empty-state">У вас пока нет бронирований.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    /* ── tab router ── */
    const renderContent = () => {
        switch (activeTab) {
            case 'profile':        return renderProfileTab();
            case 'my-bookings':    return renderMyBookings();
            case 'bookings-mgmt':  return <BookingsManagement />;
            case 'workspaces':     return <WorkspacesManagement />;
            case 'tariffs':        return <TariffsManagement />;
            case 'clients':        return <ClientsList />;
            case 'staff':          return <AdminsManagement />;
            case 'global-settings':return <GlobalSettings />;
            case 'system-logs':    return <SystemAuditLogs />;
            default:               return renderProfileTab();
        }
    };

    return (
        <div className="profile-page">
            <div className="profile-header">
                <div className="container">
                    <h1>Личный кабинет</h1>
                    <p>Управление аккаунтом и сервисами · {roleNames[role]}</p>
                </div>
            </div>

            <div className="container profile-layout">
                {/* Sidebar */}
                <aside className="profile-sidebar glass-panel">
                    <nav className="profile-nav">
                        {visibleNav.map(item => {
                            if (item.divider) {
                                return (
                                    <div key={item.id}>
                                        <div className="profile-nav-divider" />
                                        <div className="profile-nav-label">{item.label}</div>
                                    </div>
                                );
                            }
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    className={`profile-nav-btn ${activeTab === item.id ? 'active' : ''}`}
                                    onClick={() => setActiveTab(item.id)}
                                >
                                    <Icon size={18} />
                                    {item.label}
                                </button>
                            );
                        })}
                    </nav>
                </aside>

                {/* Content */}
                <main className="profile-main">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
}
