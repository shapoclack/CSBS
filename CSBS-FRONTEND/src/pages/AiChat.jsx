import { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Loader2, CalendarCheck, Clock, MapPin, LogIn } from 'lucide-react';
import { apiService } from '../services/api';
import AuthModal from '../components/AuthModal';
import './AiChat.css';

function BookingCard({ booking }) {
    return (
        <div className="booking-card">
            <div className="booking-card-header">
                <CalendarCheck size={18} />
                <span>Бронирование подтверждено!</span>
            </div>
            <div className="booking-card-body">
                <div className="booking-card-row">
                    <MapPin size={14} />
                    <span>{booking.workspace_name}</span>
                </div>
                <div className="booking-card-row">
                    <CalendarCheck size={14} />
                    <span>{booking.date}</span>
                </div>
                <div className="booking-card-row">
                    <Clock size={14} />
                    <span>{booking.time_from} — {booking.time_to}</span>
                </div>
                {booking.price && (
                    <div className="booking-card-price">
                        {booking.price}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function AiChat() {
    const [messages, setMessages] = useState(() => {
        const saved = sessionStorage.getItem('ai_chat_history');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Failed to parse ai_chat_history", e);
            }
        }
        return [
            { role: 'ai', content: 'Здравствуйте! Я ваш ИИ-помощник. Ищете идеальное рабочее место, хотите проверить доступность или узнать прогноз цен на ближайшие даты? Я также могу забронировать место для вас прямо здесь!' }
        ];
    });
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
        sessionStorage.setItem('ai_chat_history', JSON.stringify(messages));
    }, [messages, isLoading]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input;
        const newMessages = [...messages, { role: 'user', content: userMessage }];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        try {
            // Отправляем историю (без первого приветственного сообщения, если нужно)
            const history = newMessages
                .filter((_, i) => i > 0) // пропускаем стартовое приветствие
                .slice(-10) // последние 10 сообщений
                .map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content }));

            const data = await apiService.sendAiMessage(userMessage, history);

            const aiMessage = {
                role: 'ai',
                content: data.reply,
                action: data.action || null,
                booking: data.booking || null,
            };

            setMessages(msgs => [...msgs, aiMessage]);
        } catch (error) {
            console.error(error);
            setMessages(msgs => [...msgs, {
                role: 'ai',
                content: 'Ошибка соединения с сервером.'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSend();
    };

    return (
        <div className="chat-page container">
            <div className="chat-header">
                <div className="ai-avatar">
                    <Bot size={32} className="text-accent" />
                </div>
                <div>
                    <h2>ИИ-Ассистент</h2>
                    <p className="text-muted">Прогнозирование цен, подбор и бронирование рабочего пространства</p>
                </div>
            </div>

            <div className="chat-container glass-panel">
                <div className="chat-messages">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`message-wrapper ${msg.role}`}>
                            <div className="message-bubble">
                                {msg.role === 'ai' && <Bot size={16} className="message-icon" />}
                                {msg.role === 'user' && <User size={16} className="message-icon" />}
                                <div className="message-content">
                                    <p>{msg.content}</p>

                                    {/* Карточка бронирования */}
                                    {msg.action === 'booked' && msg.booking && (
                                        <BookingCard booking={msg.booking} />
                                    )}

                                    {/* Кнопка авторизации */}
                                    {msg.action === 'need_auth' && (
                                        <button
                                            className="chat-auth-btn"
                                            onClick={() => setIsAuthModalOpen(true)}
                                        >
                                            <LogIn size={16} />
                                            Войти в аккаунт
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="message-wrapper ai">
                            <div className="message-bubble">
                                <Bot size={16} className="message-icon" />
                                <Loader2 className="animate-spin" size={16} />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="chat-input-area">
                    <input
                        type="text"
                        className="chat-input"
                        placeholder="Введите ваше сообщение..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading}
                    />
                    <button className="btn-send" onClick={handleSend} disabled={isLoading}>
                        <Send size={20} />
                    </button>
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
