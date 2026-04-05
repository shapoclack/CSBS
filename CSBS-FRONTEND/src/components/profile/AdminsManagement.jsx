import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ShieldAlert, Plus, Edit, Trash2, Search, X } from 'lucide-react';
import { apiService } from '../../services/api';

const ROLE_LABELS = {
    'user':         'Клиент',
    'cowork_admin': 'Менеджер',
    'system_admin': 'Сис. админ',
};

export default function AdminsManagement() {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [editUser, setEditUser] = useState(null);

    useEffect(() => {
        apiService.getAllUsers()
            .then(data => {
                // Filter to show only admins/managers (not regular clients)
                const admins = (data || []).filter(u =>
                    u.Role?.Name === 'cowork_admin' || u.Role?.Name === 'system_admin'
                );
                setStaff(admins);
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

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
        } catch (err) {
            alert('Ошибка: ' + err.message);
        }
    };

    const handleDemote = async (user) => {
        if (!confirm(`Снять права администратора у ${user.FullName || user.Email}?`)) return;
        try {
            await apiService.updateUserRole(user.ID, 'user');
            setStaff(prev => prev.filter(s => s.ID !== user.ID));
        } catch (err) {
            alert('Ошибка: ' + err.message);
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
                    <button className="btn-accent"><Plus size={16} /> Выдать доступ</button>
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
                    {filtered.map(s => (
                        <tr key={s.ID}>
                            <td>#{s.ID}</td>
                            <td>{s.FullName || '—'}</td>
                            <td>{s.Email}</td>
                            <td><span className="role-badge">{ROLE_LABELS[s.Role?.Name] || s.Role?.Name || '—'}</span></td>
                            <td>
                                <span className={`status-badge ${s.Status === 'активен' ? 'active' : 'blocked'}`}>
                                    {s.Status === 'активен' ? 'Активен' : 'Отозван'}
                                </span>
                            </td>
                            <td>
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
                            </td>
                        </tr>
                    ))}
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
                                } catch (err) {
                                    alert('Ошибка сохранения: ' + err.message);
                                }
                            }}>Сохранить</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
