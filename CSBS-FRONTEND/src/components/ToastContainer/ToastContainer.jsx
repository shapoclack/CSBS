import { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import './ToastContainer.css';

export default function ToastContainer() {
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        const handleAddToast = (e) => {
            const { message, type } = e.detail;
            const id = Date.now() + Math.random();
            setToasts(prev => [...prev, { id, message, type }]);

            // Auto remove after 5 seconds
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, 5000);
        };

        window.addEventListener('add-toast', handleAddToast);
        return () => window.removeEventListener('add-toast', handleAddToast);
    }, []);

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle size={20} color="#4ade80" />;
            case 'error': return <AlertCircle size={20} color="#f87171" />;
            case 'warning': return <AlertTriangle size={20} color="#facc15" />;
            default: return <Info size={20} color="#38bdf8" />;
        }
    };

    if (toasts.length === 0) return null;

    return (
        <div className="toast-container">
            {toasts.map(t => (
                <div key={t.id} className={`toast-item toast-${t.type} fade-in`}>
                    <div className="toast-icon">{getTypeIcon(t.type)}</div>
                    <div className="toast-message">{t.message}</div>
                    <button className="toast-close" onClick={() => removeToast(t.id)}>
                        <X size={16} />
                    </button>
                </div>
            ))}
        </div>
    );
}
