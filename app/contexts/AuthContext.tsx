'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
    id: string;
    username: string;
    name: string | null;
    permissions: string[];
    isSuper: boolean;
}

export interface Category {
    id: string;
    value: string;
    label: string;
    sortOrder: number;
    isActive: boolean;
}

interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    isLoading: boolean;
    hasPermission: (category: string) => boolean;
    getAllowedCategories: () => Category[];
    categories: Category[];
    refreshCategories: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_KEY = 'upup_admin_auth';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24시간 (밀리초)

interface AuthData {
    authenticated: boolean;
    expiresAt: number;
    user: User;
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [categories, setCategories] = useState<Category[]>([]);

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/categories');
            if (res.ok) {
                const data = await res.json();
                setCategories(data);
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    useEffect(() => {
        // 로컬 스토리지에서 인증 상태 확인
        const checkAuth = async () => {
            try {
                // Only access localStorage in browser environment
                if (typeof window !== 'undefined') {
                    const authData = localStorage.getItem(AUTH_KEY);
                    if (authData) {
                        const parsed: AuthData = JSON.parse(authData);
                        const now = Date.now();

                        if (parsed.authenticated && parsed.expiresAt > now) {
                            setIsAuthenticated(true);
                            setUser(parsed.user);
                            await fetchCategories();
                        } else {
                            // 만료된 세션 삭제
                            localStorage.removeItem(AUTH_KEY);
                            setIsAuthenticated(false);
                            setUser(null);
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

    const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                return { success: false, error: data.error || '로그인에 실패했습니다.' };
            }

            const authData: AuthData = {
                authenticated: true,
                expiresAt: Date.now() + SESSION_DURATION,
                user: data.user,
            };

            if (typeof window !== 'undefined') {
                localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
            }
            setIsAuthenticated(true);
            setUser(data.user);
            await fetchCategories();
            return { success: true };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: '로그인 처리 중 오류가 발생했습니다.' };
        }
    };

    const logout = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(AUTH_KEY);
        }
        setIsAuthenticated(false);
        setUser(null);
    };

    const hasPermission = (category: string): boolean => {
        if (!user) return false;
        if (user.isSuper) return true;
        return user.permissions?.includes(category) || false;
    };

    const getAllowedCategories = (): Category[] => {
        if (!user) return [];
        if (user.isSuper) return categories; // 모든 카테고리
        return categories.filter(cat => user.permissions?.includes(cat.value));
    };

    const refreshCategories = async () => {
        await fetchCategories();
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, login, logout, isLoading, hasPermission, getAllowedCategories, categories, refreshCategories }}>
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
