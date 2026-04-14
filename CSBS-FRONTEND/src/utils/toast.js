export const emitToast = (message, type = 'info') => {
    const event = new CustomEvent('add-toast', { detail: { message, type } });
    window.dispatchEvent(event);
};

export const toast = {
    info: (message) => emitToast(message, 'info'),
    success: (message) => emitToast(message, 'success'),
    error: (message) => emitToast(message, 'error'),
    warning: (message) => emitToast(message, 'warning'),
};
