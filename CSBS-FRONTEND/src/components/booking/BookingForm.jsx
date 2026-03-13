import { useState } from 'react';
import { CalendarCheck, MapPin, Building2, Presentation, Armchair } from 'lucide-react';
import DatePicker from './DatePicker';
import Dropdown from './Dropdown';
import './DatePicker.css';

export default function BookingForm({ selectedType, handleTypeSelect, selectedDesk, getPrice, onSubmit }) {
    const isOffice = selectedType === 'office';
    const today = new Date().toISOString().split('T')[0];

    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [timeFrom, setTimeFrom] = useState('08:00');
    const [timeTo, setTimeTo] = useState('09:00');
    const [location, setLocation] = useState('');
    const [tariff, setTariff] = useState('1h');

    const timeFromOptions = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
    const timeToOptions = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

    const handleTimeFromChange = (e) => {
        const val = e.target.value;
        setTimeFrom(val);
        // Automatically calculate end time based on the current tariff
        const durationMap = { '1h': 1, '4h': 4, '8h': 8 };
        updateTimeRange(durationMap[tariff] || 1, val);
    };

    const handleTariffChange = (selectedTariff) => {
        setTariff(selectedTariff);
        const durationMap = { '1h': 1, '4h': 4, '8h': 8 };
        updateTimeRange(durationMap[selectedTariff] || 1, timeFrom);
    };

    const updateTimeRange = (hours, startValStr) => {
        const hFrom = parseInt(startValStr, 10);
        let hTo = hFrom + hours;
        
        let newFrom = hFrom;
        // If end time exceeds 20:00 (closing time), we must push the start time back
        if (hTo > 20) {
            hTo = 20;
            newFrom = hTo - hours;
            // Ensure we don't go before 08:00 (opening time)
            if (newFrom < 8) newFrom = 8;
            setTimeFrom(`${String(newFrom).padStart(2, '0')}:00`);
        }
        
        setTimeTo(`${String(hTo).padStart(2, '0')}:00`);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            dateFrom,
            dateTo: isOffice ? dateTo : dateFrom,
            timeFrom,
            timeTo,
            location,
            tariff
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
                    <Dropdown 
                        options={[
                            { value: '1', label: 'CSBS Центр — ул. Тверская, 15' },
                            { value: '2', label: 'CSBS Сити — Кутузовский пр-т, 2' },
                            { value: '3', label: 'CSBS Парк — ул. Парковая, 8' }
                        ]}
                        value={location}
                        onChange={(val) => setLocation(val)}
                        placeholder="Выберите локацию"
                        id="location"
                    />
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
                            <div className="form-section">
                                <label className="form-label">Тариф (продолжительность)</label>
                                <Dropdown 
                                    options={[
                                        { value: '1h', label: '1 час' },
                                        { value: '4h', label: '4 часа (Полдня)' },
                                        { value: '8h', label: '8 часов (Полный день)' }
                                    ]}
                                    value={tariff}
                                    onChange={handleTariffChange}
                                    id="tariff-select"
                                />
                            </div>
                            
                            <div className="form-row">
                                <div className="form-section">
                                    <label className="form-label" htmlFor="time-from">Начало</label>
                                    <Dropdown 
                                        options={timeFromOptions.map(t => ({ value: t, label: t }))}
                                        value={timeFrom}
                                        onChange={(val) => handleTimeFromChange({ target: { value: val } })}
                                        id="time-from"
                                    />
                                </div>
                                <div className="form-section">
                                    <label className="form-label" htmlFor="time-to">Конец</label>
                                    <div className="form-input-readonly">
                                        {timeTo}
                                    </div>
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
                        <span className="summary-price">{getPrice(tariff, location)}</span>
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
