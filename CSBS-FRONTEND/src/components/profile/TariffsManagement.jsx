import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CreditCard, Plus, Edit, Trash2, X } from 'lucide-react';
import { apiService } from '../../services/api';
import { toast } from '../../utils/toast';

export default function TariffsManagement() {
    const [tariffs, setTariffs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editTariff, setEditTariff] = useState(null);

    useEffect(() => {
        apiService.getTariffs()
            .then(data => setTariffs(data || []))
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    const handleDelete = async (id) => {
        if (!confirm('Удалить тариф?')) return;
        try {
            await apiService.deleteTariff(id);
            setTariffs(prev => prev.filter(t => t.ID !== id));
            toast.success('Тариф удален');
        } catch (err) {
            toast.error('Ошибка удаления: ' + err.message);
        }
    };

    const fmtDuration = (minutes) => {
        if (!minutes) return '—';
        if (minutes < 60) return `${minutes} мин`;
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return m ? `${h}ч ${m}мин` : `${h}ч`;
    };

    if (loading) return <div className="profile-card glass-panel"><div className="empty-state">Загрузка тарифов...</div></div>;
    if (error) return <div className="profile-card glass-panel"><div className="empty-state">Ошибка: {error}</div></div>;

    return (
        <div className="profile-card glass-panel fade-in">
            <div className="panel-header">
                <h2><CreditCard size={22} className="text-accent" /> Тарифы и услуги</h2>
                <div className="panel-toolbar">
                    <button className="btn-accent"><Plus size={16} /> Добавить тариф</button>
                </div>
            </div>

            <table className="mock-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Название</th>
                        <th>Цена (₽)</th>
                        <th>Длительность</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    {tariffs.map(t => (
                        <tr key={t.ID}>
                            <td>#{t.ID}</td>
                            <td>{t.Name}</td>
                            <td>{Number(t.Price).toLocaleString('ru-RU')}</td>
                            <td>{fmtDuration(t.DurationMinutes)}</td>
                            <td>
                                <div className="row-actions">
                                    <button className="btn-icon" title="Редактировать" onClick={() => setEditTariff(t)}><Edit size={15} /></button>
                                    <button className="btn-icon danger" title="Удалить" onClick={() => handleDelete(t.ID)}>
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {tariffs.length === 0 && (
                        <tr><td colSpan="5" className="empty-state">Тарифы не найдены</td></tr>
                    )}
                </tbody>
            </table>

            {/* Модальное окно Редактирования тарифа */}
            {editTariff && createPortal(
                <div className="modal-overlay" onClick={() => setEditTariff(null)}>
                    <div className="modal-content fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <button className="modal-close" onClick={() => setEditTariff(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20} /></button>
                        <h2 style={{ marginBottom: '1.5rem', color: 'var(--color-accent)' }}>Редактирование тарифа</h2>
                        
                        <div className="form-field" style={{ marginBottom: '1rem' }}>
                            <label>Название тарифа</label>
                            <input 
                                type="text"
                                defaultValue={editTariff.Name}
                                id="tariff-name-input"
                            />
                        </div>

                        <div className="form-field" style={{ marginBottom: '1.5rem' }}>
                            <label>Цена (₽)</label>
                            <input 
                                type="number"
                                defaultValue={editTariff.Price}
                                id="tariff-price-input"
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button className="btn-ghost" onClick={() => setEditTariff(null)}>Отмена</button>
                            <button className="btn-accent" onClick={async () => {
                                const newName = document.getElementById('tariff-name-input').value;
                                const newPrice = parseFloat(document.getElementById('tariff-price-input').value);
                                if (!newName || isNaN(newPrice)) return toast.warning('Введите корректные данные');
                                
                                try {
                                    const updated = { ...editTariff, Name: newName, Price: newPrice };
                                    await apiService.updateTariff(editTariff.ID, updated);
                                    setTariffs(prev => prev.map(t => t.ID === editTariff.ID ? updated : t));
                                    setEditTariff(null);
                                    toast.success('Тариф обновлен');
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
