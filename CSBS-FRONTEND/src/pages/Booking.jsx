import { useState, useEffect } from 'react';
import BookingForm from '../components/booking/BookingForm';
import BookingMap from '../components/booking/BookingMap';
import AuthModal from '../components/AuthModal';
import { Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import './Booking.css';

export default function Booking() {
    const { isLoggedIn } = useAuth();
    const [selectedType, setSelectedType] = useState('desk');
    const [selectedDesk, setSelectedDesk] = useState(null);
    const [tariffs, setTariffs] = useState([]);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    useEffect(() => {
        apiService.getTariffs().then(data => setTariffs(data)).catch(console.error);
    }, []);

    const handleTypeSelect = (type) => {
        setSelectedType(type);
        setSelectedDesk(null); // Reset desk on type change
    };

    const handleDeskSelect = (deskId) => {
        setSelectedDesk(deskId);
    };

    const getPrice = (tariffStr, location) => {
        if (!selectedDesk) return '—';
        if (!location) return 'Выберите локацию';
        
        const durationMap = { '1h': 60, '4h': 240, '8h': 480 };
        const mins = durationMap[tariffStr];
        
        const t = tariffs.find(t => t.LocationID === parseInt(location) && t.DurationMinutes === mins);
        if (t) return `${t.Price} ₽`;
        
        return '—';
    };

    const handleReservationSubmit = async (formData) => {
        try {
            // Mocking IDs based on selection string, e.g. "A1" -> 1
            const workspaceIdMatch = selectedDesk.match(/\d+/);
            const wId = workspaceIdMatch ? parseInt(workspaceIdMatch[0], 10) : 1;
            
            const durationMap = { '1h': 60, '4h': 240, '8h': 480 };
            const mins = durationMap[formData.tariff || '1h'];
            // Find tariff ID. If location not passed in formData, fallback to 1
            const locId = formData.location ? parseInt(formData.location) : 1;
            const t = tariffs.find(t => t.LocationID === locId && t.DurationMinutes === mins);
            const tId = t ? t.ID : 1;

            // Construct ISO strings "2026-03-15T10:00:00Z"
            // Ensure dateFrom is set, else use today
            const startD = formData.dateFrom || new Date().toISOString().split('T')[0];
            const endD = formData.dateTo || startD;

            const startTime = `${startD}T${formData.timeFrom}:00Z`;
            const endTime = `${endD}T${formData.timeTo}:00Z`;

            await apiService.createReservation({
                workspace_id: wId,
                tariff_id: tId,
                start_time: startTime,
                end_time: endTime
            });
            
            alert('Бронирование успешно создано! Вы можете посмотреть его в Личном кабинете.');
        } catch(err) {
            console.error(err);
            alert('Ошибка при создании бронирования: ' + err.message);
        }
    };

    return (
        <div className="booking-page">
            <div className="booking-page-header">
                <div className="container">
                    <h1>Бронирование</h1>
                    <p>Выберите тип пространства, укажите дату и подберите место на карте зала.</p>
                </div>
            </div>

            <div className="container booking-layout" style={{ position: 'relative' }}>
                {!isLoggedIn && (
                    <div 
                        className="auth-overlay"
                        style={{
                            position: 'absolute',
                            top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: 'rgba(10, 14, 23, 0.75)',
                            backdropFilter: 'blur(4px)',
                            zIndex: 50,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderRadius: '16px',
                            color: '#fff',
                            textAlign: 'center',
                            padding: '2rem',
                            margin: '0 -15px' // to cover the container padding somewhat if necessary, but depends on CSS. Since booking-layout is usually a grid, absolute positioning will cover it.
                        }}
                    >
                        <Lock size={64} style={{ marginBottom: '1.5rem', color: 'var(--color-accent)' }} />
                        <h3 style={{ fontSize: '1.75rem', marginBottom: '1rem', fontWeight: 600 }}>Требуется авторизация</h3>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', marginBottom: '2rem', maxWidth: '400px' }}>
                            Войдите или зарегистрируйтесь, чтобы получить доступ к бронированию мест и переговорных комнат
                        </p>
                        <button className="btn btn-primary btn-lg" onClick={() => setIsAuthModalOpen(true)}>
                            Вход/Регистрация
                        </button>
                    </div>
                )}

                <div style={{ display: 'contents', opacity: isLoggedIn ? 1 : 0.4, pointerEvents: isLoggedIn ? 'auto' : 'none' }}>
                    <BookingForm 
                        selectedType={selectedType} 
                        handleTypeSelect={handleTypeSelect} 
                        selectedDesk={selectedDesk} 
                        getPrice={getPrice} 
                        onSubmit={handleReservationSubmit}
                    />
                    
                    <BookingMap 
                        selectedType={selectedType}
                        selectedDesk={selectedDesk}
                        handleDeskSelect={handleDeskSelect}
                    />
                </div>
            </div>

            <AuthModal 
                isOpen={isAuthModalOpen} 
                onClose={() => setIsAuthModalOpen(false)} 
                initialMode="login" 
            />
        </div>
    );
}
