import { Users } from 'lucide-react';

export default function MeetingRoomZone({ selectedDesk, handleDeskSelect, unavailableDesks = [] }) {
    const rooms = [
        { id: 'MR1 (до 6 чел.)', name: 'MR-1', capacity: 'до 6 чел.', busy: false },
        { id: 'MR2 (до 6 чел.)', name: 'MR-2', capacity: 'до 6 чел.', busy: false },
        { id: 'MR3 (до 10 чел.)', name: 'MR-3', capacity: 'до 10 чел.', busy: false },
        { id: 'MR4 (до 10 чел.)', name: 'MR-4', capacity: 'до 10 чел.', busy: false },
        { id: 'MR5 (до 12 чел.)', name: 'MR-5', capacity: 'до 12 чел.', busy: false },
        { id: 'MR6 (до 16 чел.)', name: 'MR-6', capacity: 'до 16 чел.', busy: false },
    ];

    return (
        <div className="zone-block animate-fade-in">
            <div className="zone-title">Переговорные комнаты</div>
            <div className="meeting-rooms-grid">
                {rooms.map(room => {
                    const mappedId = parseInt(room.id.replace(/\D/g, ''), 10) || 1;
                    const isBusy = unavailableDesks.includes(mappedId);
                    
                    return (
                        <div
                            key={room.id}
                            className={`meeting-room ${isBusy ? 'busy' : 'free'} ${selectedDesk === room.id ? 'selected-state' : ''}`}
                            onClick={() => {
                                if (isBusy) return;
                                handleDeskSelect(room.id);
                            }}
                        >
                            <Users size={24} />
                            <span>{room.name}</span>
                            <small>{isBusy ? 'Занято' : room.capacity}</small>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
