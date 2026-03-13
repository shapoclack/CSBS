export default function DeskZone({ selectedDesk, handleDeskSelect }) {
    // Generate 16 desks (A1 to A16)
    const desks = Array.from({ length: 16 }, (_, i) => `A${i + 1}`);
    const busyDesks = [];

    return (
        <div className="zone-block animate-fade-in">
            <div className="zone-title">Зона А — Open Space</div>
            <div className="desk-grid">
                {desks.map(id => {
                    const isBusy = busyDesks.includes(id);
                    return (
                        <div
                            key={id}
                            className={`desk ${isBusy ? 'busy' : 'free'} ${selectedDesk === id ? 'selected-state' : ''}`}
                            onClick={() => !isBusy && handleDeskSelect(id)}
                        >
                            <span>{id}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
