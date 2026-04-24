import api from './api';

export const authService = {
    async logout() {
        try {
            // Optional: call backend logout if endpoint exists
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        }
    }
};
