/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from 'react';
import { authService } from '../services/auth.service';
import type { UserResponseDto } from '../types/dto';

export interface AuthContextType {
    user: UserResponseDto | null;
    token: string | null;
    refreshToken: string | null;
    login: (token: string, refreshToken: string, userData: UserResponseDto) => void;
    logout: () => Promise<void>;
    loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserResponseDto | null>(() => {
        const userLocal = localStorage.getItem('user');
        if (userLocal) {
            try {
                return JSON.parse(userLocal);
            } catch (error) {
                console.error("Error parsing user from localStorage", error);
                return null;
            }
        }
        return null;
    });
    const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
    const [refreshToken, setRefreshToken] = useState<string | null>(() => localStorage.getItem('refreshToken'));
    const loading = false;

    // Hydration is now synchronous in the useState initializer.

    const login = (newToken: string, newRefreshToken: string, userData: UserResponseDto) => {
        localStorage.setItem('token', newToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(newToken);
        setRefreshToken(newRefreshToken);
        setUser(userData);
    };

    const logout = async () => {
        try {
            await authService.logout();
        } catch (error) {
            console.error("Error calling backend logout", error);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            setToken(null);
            setRefreshToken(null);
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, refreshToken, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
