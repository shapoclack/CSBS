import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Plus, Edit, Trash2, Search, X } from 'lucide-react';
import { apiService } from '../../services/api';
import { toast } from '../../utils/toast';

const STATUS_LABELS = { 'подтверждено': 'Подтверждено', 'ожидание': 'Ожидание', 'отменено': 'Отменено' };
const STATUS_CLASS  = { 'подтверждено': 'confirmed', 'ожидание': 'pending', 'отменено': 'cancelled' };
const STATUS_OPTIONS = ['подтверждено', 'ожидание', 'отменено'];

const toDateInput = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const toTimeInput = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const toRFC3339 = (date, time) => {
    if (!date || !time) return '';
    return new Date(`${date}T${time}:00`).toISOString();
};

export default function BookingsManagement() {
    const [bookings, setBookings] = useState([]);
    const [users, setUsers] = useState([]);
    const [workspaces, setWorkspaces] = useState([]);
    const [tariffs, setTariffs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [editBooking, setEditBooking] = useState(null);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        Promise.all([
            apiService.getAllReservations(),
            apiService.getAllUsers().catch(() => []),
            apiService.getWorkspaces().catch(() => []),
            apiService.getTariffs().catch(() => []),
        ])
            .then(([b, u, w, t]) => {
                setBookings(b || []);
                setUsers(u || []);
                setWorkspaces(w || []);
                setTariffs(t || []);
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    const reload = async () => {
        const data = await apiService.getAllReservations();
        setBookings(data || []);
    };

    const handleDelete = async (id) => {
        if (!confirm('Удалить бронирование?')) return;
        try {
            await apiService.deleteReservation(id);
            setBookings(prev => prev.filter(b => b.ID !== id));
            toast.success('Бронирование удалено');
        } catch (err) {
            toast.error('Ошибка удаления: ' + err.message);
        }
    };

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
                    <button className="btn-accent" onClick={() => setCreating(true)}><Plus size={16} /> Создать бронь</button>
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
                                    <button className="btn-icon" title="Редактировать" onClick={() => setEditBooking(b)}><Edit size={15} /></button>
                                    <button className="btn-icon danger" title="Удалить" onClick={() => handleDelete(b.ID)}><Trash2 size={15} /></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {filtered.length === 0 && (
                        <tr><td colSpan="8" className="empty-state">Бронирования не найдены</td></tr>
                    )}
                </tbody>
            </table>

            {editBooking && (
                <BookingModal
                    title={`Бронирование #${editBooking.ID}`}
                    booking={editBooking}
                    users={users}
                    workspaces={workspaces}
                    tariffs={tariffs}
                    onClose={() => setEditBooking(null)}
                    onSubmit={async (form) => {
                        try {
                            await apiService.updateReservation(editBooking.ID, {
                                workspace_id: Number(form.workspaceId),
                                tariff_id: Number(form.tariffId),
                                start_time: toRFC3339(form.date, form.timeFrom),
                                end_time: toRFC3339(form.date, form.timeTo),
                                status: form.status,
                            });
                            await reload();
                            setEditBooking(null);
                            toast.success('Бронирование обновлено');
                        } catch (err) {
                            toast.error('Ошибка сохранения: ' + err.message);
                        }
                    }}
                />
            )}

            {creating && (
                <BookingModal
                    title="Новое бронирование"
                    booking={null}
                    users={users}
                    workspaces={workspaces}
                    tariffs={tariffs}
                    onClose={() => setCreating(false)}
                    onSubmit={async (form) => {
                        if (!form.userId) return toast.warning('Выберите клиента');
                        try {
                            await apiService.adminCreateReservation({
                                user_id: Number(form.userId),
                                workspace_id: Number(form.workspaceId),
                                tariff_id: Number(form.tariffId),
                                start_time: toRFC3339(form.date, form.timeFrom),
                                end_time: toRFC3339(form.date, form.timeTo),
                            });
                            await reload();
                            setCreating(false);
                            toast.success('Бронирование создано');
                        } catch (err) {
                            toast.error('Ошибка создания: ' + err.message);
                        }
                    }}
                />
            )}
        </div>
    );
}

function BookingModal({ title, booking, users, workspaces, tariffs, onClose, onSubmit }) {
    const [form, setForm] = useState(() => ({
        userId: booking?.UserID || '',
        workspaceId: booking?.WorkspaceID || '',
        tariffId: booking?.TariffID || '',
        date: toDateInput(booking?.StartTime) || toDateInput(new Date().toISOString()),
        timeFrom: toTimeInput(booking?.StartTime) || '10:00',
        timeTo: toTimeInput(booking?.EndTime) || '18:00',
        status: booking?.Status || 'подтверждено',
    }));

    const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    const handleSubmit = () => {
        if (!form.workspaceId || !form.tariffId || !form.date || !form.timeFrom || !form.timeTo) {
            return toast.warning('Заполните все поля');
        }
        if (form.timeFrom >= form.timeTo) {
            return toast.warning('Время окончания должно быть позже начала');
        }
        onSubmit(form);
    };

    return createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
                <button className="modal-close" onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20} /></button>
                <h2 style={{ marginBottom: '1.5rem', color: 'var(--color-accent)' }}>{title}</h2>

                {!booking && (
                    <div className="form-field" style={{ marginBottom: '1rem' }}>
                        <label>Клиент</label>
                        <select value={form.userId} onChange={e => update('userId', e.target.value)}>
                            <option value="">— выберите клиента —</option>
                            {users.map(u => (
                                <option key={u.ID} value={u.ID}>
                                    {(u.FullName || u.Email) + ` (#${u.ID})`}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="form-field" style={{ marginBottom: '1rem' }}>
                    <label>Рабочее место</label>
                    <select value={form.workspaceId} onChange={e => update('workspaceId', e.target.value)}>
                        <option value="">— выберите место —</option>
                        {workspaces.map(w => (
                            <option key={w.ID} value={w.ID}>
                                {w.NameOrNumber || `#${w.ID}`}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-field" style={{ marginBottom: '1rem' }}>
                    <label>Тариф</label>
                    <select value={form.tariffId} onChange={e => update('tariffId', e.target.value)}>
                        <option value="">— выберите тариф —</option>
                        {tariffs.map(t => (
                            <option key={t.ID} value={t.ID}>
                                {t.Name} — {Number(t.Price).toLocaleString('ru-RU')} ₽
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-field" style={{ marginBottom: '1rem' }}>
                    <label>Дата</label>
                    <input type="date" value={form.date} onChange={e => update('date', e.target.value)} />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="form-field" style={{ flex: 1 }}>
                        <label>С</label>
                        <input type="time" value={form.timeFrom} onChange={e => update('timeFrom', e.target.value)} />
                    </div>
                    <div className="form-field" style={{ flex: 1 }}>
                        <label>До</label>
                        <input type="time" value={form.timeTo} onChange={e => update('timeTo', e.target.value)} />
                    </div>
                </div>

                {booking && (
                    <div className="form-field" style={{ marginBottom: '1.5rem' }}>
                        <label>Статус</label>
                        <select value={form.status} onChange={e => update('status', e.target.value)}>
                            {STATUS_OPTIONS.map(s => (
                                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button className="btn-ghost" onClick={onClose}>Отмена</button>
                    <button className="btn-accent" onClick={handleSubmit}>Сохранить</button>
                </div>
            </div>
        </div>,
        document.body
    );
}
