import { LayoutDashboard, Info } from 'lucide-react';
import DeskZone from './zones/DeskZone';
import MeetingRoomZone from './zones/MeetingRoomZone';
import PrivateOfficeZone from './zones/PrivateOfficeZone';

export default function BookingMap({ selectedType, selectedDesk, handleDeskSelect }) {
    return (
        <section className="desk-map-col">
            <div className="desk-map-card glass-panel">
                <div className="map-header">
                    <h2 className="form-title">
                        <LayoutDashboard className="form-title-icon" />
                        Карта зала
                    </h2>
                    <div className="map-legend">
                        <div className="legend-item"><span className="legend-dot free"></span>Свободно</div>
                        <div className="legend-item"><span className="legend-dot busy"></span>Занято</div>
                        <div className="legend-item"><span className="legend-dot selected"></span>Выбрано</div>
                    </div>
                </div>

                <div className="floor-plan">
                    <div className="floor-plan-placeholder">
                        <div className="floor-zones">
                            {selectedType === 'desk' && (
                                <DeskZone selectedDesk={selectedDesk} handleDeskSelect={handleDeskSelect} />
                            )}
                            {selectedType === 'room' && (
                                <MeetingRoomZone selectedDesk={selectedDesk} handleDeskSelect={handleDeskSelect} />
                            )}
                            {selectedType === 'office' && (
                                <PrivateOfficeZone selectedDesk={selectedDesk} handleDeskSelect={handleDeskSelect} />
                            )}
                        </div>

                        <div className="map-coming-soon">
                            <Info size={18} />
                            <span>Интерактивная карта с точным планом этажей появится в следующем обновлении. Пока выберите место на схеме выше.</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
