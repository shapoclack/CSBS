import { useState, useEffect, useRef } from 'react';
import { Terminal, Search, X } from 'lucide-react';
import { apiService } from '../../services/api';

export default function SystemAuditLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const bottomRef = useRef(null);

    useEffect(() => {
        apiService.getAuditLogs()
            .then(data => setLogs(data || []))
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    const filtered = logs.filter(l => {
        if (typeof l === 'string') {
            return l.toLowerCase().includes(search.toLowerCase());
        }
        return false; // ignore old object-based logs if any exist
    });

    const renderLogLine = (line, idx) => {
        // Colorize simple patterns from the console
        // Example: 2026/04/06 00:50:47 "GET http://...
        const parts = [];
        
        let coloredLine = line;
        
        // Match dates like 2026/04/06 00:50:47
        coloredLine = coloredLine.replace(/(\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2})/g, '<span style="color:var(--color-text-muted)">$1</span>');
        
        // Match HTTP Methods
        coloredLine = coloredLine.replace(/"(GET|POST|PUT|DELETE|OPTIONS) /g, '"<span style="color:#c084fc">$1</span> ');
        
        // Match status codes (2xx green, 3xx yellow, 4xx/5xx red)
        coloredLine = coloredLine.replace(/ - (2\d{2}) /g, ' - <span style="color:#4ade80">$1</span> ');
        coloredLine = coloredLine.replace(/ - (3\d{2}) /g, ' - <span style="color:#facc15">$1</span> ');
        coloredLine = coloredLine.replace(/ - ([45]\d{2}) /g, ' - <span style="color:#f87171">$1</span> ');
        
        // Match INFO:, WARNING:, ERROR:
        coloredLine = coloredLine.replace(/INFO:/g, '<span style="color:#38bdf8; font-weight:bold">INFO:</span>');
        coloredLine = coloredLine.replace(/WARNING:/g, '<span style="color:#facc15; font-weight:bold">WARNING:</span>');
        coloredLine = coloredLine.replace(/ERROR:/g, '<span style="color:#f87171; font-weight:bold">ERROR:</span>');

        // Match timings like 1.404ms
        coloredLine = coloredLine.replace(/(\d+(\.\d+)?[µm]?s)/g, '<span style="color:#4ade80">$1</span>');

        return (
            <div key={idx} className="log-line" style={{ display: 'block', wordWrap: 'break-word', marginBottom: '4px' }} dangerouslySetInnerHTML={{ __html: coloredLine }} />
        );
    };

    if (loading) return <div className="profile-card glass-panel"><div className="empty-state">Загрузка логов сервера...</div></div>;
    if (error) return <div className="profile-card glass-panel"><div className="empty-state">Ошибка: {error}</div></div>;

    return (
        <div className="profile-card glass-panel fade-in">
            <div className="panel-header">
                <h2><Terminal size={22} className="text-accent" /> Системные логи (server.log)</h2>
                <div className="panel-toolbar">
                    <div className="search-input-wrap">
                        <Search size={16} color="rgba(255,255,255,0.4)" />
                        <input placeholder="Греп логов..." value={search} onChange={e => setSearch(e.target.value)} />
                        {search && <button className="btn-icon" onClick={() => setSearch('')}><X size={14} /></button>}
                    </div>
                </div>
            </div>

            <div className="audit-terminal" style={{ 
                background: '#0d1117', /* GitHub dark bg */
                maxHeight: '500px', 
                overflowY: 'auto' 
            }}>
                {filtered.map((l, idx) => renderLogLine(l, idx))}
                {filtered.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                        {logs.length === 0 ? 'Файл логов пуст.' : 'Нет совпадений'}
                    </div>
                )}
                <div ref={bottomRef} />
            </div>
        </div>
    );
}
