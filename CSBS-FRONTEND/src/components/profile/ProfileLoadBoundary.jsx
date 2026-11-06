import { Component } from 'react';

// Ошибка загрузки отдельного чанка не должна скрывать весь личный кабинет.
export default class ProfileLoadBoundary extends Component {
    state = { failed: false };

    static getDerivedStateFromError() {
        return { failed: true };
    }

    render() {
        if (this.state.failed) {
            return (
                <div className="profile-card glass-panel" role="alert">
                    <p>Не удалось открыть раздел. Проверьте соединение и обновите страницу.</p>
                    <button type="button" onClick={() => window.location.reload()}>
                        Обновить страницу
                    </button>
                    {this.props.onClose && (
                        <button type="button" onClick={this.props.onClose}>Закрыть</button>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}
