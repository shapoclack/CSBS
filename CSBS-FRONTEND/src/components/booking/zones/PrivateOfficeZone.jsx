import { Building2 } from 'lucide-react';

export default function PrivateOfficeZone({ selectedDesk, handleDeskSelect }) {
    const offices = [
        { 
            id: 'PO1 (8 чел.)', 
            name: 'PO-1 (Приватный кабинет)', 
            capacity: 'На 8 человек', 
            area: '35 м²',
            description: 'Уютный кабинет с панорамными окнами. Отлично подходит для небольших команд.',
            amenities: ['Маркерная доска', 'МФУ', 'Чай/Кофе'],
            busy: false 
        },
        { 
            id: 'PO2 (12 чел.)', 
            name: 'PO-2 (Просторный офис)', 
            capacity: 'На 12 человек', 
            area: '50 м²',
            description: 'Просторный офис с зоной отдыха. Включает собственную небольшую переговорную.',
            amenities: ['Переговорная зона', 'МФУ', 'Чай/Кофе'],
            busy: false 
        },
        { 
            id: 'PO3 (16 чел.)', 
            name: 'PO-3 (Премиум офис)', 
            capacity: 'На 16 человек', 
            area: '75 м²',
            description: 'Большой премиум офис для растущих команд. Отдельный вход и свой лаундж.',
            amenities: ['Свой лаундж', 'МФУ', 'Чай/Кофе', 'Личный шкафчик'],
            busy: false 
        },
    ];

    return (
        <div className="zone-block animate-fade-in">
            <div className="zone-title">Приватные офисы</div>
            <div className="private-offices-list">
                {offices.map(office => (
                    <div
                        key={office.id}
                        className={`private-office-card ${office.busy ? 'busy' : 'free'} ${selectedDesk === office.id ? 'selected-state' : ''}`}
                        onClick={() => !office.busy && handleDeskSelect(office.id)}
                    >
                        <div className="office-icon-wrapper">
                            <Building2 size={32} />
                        </div>
                        <div className="office-info">
                            <div className="office-header">
                                <h3>{office.name}</h3>
                            </div>
                            <div className="office-badges">
                                <span className="badge">{office.capacity}</span>
                                <span className="badge">{office.area}</span>
                            </div>
                            <p className="office-desc">{office.description}</p>
                            <div className="office-amenities">
                                {office.amenities.map((item, i) => (
                                    <span key={i} className="amenity-dot">{item}</span>
                                ))}
                            </div>
                        </div>
                        <div className="office-status">
                            {office.busy ? (
                                <span className="status-badge busy">Занято</span>
                            ) : (
                                <span className={`status-badge ${selectedDesk === office.id ? 'selected' : 'free'}`}>
                                    {selectedDesk === office.id ? 'Выбрано' : 'Свободно'}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
