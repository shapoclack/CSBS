import { Users } from 'lucide-react';

export default function MeetingRoomZone({ selectedDesk, handleDeskSelect }) {
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
                {rooms.map(room => (
                    <div
                        key={room.id}
                        className={`meeting-room ${room.busy ? 'busy' : 'free'} ${selectedDesk === room.id ? 'selected-state' : ''}`}
                        onClick={() => !room.busy && handleDeskSelect(room.id)}
                    >
                        <Users size={24} />
                        <span>{room.name}</span>
                        <small>{room.busy ? 'Занято' : room.capacity}</small>
                    </div>
                ))}
            </div>
        </div>
    );
}
