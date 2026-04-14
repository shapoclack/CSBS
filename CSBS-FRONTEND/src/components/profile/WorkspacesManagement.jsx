import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Building2, Plus, Edit, Trash2, LayoutDashboard, X } from 'lucide-react';
import { apiService } from '../../services/api';
import { toast } from '../../utils/toast';

export default function WorkspacesManagement() {
    const [workspaces, setWorkspaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editWs, setEditWs] = useState(null);

    useEffect(() => {
        apiService.getWorkspaces()
            .then(data => setWorkspaces(data || []))
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    const handleDelete = async (id) => {
        if (!confirm('Удалить рабочее место?')) return;
        try {
            await apiService.deleteWorkspace(id);
            setWorkspaces(prev => prev.filter(w => w.ID !== id));
            toast.success('Рабочее место удалено');
        } catch (err) {
            toast.error('Ошибка удаления: ' + err.message);
        }
    };

    if (loading) return <div className="profile-card glass-panel"><div className="empty-state">Загрузка рабочих мест...</div></div>;
    if (error) return <div className="profile-card glass-panel"><div className="empty-state">Ошибка: {error}</div></div>;

    return (
        <div className="profile-card glass-panel fade-in">
            <div className="panel-header">
                <h2><Building2 size={22} className="text-accent" /> Рабочие места</h2>
                <div className="panel-toolbar">
                    <button className="btn-ghost"><LayoutDashboard size={16} /> Редактор схемы</button>
                    <button className="btn-accent"><Plus size={16} /> Добавить место</button>
                </div>
            </div>

            <div className="admin-grid">
                {workspaces.map(w => (
                    <div className="admin-action-card" key={w.ID}>
                        <Building2 size={28} className="text-accent" />
                        <h3>{w.NameOrNumber || `#${w.ID}`}</h3>
                        <p>{w.Category?.Name || 'Без категории'}</p>
                        <span className={`status-badge ${w.IsActive ? 'active' : 'blocked'}`}>
                            {w.IsActive ? 'Доступно' : 'Заблокировано'}
                        </span>
                        <p>Вместимость: {w.Capacity}</p>
                        <div className="row-actions">
                            <button className="btn-icon" title="Редактировать" onClick={() => setEditWs(w)}><Edit size={15} /></button>
                            <button className="btn-icon danger" title="Удалить" onClick={() => handleDelete(w.ID)}>
                                <Trash2 size={15} />
                            </button>
                        </div>
                    </div>
                ))}
                {workspaces.length === 0 && (
                    <div className="empty-state">Рабочие места не найдены</div>
                )}
            </div>

            {/* Модальное окно Редактирования рабочего места */}
            {editWs && createPortal(
                <div className="modal-overlay" onClick={() => setEditWs(null)}>
                    <div className="modal-content fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <button className="modal-close" onClick={() => setEditWs(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20} /></button>
                        <h2 style={{ marginBottom: '1.5rem', color: 'var(--color-accent)' }}>Рабочее место #{editWs.ID}</h2>
                        
                        <div className="form-field" style={{ marginBottom: '1rem' }}>
                            <label>Название / Номер</label>
                            <input 
                                type="text"
                                defaultValue={editWs.NameOrNumber}
                                id="ws-name-input"
                            />
                        </div>

                        <div className="form-field" style={{ marginBottom: '1.5rem' }}>
                            <label>Вместимость (чел)</label>
                            <input 
                                type="number"
                                defaultValue={editWs.Capacity}
                                id="ws-capacity-input"
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button className="btn-ghost" onClick={() => setEditWs(null)}>Отмена</button>
                            <button className="btn-accent" onClick={async () => {
                                const newName = document.getElementById('ws-name-input').value;
                                const newCap = parseInt(document.getElementById('ws-capacity-input').value, 10);
                                if (!newName || isNaN(newCap)) return toast.warning('Введите корректные данные');
                                
                                try {
                                    const updated = { ...editWs, NameOrNumber: newName, Capacity: newCap };
                                    await apiService.updateWorkspace(editWs.ID, updated);
                                    setWorkspaces(prev => prev.map(w => w.ID === editWs.ID ? updated : w));
                                    setEditWs(null);
                                    toast.success('Рабочее место обновлено');
                                } catch (err) {
                                    toast.error('Ошибка сохранения: ' + err.message);
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
