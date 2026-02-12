'use client';

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        const result = await login(username, password);

        if (!result.success) {
            setError(result.error || '로그인에 실패했습니다.');
            setPassword('');
        }

        setIsSubmitting(false);
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <div className="login-logo">
                        <div className="login-logo-icon">🚗</div>
                        <h1>ZROOM Admin</h1>
                    </div>
                    <p className="login-subtitle">관리자 페이지에 접속하려면 로그인하세요.</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label htmlFor="username" className="form-label">
                            아이디
                        </label>
                        <input
                            type="text"
                            id="username"
                            className="form-input"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="아이디를 입력하세요"
                            disabled={isSubmitting}
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password" className="form-label">
                            비밀번호
                        </label>
                        <input
                            type="password"
                            id="password"
                            className="form-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="비밀번호를 입력하세요"
                            disabled={isSubmitting}
                        />
                    </div>

                    {error && (
                        <div className="login-error">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary login-btn"
                        disabled={isSubmitting || !username || !password}
                    >
                        {isSubmitting ? '로그인 중...' : '로그인'}
                    </button>
                </form>

                <div className="login-footer">
                    <p>로그인은 24시간 동안 유효합니다.</p>
                </div>
            </div>
        </div>
    );
}
