import { useState, useEffect } from 'react';
import { Calendar, Plus, Edit, Trash2, Search, X } from 'lucide-react';
import { apiService } from '../../services/api';

const STATUS_LABELS = { 'подтверждено': 'Подтверждено', 'ожидание': 'Ожидание', 'отменено': 'Отменено' };
const STATUS_CLASS  = { 'подтверждено': 'confirmed', 'ожидание': 'pending', 'отменено': 'cancelled' };

export default function BookingsManagement() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        apiService.getAllReservations()
            .then(data => setBookings(data || []))
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    const filtered = bookings.filter(b => {
        const q = search.toLowerCase();
        const username = b.User?.FullName || b.User?.Email || '';
        const workspace = b.Workspace?.NameOrNumber || '';
        return username.toLowerCase().includes(q) || workspace.toLowerCase().includes(q);
    });

    const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('ru-RU') : '—';
    const fmtTime = (iso) => iso ? new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '';

    if (loading) return <div className="profile-card glass-panel"><div className="empty-state">Загрузка бронирований...</div></div>;
    if (error) return <div className="profile-card glass-panel"><div className="empty-state">Ошибка: {error}</div></div>;

    return (
        <div className="profile-card glass-panel fade-in">
            <div className="panel-header">
                <h2><Calendar size={22} className="text-accent" /> Управление бронированиями</h2>
                <div className="panel-toolbar">
                    <div className="search-input-wrap">
                        <Search size={16} color="rgba(255,255,255,0.4)" />
                        <input placeholder="Поиск..." value={search} onChange={e => setSearch(e.target.value)} />
                        {search && <button className="btn-icon" onClick={() => setSearch('')}><X size={14} /></button>}
                    </div>
                    <button className="btn-accent"><Plus size={16} /> Создать бронь</button>
                </div>
            </div>

            <table className="mock-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Клиент</th>
                        <th>Место</th>
                        <th>Дата</th>
                        <th>Время</th>
                        <th>Тариф</th>
                        <th>Статус</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    {filtered.map(b => (
                        <tr key={b.ID}>
                            <td>#{b.ID}</td>
                            <td>{b.User?.FullName || b.User?.Email || `User #${b.UserID}`}</td>
                            <td>{b.Workspace?.NameOrNumber || `#${b.WorkspaceID}`}</td>
                            <td>{fmtDate(b.StartTime)}</td>
                            <td>{fmtTime(b.StartTime)} – {fmtTime(b.EndTime)}</td>
                            <td>{b.Tariff?.Name || `#${b.TariffID}`}</td>
                            <td>
                                <span className={`status-badge ${STATUS_CLASS[b.Status] || 'pending'}`}>
                                    {STATUS_LABELS[b.Status] || b.Status}
                                </span>
                            </td>
                            <td>
                                <div className="row-actions">
                                    <button className="btn-icon" title="Редактировать"><Edit size={15} /></button>
                                    <button className="btn-icon danger" title="Отменить"><Trash2 size={15} /></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {filtered.length === 0 && (
                        <tr><td colSpan="8" className="empty-state">Бронирования не найдены</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
