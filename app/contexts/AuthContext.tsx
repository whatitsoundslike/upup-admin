'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
    isAuthenticated: boolean;
    login: (password: string) => boolean;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 관리자 비밀번호 (실제 환경에서는 환경변수나 서버에서 관리)
const ADMIN_PASSWORD = '1234';
const AUTH_KEY = 'upup_admin_auth';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24시간 (밀리초)

interface AuthData {
    authenticated: boolean;
    expiresAt: number;
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // 로컬 스토리지에서 인증 상태 확인
        const checkAuth = () => {
            try {
                // Only access localStorage in browser environment
                if (typeof window !== 'undefined') {
                    const authData = localStorage.getItem(AUTH_KEY);
                    if (authData) {
                        const parsed: AuthData = JSON.parse(authData);
                        const now = Date.now();

                        if (parsed.authenticated && parsed.expiresAt > now) {
                            setIsAuthenticated(true);
                        } else {
                            // 만료된 세션 삭제
                            localStorage.removeItem(AUTH_KEY);
                            setIsAuthenticated(false);
                        }
                    }
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                if (typeof window !== 'undefined') {
                    localStorage.removeItem(AUTH_KEY);
                }
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = (password: string): boolean => {
        if (password === ADMIN_PASSWORD) {
            const authData: AuthData = {
                authenticated: true,
                expiresAt: Date.now() + SESSION_DURATION,
            };
            if (typeof window !== 'undefined') {
                localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
            }
            setIsAuthenticated(true);
            return true;
        }
        return false;
    };

    const logout = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(AUTH_KEY);
        }
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
