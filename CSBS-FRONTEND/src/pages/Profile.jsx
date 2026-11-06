import { lazy, Suspense, useState, useEffect } from 'react';
import {
    User, Calendar, Settings, Users, ShieldAlert,
    CreditCard, Building2, Terminal, Trash2, FileText, QrCode, BarChart3
} from 'lucide-react';
import { maskEmail, maskPhone } from '../utils/formatters';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import './Profile.css';
import '../components/profile/ProfileTabs.css';
import ProfileLoadBoundary from '../components/profile/ProfileLoadBoundary';

// Загружаем код вкладки или QR-окна только при первом открытии.
const ReservationQrModal = lazy(() => import('../components/profile/ReservationQrModal'));
const AnalyticsDashboard = lazy(() => import('../components/profile/AnalyticsDashboard'));
const BookingsManagement = lazy(() => import('../components/profile/BookingsManagement'));
const WorkspacesManagement = lazy(() => import('../components/profile/WorkspacesManagement'));
const TariffsManagement = lazy(() => import('../components/profile/TariffsManagement'));
const ClientsList = lazy(() => import('../components/profile/ClientsList'));
const AdminsManagement = lazy(() => import('../components/profile/AdminsManagement'));
const GlobalSettings = lazy(() => import('../components/profile/GlobalSettings'));
const SystemAuditLogs = lazy(() => import('../components/profile/SystemAuditLogs'));

/* ── helpers ── */


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
    { id: 'analytics',     label: 'Аналитика и прогноз',        icon: BarChart3, minRole: 1 },
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
    const { user: authUser, isLoggedIn, logout, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [user, setUser] = useState(authUser);
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('profile');
    const [qrReservationId, setQrReservationId] = useState(null);

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const freshUser = await refreshUser();
                if (freshUser) {
                    setUser(freshUser);
                    const resData = await apiService.getReservations();
                    setReservations(resData || []);
                }
            } catch (err) {
                console.error('Failed to fetch profile', err);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        loadProfile();
    }, [refreshUser]);

    if (loading)
        return <div className="profile-page" style={{ textAlign: 'center', paddingTop: '100px' }}>Загрузка...</div>;

    if (!isLoggedIn)
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
                <button
                    className="btn-danger"
                    onClick={async () => {
                        if (window.confirm('Вы уверены, что хотите удалить аккаунт? Это действие необратимо.')) {
                            await logout();
                            navigate('/');
                        }
                    }}
                >
                    <Trash2 size={16} /> Удалить аккаунт
                </button>
            </div>
        </div>
    );

    /* ── User tab: Мои бронирования ── */
    const renderMyBookings = () => {
        const now = Date.now();
        return (
        <div className="profile-card glass-panel fade-in">
            <h2><Calendar size={22} className="text-accent" /> Мои бронирования</h2>
            <table className="mock-table">
                <thead>
                    <tr>
                        <th>Место</th>
                        <th>Дата начала</th>
                        <th>Дата конца</th>
                        <th>Тариф</th>
                        <th>Статус</th>
                        <th>Пропуск</th>
                    </tr>
                </thead>
                <tbody>
                    {reservations.length > 0 ? reservations.map((res, i) => {
                        const placeName = res.Workspace?.NameOrNumber || res.Workspace?.Name || `Место #${res.WorkspaceID}`;
                        const loc = res.Workspace?.Location;
                        const locLine = loc ? [loc.Name, loc.Address].filter(Boolean).join(', ') : null;
                        const isActive = res.Status === 'подтверждено' && new Date(res.EndTime).getTime() > now;
                        return (
                        <tr key={res.ID || i}>
                            <td>
                                <div>{placeName}</div>
                                {locLine && <div className="text-muted" style={{ fontSize: '0.85rem', marginTop: 2 }}>{locLine}</div>}
                            </td>
                            <td>{new Date(res.StartTime).toLocaleString('ru-RU')}</td>
                            <td>{new Date(res.EndTime).toLocaleString('ru-RU')}</td>
                            <td>{res.Tariff?.Name || `Тариф #${res.TariffID}`}</td>
                            <td>
                                <span className={`status-badge ${res.Status === 'подтверждено' ? 'active' : 'blocked'}`}>
                                    {res.Status || '—'}
                                </span>
                            </td>
                            <td>
                                {isActive ? (
                                    <button
                                        type="button"
                                        className="btn-qr"
                                        onClick={() => setQrReservationId(res.ID)}
                                        title="Показать QR-пропуск для входа в коворкинг"
                                    >
                                        <QrCode size={14} /> QR-код
                                    </button>
                                ) : (
                                    <span className="text-muted" style={{ fontSize: '0.85rem' }}>—</span>
                                )}
                            </td>
                        </tr>
                        );
                    }) : (
                        <tr>
                            <td colSpan="6" className="empty-state">У вас пока нет бронирований.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
        );
    };

    /* ── tab router ── */
    const renderContent = () => {
        switch (activeTab) {
            case 'profile':        return renderProfileTab();
            case 'my-bookings':    return renderMyBookings();
            case 'analytics':      return <AnalyticsDashboard />;
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
                    <ProfileLoadBoundary key={activeTab}>
                        <Suspense fallback={
                            <div className="profile-card glass-panel" role="status">
                                Загружаем раздел...
                            </div>
                        }>
                            {renderContent()}
                        </Suspense>
                    </ProfileLoadBoundary>
                </main>
            </div>

            {qrReservationId && (
                <ProfileLoadBoundary key={qrReservationId} onClose={() => setQrReservationId(null)}>
                    <Suspense fallback={
                        <div className="profile-card glass-panel" role="status">
                            <p>Загружаем QR-пропуск...</p>
                            <button type="button" onClick={() => setQrReservationId(null)}>
                                Отмена
                            </button>
                        </div>
                    }>
                        <ReservationQrModal
                            reservationId={qrReservationId}
                            onClose={() => setQrReservationId(null)}
                        />
                    </Suspense>
                </ProfileLoadBoundary>
            )}
        </div>
    );
}
