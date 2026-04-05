import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Users, Search, X, Ban, Eye } from 'lucide-react';
import { apiService } from '../../services/api';

const ROLE_LABELS = {
    'user':         'Клиент',
    'cowork_admin': 'Менеджер',
    'system_admin': 'Сис. админ',
};

export default function ClientsList() {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [viewUser, setViewUser] = useState(null);

    useEffect(() => {
        apiService.getAllUsers()
            .then(data => setClients(data || []))
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    const filtered = clients.filter(c => {
        const q = search.toLowerCase();
        return (c.FullName || '').toLowerCase().includes(q) ||
               (c.Email    || '').toLowerCase().includes(q);
    });

    const toggleBlock = async (user) => {
        const newStatus = user.Status === 'активен' ? 'заблокирован' : 'активен';
        try {
            await apiService.updateUserStatus(user.ID, newStatus);
            setClients(prev => prev.map(c =>
                c.ID === user.ID ? { ...c, Status: newStatus } : c
            ));
        } catch (err) {
            alert('Ошибка: ' + err.message);
        }
    };

    if (loading) return <div className="profile-card glass-panel"><div className="empty-state">Загрузка клиентов...</div></div>;
    if (error) return <div className="profile-card glass-panel"><div className="empty-state">Ошибка: {error}</div></div>;

    return (
        <div className="profile-card glass-panel fade-in">
            <div className="panel-header">
                <h2><Users size={22} className="text-accent" /> Клиенты</h2>
                <div className="panel-toolbar">
                    <div className="search-input-wrap">
                        <Search size={16} color="rgba(255,255,255,0.4)" />
                        <input placeholder="Поиск клиента..." value={search} onChange={e => setSearch(e.target.value)} />
                        {search && <button className="btn-icon" onClick={() => setSearch('')}><X size={14} /></button>}
                    </div>
                </div>
            </div>

            <table className="mock-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Имя</th>
                        <th>Email</th>
                        <th>Телефон</th>
                        <th>Роль</th>
                        <th>Статус</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    {filtered.map(c => (
                        <tr key={c.ID}>
                            <td>#{c.ID}</td>
                            <td>{c.FullName || '—'}</td>
                            <td>{c.Email}</td>
                            <td>{c.Phone || '—'}</td>
                            <td><span className="role-badge">{ROLE_LABELS[c.Role?.Name] || c.Role?.Name || '—'}</span></td>
                            <td>
                                <span className={`status-badge ${c.Status === 'активен' ? 'active' : 'blocked'}`}>
                                    {c.Status || '—'}
                                </span>
                            </td>
                            <td>
                                <div className="row-actions">
                                    <button className="btn-icon" title="Подробнее" onClick={() => setViewUser(c)}><Eye size={15} /></button>
                                    <button
                                        className="btn-icon danger"
                                        title={c.Status === 'активен' ? 'Заблокировать' : 'Разблокировать'}
                                        onClick={() => toggleBlock(c)}
                                    >
                                        <Ban size={15} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {filtered.length === 0 && (
                        <tr><td colSpan="7" className="empty-state">Клиенты не найдены</td></tr>
                    )}
                </tbody>
            </table>

            {/* Модальное окно Подробнее */}
            {viewUser && createPortal(
                <div className="modal-overlay" onClick={() => setViewUser(null)}>
                    <div className="modal-content fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
                        <button className="modal-close" onClick={() => setViewUser(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20} /></button>
                        <h2 style={{ marginBottom: '1.5rem', color: 'var(--color-accent)' }}>Детали клиента #{viewUser.ID}</h2>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', color: 'var(--color-text-main)', fontSize: '0.95rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                                <span style={{ color: 'var(--color-text-muted)' }}>ФИО</span>
                                <strong>{viewUser.FullName || 'Не указано'}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                                <span style={{ color: 'var(--color-text-muted)' }}>Email</span>
                                <strong>{viewUser.Email}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                                <span style={{ color: 'var(--color-text-muted)' }}>Телефон</span>
                                <strong>{viewUser.Phone || 'Не указан'}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                                <span style={{ color: 'var(--color-text-muted)' }}>Дата регистрации</span>
                                <strong>{new Date(viewUser.CreatedAt).toLocaleDateString('ru-RU')}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                                <span style={{ color: 'var(--color-text-muted)' }}>Группа (Роль)</span>
                                <span className="role-badge">{ROLE_LABELS[viewUser.Role?.Name] || viewUser.Role?.Name || '—'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem' }}>
                                <span style={{ color: 'var(--color-text-muted)' }}>Текущий статус</span>
                                <span className={`status-badge ${viewUser.Status === 'активен' ? 'active' : 'blocked'}`}>
                                    {viewUser.Status || '—'}
                                </span>
                            </div>
                        </div>

                        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="btn-ghost" onClick={() => setViewUser(null)}>Закрыть</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
