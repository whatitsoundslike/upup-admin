'use client';

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        // 약간의 딜레이 추가 (브루트포스 방지)
        await new Promise(resolve => setTimeout(resolve, 500));

        const success = login(password);

        if (!success) {
            setError('비밀번호가 올바르지 않습니다.');
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
                    <p className="login-subtitle">관리자 페이지에 접속하려면 비밀번호를 입력하세요.</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label htmlFor="password" className="form-label">
                            관리자 비밀번호
                        </label>
                        <input
                            type="password"
                            id="password"
                            className="form-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="비밀번호를 입력하세요"
                            disabled={isSubmitting}
                            autoFocus
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
                        disabled={isSubmitting || !password}
                    >
                        {isSubmitting ? '확인 중...' : '로그인'}
                    </button>
                </form>

                <div className="login-footer">
                    <p>로그인은 24시간 동안 유효합니다.</p>
                </div>
            </div>
        </div>
    );
}
