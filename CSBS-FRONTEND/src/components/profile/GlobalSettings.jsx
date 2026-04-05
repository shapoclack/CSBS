import { useState } from 'react';
import { Settings, Save } from 'lucide-react';

export default function GlobalSettings() {
    const [settings, setSettings] = useState({
        workHours: '09:00 – 22:00',
        maxBookingsPerUser: 3,
        defaultBookingDuration: 2,
        systemEmail: 'admin@csbs.ru',
        supportEmail: 'support@csbs.ru',
        maintenanceMode: false,
    });
    const [saved, setSaved] = useState(false);

    const update = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        setSaved(false);
    };

    const handleSave = () => {
        // TODO: POST to /api/settings when backend endpoint exists
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="profile-card glass-panel fade-in">
            <div className="panel-header">
                <h2><Settings size={22} className="text-accent" /> Глобальные настройки</h2>
                <div className="panel-toolbar">
                    <button className="btn-accent" onClick={handleSave}>
                        <Save size={16} /> {saved ? 'Сохранено ✓' : 'Сохранить'}
                    </button>
                </div>
            </div>

            <div className="form-grid">
                <div className="form-field">
                    <label>Время работы коворкинга</label>
                    <input type="text" value={settings.workHours} onChange={e => update('workHours', e.target.value)} />
                </div>

                <div className="form-field">
                    <label>Макс. бронирований на пользователя</label>
                    <input type="number" min="1" max="20" value={settings.maxBookingsPerUser} onChange={e => update('maxBookingsPerUser', +e.target.value)} />
                </div>

                <div className="form-field">
                    <label>Длительность брони по умолчанию (ч)</label>
                    <input type="number" min="1" max="12" value={settings.defaultBookingDuration} onChange={e => update('defaultBookingDuration', +e.target.value)} />
                </div>

                <div className="form-field">
                    <label>Системный email</label>
                    <input type="email" value={settings.systemEmail} onChange={e => update('systemEmail', e.target.value)} />
                </div>

                <div className="form-field">
                    <label>Email техподдержки</label>
                    <input type="email" value={settings.supportEmail} onChange={e => update('supportEmail', e.target.value)} />
                </div>
            </div>

            <div className="form-check" style={{ marginTop: '1.5rem' }}>
                <input
                    type="checkbox"
                    checked={settings.maintenanceMode}
                    onChange={e => update('maintenanceMode', e.target.checked)}
                    id="maintenanceToggle"
                />
                <span>Режим технических работ (блокировка входа для всех клиентов)</span>
            </div>
        </div>
    );
}
