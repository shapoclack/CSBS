import { useState } from 'react';
import { Bot, Send, User, Loader2 } from 'lucide-react';
import { apiService } from '../services/api';
import './AiChat.css';

export default function AiChat() {
    const [messages, setMessages] = useState([
        { role: 'ai', content: 'Здравствуйте! Я ваш ИИ-помощник. Ищете идеальное рабочее место, хотите проверить доступность или узнать прогноз цен на ближайшие даты?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input;
        const newMessages = [...messages, { role: 'user', content: userMessage }];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        try {
            const data = await apiService.sendAiMessage(userMessage);
            setMessages(msgs => [...msgs, {
                role: 'ai',
                content: data.reply
            }]);
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
                    {isLoading && (
                        <div className="message-wrapper ai">
                            <div className="message-bubble">
                                <Bot size={16} className="message-icon" />
                                <Loader2 className="animate-spin" size={16} />
                            </div>
                        </div>
                    )}
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
        </div>
    );
}
