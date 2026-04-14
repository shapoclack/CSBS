import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ShieldAlert, Plus, Edit, Trash2, Search, X } from 'lucide-react';
import { apiService } from '../../services/api';
import { toast } from '../../utils/toast';

const ROLE_LABELS = {
    'user':         'Клиент',
    'cowork_admin': 'Менеджер',
    'system_admin': 'Сис. админ',
};

export default function AdminsManagement() {
    const [staff, setStaff] = useState([]);
    const [allUsers, setAllUsers] = useState([]);  // full user list for grant modal
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [editUser, setEditUser] = useState(null);
    const [showGrant, setShowGrant] = useState(false);
    const [grantSearch, setGrantSearch] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [grantRole, setGrantRole] = useState('cowork_admin');
    const [granting, setGranting] = useState(false);

    // Get current user to prevent self-management and sysadmin-on-sysadmin actions
    const currentUser = useMemo(() => {
        try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
    }, []);

    const loadUsers = () => {
        apiService.getAllUsers()
            .then(data => {
                const users = data || [];
                setAllUsers(users);
                // Filter to show only admins/managers (not regular clients)
                const admins = users.filter(u =>
                    u.Role?.Name === 'cowork_admin' || u.Role?.Name === 'system_admin'
                );
                setStaff(admins);
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadUsers(); }, []);

    // Clients available for promotion (only regular 'user' role)
    const availableClients = allUsers.filter(u => u.Role?.Name === 'user');
    const filteredClients = availableClients.filter(u => {
        const q = grantSearch.toLowerCase();
        return (u.FullName || '').toLowerCase().includes(q) ||
               (u.Email || '').toLowerCase().includes(q);
    });

    const filtered = staff.filter(s => {
        const q = search.toLowerCase();
        return (s.FullName || '').toLowerCase().includes(q) ||
               (s.Email    || '').toLowerCase().includes(q);
    });

    const handleRevoke = async (user) => {
        const newStatus = user.Status === 'активен' ? 'заблокирован' : 'активен';
        try {
            await apiService.updateUserStatus(user.ID, newStatus);
            setStaff(prev => prev.map(s =>
                s.ID === user.ID ? { ...s, Status: newStatus } : s
            ));
            toast.success(`Статус изменен на "${newStatus}"`);
        } catch (err) {
            toast.error('Ошибка: ' + err.message);
        }
    };

    const handleDemote = async (user) => {
        if (!confirm(`Снять права администратора у ${user.FullName || user.Email}?`)) return;
        try {
            await apiService.updateUserRole(user.ID, 'user');
            setStaff(prev => prev.filter(s => s.ID !== user.ID));
            toast.success('Права администратора сняты');
        } catch (err) {
            toast.error('Ошибка: ' + err.message);
        }
    };

    const handleGrant = async () => {
        if (!selectedUser) { toast.error('Выберите пользователя'); return; }
        setGranting(true);
        try {
            await apiService.updateUserRole(selectedUser.ID, grantRole);
            toast.success(`Права «${ROLE_LABELS[grantRole]}» выданы для ${selectedUser.FullName || selectedUser.Email}`);
            setShowGrant(false);
            setSelectedUser(null);
            setGrantSearch('');
            setGrantRole('cowork_admin');
            // Reload user list to reflect changes
            loadUsers();
        } catch (err) {
            toast.error('Ошибка: ' + err.message);
        } finally {
            setGranting(false);
        }
    };

    if (loading) return <div className="profile-card glass-panel"><div className="empty-state">Загрузка персонала...</div></div>;
    if (error) return <div className="profile-card glass-panel"><div className="empty-state">Ошибка: {error}</div></div>;

    return (
        <div className="profile-card glass-panel fade-in">
            <div className="panel-header">
                <h2><ShieldAlert size={22} className="text-accent" /> Управление персоналом</h2>
                <div className="panel-toolbar">
                    <div className="search-input-wrap">
                        <Search size={16} color="rgba(255,255,255,0.4)" />
                        <input placeholder="Поиск..." value={search} onChange={e => setSearch(e.target.value)} />
                        {search && <button className="btn-icon" onClick={() => setSearch('')}><X size={14} /></button>}
                    </div>
                    <button className="btn-accent" onClick={() => setShowGrant(true)}><Plus size={16} /> Выдать доступ</button>
                </div>
            </div>

            <table className="mock-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Имя</th>
                        <th>Email</th>
                        <th>Роль</th>
                        <th>Статус</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    {filtered.map(s => {
                        // Hide actions for self and for other system_admins
                        const isSelf = currentUser && currentUser.id === s.ID;
                        const isSysAdmin = s.Role?.Name === 'system_admin';
                        const actionsDisabled = isSelf || isSysAdmin;

                        return (
                            <tr key={s.ID} style={isSelf ? { opacity: 0.5 } : {}}>
                                <td>#{s.ID}</td>
                                <td>{s.FullName || '—'}{isSelf ? ' (вы)' : ''}</td>
                                <td>{s.Email}</td>
                                <td><span className="role-badge">{ROLE_LABELS[s.Role?.Name] || s.Role?.Name || '—'}</span></td>
                                <td>
                                    <span className={`status-badge ${s.Status === 'активен' ? 'active' : 'blocked'}`}>
                                        {s.Status === 'активен' ? 'Активен' : 'Отозван'}
                                    </span>
                                </td>
                                <td>
                                    {actionsDisabled ? (
                                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>—</span>
                                    ) : (
                                        <div className="row-actions">
                                            <button className="btn-icon" title="Редактировать" onClick={() => setEditUser(s)}><Edit size={15} /></button>
                                            <button
                                                className="btn-icon danger"
                                                title={s.Status === 'активен' ? 'Отозвать права' : 'Восстановить'}
                                                onClick={() => handleRevoke(s)}
                                            >
                                                <ShieldAlert size={15} />
                                            </button>
                                            <button className="btn-icon danger" title="Снять роль" onClick={() => handleDemote(s)}>
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                    {filtered.length === 0 && (
                        <tr><td colSpan="6" className="empty-state">Персонал не найден</td></tr>
                    )}
                </tbody>
            </table>

            {/* Модальное окно Редактирования роли */}
            {editUser && createPortal(
                <div className="modal-overlay" onClick={() => setEditUser(null)}>
                    <div className="modal-content fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <button className="modal-close" onClick={() => setEditUser(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20} /></button>
                        <h2 style={{ marginBottom: '1.5rem', color: 'var(--color-accent)' }}>Изменение прав #{editUser.ID}</h2>
                        
                        <div className="form-field" style={{ marginBottom: '1.5rem' }}>
                            <label>Права доступа (Роль)</label>
                            <select 
                                defaultValue={editUser.Role?.Name}
                                id="role-select-input"
                            >
                                <option value="cowork_admin">Менеджер коворкинга</option>
                                <option value="system_admin">Системный администратор</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button className="btn-ghost" onClick={() => setEditUser(null)}>Отмена</button>
                            <button className="btn-accent" onClick={async () => {
                                const newRole = document.getElementById('role-select-input').value;
                                try {
                                    await apiService.updateUserRole(editUser.ID, newRole);
                                    setStaff(prev => prev.map(s => s.ID === editUser.ID ? {...s, Role: { Name: newRole }} : s));
                                    setEditUser(null);
                                    toast.success('Роль успешно обновлена');
                                } catch (err) {
                                    toast.error('Ошибка сохранения: ' + err.message);
                                }
                            }}>Сохранить</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Модальное окно «Выдать доступ» */}
            {showGrant && createPortal(
                <div className="modal-overlay" onClick={() => { setShowGrant(false); setSelectedUser(null); setGrantSearch(''); }}>
                    <div className="modal-content fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
                        <button className="modal-close" onClick={() => { setShowGrant(false); setSelectedUser(null); setGrantSearch(''); }} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20} /></button>
                        <h2 style={{ marginBottom: '1.5rem', color: 'var(--color-accent)' }}>Выдать доступ</h2>

                        {/* Выбор пользователя */}
                        <div className="form-field" style={{ marginBottom: '1rem' }}>
                            <label>Пользователь</label>
                            {selectedUser ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{selectedUser.FullName || 'Без имени'}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{selectedUser.Email}</div>
                                    </div>
                                    <button className="btn-icon" onClick={() => setSelectedUser(null)} title="Сбросить"><X size={16} /></button>
                                </div>
                            ) : (
                                <>
                                    <div className="search-input-wrap" style={{ marginBottom: '0.5rem' }}>
                                        <Search size={14} color="rgba(255,255,255,0.4)" />
                                        <input
                                            placeholder="Поиск по имени или email..."
                                            value={grantSearch}
                                            onChange={e => setGrantSearch(e.target.value)}
                                            autoFocus
                                        />
                                        {grantSearch && <button className="btn-icon" onClick={() => setGrantSearch('')}><X size={12} /></button>}
                                    </div>
                                    <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: '8px', background: 'rgba(0,0,0,0.2)' }}>
                                        {filteredClients.length === 0 ? (
                                            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Нет доступных клиентов</div>
                                        ) : filteredClients.map(u => (
                                            <div
                                                key={u.ID}
                                                onClick={() => { setSelectedUser(u); setGrantSearch(''); }}
                                                style={{
                                                    padding: '0.5rem 0.8rem',
                                                    cursor: 'pointer',
                                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                    transition: 'background 0.15s',
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <div style={{ fontWeight: 500, color: 'var(--color-text-main)', fontSize: '0.9rem' }}>{u.FullName || 'Без имени'}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{u.Email} · #{u.ID}</div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Выбор роли */}
                        <div className="form-field" style={{ marginBottom: '1.5rem' }}>
                            <label>Назначить роль</label>
                            <select value={grantRole} onChange={e => setGrantRole(e.target.value)}>
                                <option value="cowork_admin">Менеджер коворкинга</option>
                                <option value="system_admin">Системный администратор</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button className="btn-ghost" onClick={() => { setShowGrant(false); setSelectedUser(null); setGrantSearch(''); }}>Отмена</button>
                            <button className="btn-accent" disabled={!selectedUser || granting} onClick={handleGrant}>
                                {granting ? 'Назначаю...' : 'Назначить'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
