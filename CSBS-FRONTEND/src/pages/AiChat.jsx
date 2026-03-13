import { useState } from 'react';
import { Bot, Send, User } from 'lucide-react';
import './AiChat.css';

export default function AiChat() {
    const [messages, setMessages] = useState([
        { role: 'ai', content: 'Здравствуйте! Я ваш ИИ-помощник. Ищете идеальное рабочее место, хотите проверить доступность или узнать прогноз цен на ближайшие даты?' }
    ]);
    const [input, setInput] = useState('');

    const handleSend = () => {
        if (!input.trim()) return;

        // Add user message
        const newMessages = [...messages, { role: 'user', content: input }];
        setMessages(newMessages);
        setInput('');

        // Simulate AI response
        setTimeout(() => {
            setMessages(msgs => [...msgs, {
                role: 'ai',
                content: `Я проанализировал ваш запрос: "${input}". Наш ИИ прогнозирует, что цены на премиум-места вырастут на 15% в следующем месяце. Хотите, чтобы я забронировал для вас тихое место с быстрым Wi-Fi прямо сейчас?`
            }]);
        }, 1000);
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
                    <p className="text-muted">Прогнозирование цен и подбор рабочего пространства</p>
                </div>
            </div>

            <div className="chat-container glass-panel">
                <div className="chat-messages">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`message-wrapper ${msg.role}`}>
                            <div className="message-bubble">
                                {msg.role === 'ai' && <Bot size={16} className="message-icon" />}
                                {msg.role === 'user' && <User size={16} className="message-icon" />}
                                <p>{msg.content}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="chat-input-area">
                    <input
                        type="text"
                        className="chat-input"
                        placeholder="Введите ваше сообщение..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <button className="btn-send" onClick={handleSend}>
                        <Send size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
