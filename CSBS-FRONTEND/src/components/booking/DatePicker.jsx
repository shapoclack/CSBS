import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

const MONTHS_RU = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];
const DAYS_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

function toDateObj(str) {
    if (!str) return null;
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
}

function toStr(d) {
    if (!d) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
}

function formatDisplay(str) {
    if (!str) return '';
    const [y, m, d] = str.split('-');
    return `${d}.${m}.${y}`;
}

function getCalendarDays(year, month) {
    const firstDay = new Date(year, month, 1);
    // Monday-based week: 0=Mon … 6=Sun
    const startOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();

    const cells = [];
    for (let i = startOffset - 1; i >= 0; i--) {
        cells.push({ day: daysInPrev - i, current: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
        cells.push({ day: d, current: true });
    }
    while (cells.length % 7 !== 0) {
        cells.push({ day: cells.length - daysInMonth - startOffset + 1, current: false });
    }
    return cells;
}

export default function DatePicker({ id, value, onChange, min, placeholder = 'Выберите дату' }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const minDate = min ? toDateObj(min) : today;

    const initial = value ? toDateObj(value) : null;
    const [open, setOpen] = useState(false);
    const [viewYear, setViewYear] = useState((initial || today).getFullYear());
    const [viewMonth, setViewMonth] = useState((initial || today).getMonth());

    const wrapperRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(e) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    function prevMonth() {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
        else setViewMonth(m => m - 1);
    }
    function nextMonth() {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
        else setViewMonth(m => m + 1);
    }

    function selectDay(day, isCurrent) {
        if (!isCurrent) return;
        const picked = new Date(viewYear, viewMonth, day);
        picked.setHours(0, 0, 0, 0);
        if (minDate && picked < minDate) return;
        onChange(toStr(picked));
        setOpen(false);
    }

    const cells = getCalendarDays(viewYear, viewMonth);

    return (
        <div className="dp-wrapper" ref={wrapperRef}>
            <button
                type="button"
                id={id}
                className={`dp-trigger form-input ${value ? 'dp-has-value' : ''}`}
                onClick={() => setOpen(o => !o)}
            >
                <Calendar size={16} className="dp-icon" />
                <span>{value ? formatDisplay(value) : placeholder}</span>
            </button>

            {open && (
                <div className="dp-popup glass-panel">
                    {/* Header */}
                    <div className="dp-header">
                        <button type="button" className="dp-nav-btn" onClick={prevMonth}>
                            <ChevronLeft size={18} />
                        </button>
                        <span className="dp-month-label">
                            {MONTHS_RU[viewMonth]} {viewYear}
                        </span>
                        <button type="button" className="dp-nav-btn" onClick={nextMonth}>
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    {/* Day names */}
                    <div className="dp-grid dp-daynames">
                        {DAYS_RU.map(d => (
                            <span key={d} className={`dp-dayname ${d === 'Сб' || d === 'Вс' ? 'dp-weekend' : ''}`}>
                                {d}
                            </span>
                        ))}
                    </div>

                    {/* Cells */}
                    <div className="dp-grid dp-cells">
                        {cells.map((cell, i) => {
                            const cellDate = new Date(
                                cell.current ? viewYear : (viewMonth === 0 && !cell.current && cell.day > 15 ? viewYear - 1 : viewYear),
                                cell.current ? viewMonth : (cell.day > 15 ? viewMonth - 1 : viewMonth + 1),
                                cell.day
                            );
                            cellDate.setHours(0, 0, 0, 0);
                            const isPast = minDate && cellDate < minDate;
                            const isSelected = value && toStr(cellDate) === value;
                            const isToday = toStr(cellDate) === toStr(today);

                            return (
                                <button
                                    key={i}
                                    type="button"
                                    className={[
                                        'dp-cell',
                                        !cell.current ? 'dp-other-month' : '',
                                        isPast ? 'dp-past' : '',
                                        isSelected ? 'dp-selected' : '',
                                        isToday && !isSelected ? 'dp-today' : '',
                                    ].join(' ')}
                                    onClick={() => selectDay(cell.day, cell.current)}
                                    disabled={isPast || !cell.current}
                                >
                                    {cell.day}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
