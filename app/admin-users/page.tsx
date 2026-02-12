'use client';

import { useState, useEffect } from 'react';
import { AdminUser } from '../types/admin-user';
import { useAuth } from '../contexts/AuthContext';

export default function AdminUsersPage() {
    const { user, categories } = useAuth();
    const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        name: '',
        permissions: [] as string[],
        isSuper: false,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchAdminUsers();
    }, []);

    const fetchAdminUsers = async () => {
        try {
            const res = await fetch('/api/admin-users');
            const data = await res.json();
            setAdminUsers(data);
        } catch (error) {
            console.error('Failed to fetch admin users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingUser(null);
        setFormData({
            username: '',
            password: '',
            name: '',
            permissions: [],
            isSuper: false,
        });
        setError('');
        setShowModal(true);
    };

    const handleEdit = (adminUser: AdminUser) => {
        setEditingUser(adminUser);
        setFormData({
            username: adminUser.username,
            password: '',
            name: adminUser.name || '',
            permissions: adminUser.permissions || [],
            isSuper: adminUser.isSuper,
        });
        setError('');
        setShowModal(true);
    };

    const handleDeleteClick = (adminUser: AdminUser) => {
        setDeletingUser(adminUser);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingUser) return;

        try {
            const res = await fetch(`/api/admin-users/${deletingUser.id}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json();
                alert(data.error || '삭제에 실패했습니다.');
                return;
            }
            await fetchAdminUsers();
        } catch (error) {
            console.error('Failed to delete admin user:', error);
        } finally {
            setShowDeleteModal(false);
            setDeletingUser(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            const url = editingUser
                ? `/api/admin-users/${editingUser.id}`
                : '/api/admin-users';
            const method = editingUser ? 'PUT' : 'POST';

            const submitData = {
                ...formData,
                password: formData.password || undefined,
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submitData),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || '저장에 실패했습니다.');
                return;
            }

            await fetchAdminUsers();
            setShowModal(false);
        } catch (error) {
            console.error('Failed to save admin user:', error);
            setError('저장 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePermissionToggle = (permission: string) => {
        setFormData((prev) => ({
            ...prev,
            permissions: prev.permissions.includes(permission)
                ? prev.permissions.filter((p) => p !== permission)
                : [...prev.permissions, permission],
        }));
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        try {
            return new Date(dateStr).toLocaleString('ko-KR');
        } catch {
            return dateStr;
        }
    };

    // 슈퍼 관리자만 이 페이지에 접근 가능
    if (!user?.isSuper) {
        return (
            <div className="card">
                <div className="card-body">
                    <div className="empty-state">
                        <div className="empty-state-icon">🔒</div>
                        <h3>접근 권한이 없습니다</h3>
                        <p>관리자 관리는 슈퍼 관리자만 접근할 수 있습니다.</p>
                    </div>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="loading-container" style={{ minHeight: '400px' }}>
                <div className="loading-spinner"></div>
                <p>로딩 중...</p>
            </div>
        );
    }

    return (
        <div>
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">관리자 목록</h2>
                    <button className="btn btn-primary" onClick={handleAdd}>
                        + 새 관리자 추가
                    </button>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                    {adminUsers.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">👤</div>
                            <h3>등록된 관리자가 없습니다</h3>
                            <p>새 관리자를 추가하여 시작하세요.</p>
                            <button className="btn btn-primary" onClick={handleAdd}>
                                + 새 관리자 추가
                            </button>
                        </div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>아이디</th>
                                    <th>이름</th>
                                    <th>권한</th>
                                    <th>슈퍼 관리자</th>
                                    <th>생성일</th>
                                    <th style={{ width: '120px' }}>관리</th>
                                </tr>
                            </thead>
                            <tbody>
                                {adminUsers.map((adminUser) => (
                                    <tr key={adminUser.id}>
                                        <td style={{ fontWeight: 500 }}>{adminUser.username}</td>
                                        <td>{adminUser.name || '-'}</td>
                                        <td>
                                            {adminUser.isSuper ? (
                                                <span className="badge badge-primary">전체 권한</span>
                                            ) : adminUser.permissions && adminUser.permissions.length > 0 ? (
                                                <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                                                    {adminUser.permissions.map((p) => {
                                                        const category = categories.find((c) => c.value === p);
                                                        return (
                                                            <span key={p} className="badge badge-success">
                                                                {category?.label || p}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <span style={{ color: '#94a3b8' }}>권한 없음</span>
                                            )}
                                        </td>
                                        <td>
                                            {adminUser.isSuper ? (
                                                <span style={{ color: '#22c55e' }}>예</span>
                                            ) : (
                                                <span style={{ color: '#94a3b8' }}>아니오</span>
                                            )}
                                        </td>
                                        <td style={{ fontSize: '0.8125rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                                            {formatDate(adminUser.createdAt)}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    className="btn btn-secondary"
                                                    style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
                                                    onClick={() => handleEdit(adminUser)}
                                                >
                                                    수정
                                                </button>
                                                <button
                                                    className="btn btn-danger"
                                                    style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
                                                    onClick={() => handleDeleteClick(adminUser)}
                                                    disabled={adminUser.id === user?.id}
                                                >
                                                    삭제
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" style={{ minWidth: '450px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingUser ? '관리자 수정' : '새 관리자 추가'}</h3>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label htmlFor="username" className="form-label">아이디 *</label>
                                    <input
                                        type="text"
                                        id="username"
                                        className="form-input"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        placeholder="아이디를 입력하세요"
                                        required
                                        disabled={!!editingUser}
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="password" className="form-label">
                                        비밀번호 {editingUser ? '(변경시에만 입력)' : '*'}
                                    </label>
                                    <input
                                        type="password"
                                        id="password"
                                        className="form-input"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="비밀번호를 입력하세요"
                                        required={!editingUser}
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="name" className="form-label">이름</label>
                                    <input
                                        type="text"
                                        id="name"
                                        className="form-input"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="이름을 입력하세요 (선택)"
                                    />
                                </div>
                                <div className="form-group">
                                    <label
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            cursor: 'pointer',
                                            padding: '0.75rem',
                                            borderRadius: '8px',
                                            backgroundColor: formData.isSuper ? '#fef3c7' : '#f8fafc',
                                            border: `2px solid ${formData.isSuper ? '#f59e0b' : '#e2e8f0'}`,
                                            fontWeight: 500,
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={formData.isSuper}
                                            onChange={(e) => setFormData({ ...formData, isSuper: e.target.checked })}
                                            style={{
                                                width: '20px',
                                                height: '20px',
                                                marginRight: '0.75rem',
                                                accentColor: '#f59e0b',
                                                cursor: 'pointer',
                                            }}
                                        />
                                        <span style={{ color: formData.isSuper ? '#92400e' : '#334155' }}>
                                            슈퍼 관리자 (모든 권한)
                                        </span>
                                    </label>
                                </div>
                                {!formData.isSuper && (
                                    <div className="form-group">
                                        <label className="form-label" style={{ marginBottom: '0.75rem', fontWeight: 600 }}>카테고리 권한</label>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {categories.map((category) => (
                                                <label
                                                    key={category.value}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        cursor: 'pointer',
                                                        padding: '0.75rem',
                                                        borderRadius: '8px',
                                                        backgroundColor: formData.permissions.includes(category.value) ? '#dcfce7' : '#f8fafc',
                                                        border: `2px solid ${formData.permissions.includes(category.value) ? '#22c55e' : '#e2e8f0'}`,
                                                        transition: 'all 0.2s ease',
                                                    }}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.permissions.includes(category.value)}
                                                        onChange={() => handlePermissionToggle(category.value)}
                                                        style={{
                                                            width: '20px',
                                                            height: '20px',
                                                            marginRight: '0.75rem',
                                                            accentColor: '#22c55e',
                                                            cursor: 'pointer',
                                                        }}
                                                    />
                                                    <span style={{
                                                        fontWeight: formData.permissions.includes(category.value) ? 600 : 400,
                                                        color: formData.permissions.includes(category.value) ? '#166534' : '#334155',
                                                    }}>
                                                        {category.label}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {error && (
                                    <div style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                                        {error}
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    취소
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? '저장 중...' : '저장'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirm Modal */}
            {showDeleteModal && (
                <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>삭제 확인</h3>
                        </div>
                        <div className="modal-body">
                            <p>&quot;{deletingUser?.username}&quot; 관리자를 삭제하시겠습니까?</p>
                            <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                                이 작업은 되돌릴 수 없습니다.
                            </p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                                취소
                            </button>
                            <button className="btn btn-danger" onClick={handleDeleteConfirm}>
                                삭제
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
