import { useState } from 'react';
import { CalendarCheck, MapPin, Building2, Presentation, Armchair } from 'lucide-react';
import DatePicker from './DatePicker';
import './DatePicker.css';

export default function BookingForm({ selectedType, handleTypeSelect, selectedDesk, getPrice, onSubmit }) {
    const isOffice = selectedType === 'office';
    const today = new Date().toISOString().split('T')[0];

    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [timeFrom, setTimeFrom] = useState('08:00');
    const [timeTo, setTimeTo] = useState('12:00');

    const timeFromOptions = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
    const timeToOptions = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

    const handleTimeFromChange = (e) => {
        const val = e.target.value;
        setTimeFrom(val);
        if (val >= timeTo) {
            const h = parseInt(val, 10);
            setTimeTo(`${String(h + 1).padStart(2, '0')}:00`);
        }
    };

    const handleTimeToChange = (e) => {
        const val = e.target.value;
        setTimeTo(val);
        if (val <= timeFrom) {
            const h = parseInt(val, 10);
            setTimeFrom(`${String(h - 1).padStart(2, '0')}:00`);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            dateFrom,
            dateTo: isOffice ? dateTo : dateFrom,
            timeFrom,
            timeTo
        });
    };

    return (
        <aside className="booking-form-col">
            <div className="booking-form-card glass-panel">
                <h2 className="form-title">
                    <CalendarCheck className="form-title-icon" />
                    Форма бронирования
                </h2>

                <div className="form-section">
                    <label className="form-label">Тип пространства</label>
                    <div className="type-selector">
                        <button
                            className={`type-btn ${selectedType === 'desk' ? 'active' : ''}`}
                            onClick={() => handleTypeSelect('desk')}
                        >
                            <Armchair size={20} />
                            <span>Рабочее место</span>
                        </button>
                        <button
                            className={`type-btn ${selectedType === 'room' ? 'active' : ''}`}
                            onClick={() => handleTypeSelect('room')}
                        >
                            <Presentation size={20} />
                            <span>Переговорная</span>
                        </button>
                        <button
                            className={`type-btn ${selectedType === 'office' ? 'active' : ''}`}
                            onClick={() => handleTypeSelect('office')}
                        >
                            <Building2 size={20} />
                            <span>Приватный офис</span>
                        </button>
                    </div>
                </div>

                <div className="form-section">
                    <label className="form-label" htmlFor="location">Локация</label>
                    <select id="location" className="form-select">
                        <option value="">Выберите локацию</option>
                        <option>CSBS Центр — ул. Тверская, 15</option>
                        <option>CSBS Сити — Кутузовский пр-т, 2</option>
                        <option>CSBS Парк — ул. Парковая, 8</option>
                    </select>
                </div>

                {isOffice ? (
                    /* Офис: диапазон дат */
                    <div className="form-row">
                        <div className="form-section">
                            <label className="form-label">Дата начала</label>
                            <DatePicker
                                id="date-from"
                                value={dateFrom}
                                onChange={setDateFrom}
                                min={today}
                                placeholder="дд.мм.гггг"
                            />
                        </div>
                        <div className="form-section">
                            <label className="form-label">Дата окончания</label>
                            <DatePicker
                                id="date-to"
                                value={dateTo}
                                onChange={setDateTo}
                                min={dateFrom || today}
                                placeholder="дд.мм.гггг"
                            />
                        </div>
                    </div>
                ) : (
                    /* Рабочее место / Переговорная: одна дата + часы */
                    <>
                        <div className="form-section">
                            <label className="form-label">Дата</label>
                            <DatePicker
                                id="date-from"
                                value={dateFrom}
                                onChange={setDateFrom}
                                min={today}
                                placeholder="дд.мм.гггг"
                            />
                        </div>
                        <div className="form-row">
                            <div className="form-section">
                                <label className="form-label" htmlFor="time-from">Начало</label>
                                <select id="time-from" className="form-select" value={timeFrom} onChange={handleTimeFromChange}>
                                    {timeFromOptions.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-section">
                                <label className="form-label" htmlFor="time-to">Конец</label>
                                <select id="time-to" className="form-select" value={timeTo} onChange={handleTimeToChange}>
                                    {timeToOptions.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </>
                )}



                {/* ВЫБРАННОЕ МЕСТО */}
                <div className={`selected-desk-banner ${selectedDesk ? 'visible' : ''}`}>
                    <MapPin size={18} />
                    <span>Выбранное место: <strong>{selectedDesk || 'не выбрано'}</strong></span>
                </div>

                {/* ИТОГ */}
                <div className="form-summary">
                    <div className="summary-row">
                        <span>Стоимость</span>
                        <span className="summary-price">{getPrice()}</span>
                    </div>
                    {!selectedDesk && (
                        <div className="summary-row muted">
                            <span>Выберите место на карте, чтобы увидеть стоимость</span>
                        </div>
                    )}
                </div>

                <button 
                    className="btn btn-primary btn-block btn-submit" 
                    disabled={!selectedDesk}
                    onClick={handleSubmit}
                >
                    Подтвердить бронирование
                </button>
            </div>
        </aside>
    );
}
