'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface Category {
    id: string;
    value: string;
    label: string;
    sortOrder: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export default function CategoriesPage() {
    const { user } = useAuth();
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState({
        value: '',
        label: '',
        sortOrder: 0,
        isActive: true,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
    const [error, setError] = useState('');

    // 슈퍼 관리자만 이 페이지에 접근 가능
    if (!user?.isSuper) {
        return (
            <div className="card">
                <div className="card-body">
                    <div className="empty-state">
                        <div className="empty-state-icon">🔒</div>
                        <h3>접근 권한이 없습니다</h3>
                        <p>카테고리 관리는 슈퍼 관리자만 접근할 수 있습니다.</p>
                    </div>
                </div>
            </div>
        );
    }

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/categories');
            const data = await res.json();
            setCategories(data);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingCategory(null);
        setFormData({
            value: '',
            label: '',
            sortOrder: categories.length,
            isActive: true,
        });
        setError('');
        setShowModal(true);
    };

    const handleEdit = (category: Category) => {
        setEditingCategory(category);
        setFormData({
            value: category.value,
            label: category.label,
            sortOrder: category.sortOrder,
            isActive: category.isActive,
        });
        setError('');
        setShowModal(true);
    };

    const handleDeleteClick = (category: Category) => {
        setDeletingCategory(category);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingCategory) return;

        try {
            const res = await fetch(`/api/categories/${deletingCategory.id}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json();
                alert(data.error || '삭제에 실패했습니다.');
                return;
            }
            await fetchCategories();
        } catch (error) {
            console.error('Failed to delete category:', error);
        } finally {
            setShowDeleteModal(false);
            setDeletingCategory(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            const url = editingCategory
                ? `/api/categories/${editingCategory.id}`
                : '/api/categories';
            const method = editingCategory ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || '저장에 실패했습니다.');
                return;
            }

            await fetchCategories();
            setShowModal(false);
        } catch (error) {
            console.error('Failed to save category:', error);
            setError('저장 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        try {
            return new Date(dateStr).toLocaleString('ko-KR');
        } catch {
            return dateStr;
        }
    };

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
                    <h2 className="card-title">📁 카테고리 관리</h2>
                    <button className="btn btn-primary" onClick={handleAdd}>
                        + 새 카테고리 추가
                    </button>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                    {categories.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">📁</div>
                            <h3>등록된 카테고리가 없습니다</h3>
                            <p>새 카테고리를 추가하여 시작하세요.</p>
                            <button className="btn btn-primary" onClick={handleAdd}>
                                + 새 카테고리 추가
                            </button>
                        </div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '60px' }}>순서</th>
                                    <th>값 (value)</th>
                                    <th>표시 이름 (label)</th>
                                    <th>상태</th>
                                    <th>생성일</th>
                                    <th style={{ width: '120px' }}>관리</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.map((category) => (
                                    <tr key={category.id}>
                                        <td style={{ textAlign: 'center', fontWeight: 600, color: '#64748b' }}>
                                            {category.sortOrder}
                                        </td>
                                        <td>
                                            <code style={{
                                                padding: '0.25rem 0.5rem',
                                                backgroundColor: '#1e293b',
                                                color: '#22d3ee',
                                                borderRadius: '4px',
                                                fontSize: '0.8125rem',
                                                fontWeight: 600,
                                            }}>
                                                {category.value}
                                            </code>
                                        </td>
                                        <td style={{ fontWeight: 500 }}>{category.label}</td>
                                        <td>
                                            {category.isActive ? (
                                                <span style={{
                                                    padding: '0.25rem 0.5rem',
                                                    backgroundColor: '#dcfce7',
                                                    color: '#166534',
                                                    borderRadius: '4px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                }}>
                                                    활성
                                                </span>
                                            ) : (
                                                <span style={{
                                                    padding: '0.25rem 0.5rem',
                                                    backgroundColor: '#fee2e2',
                                                    color: '#991b1b',
                                                    borderRadius: '4px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                }}>
                                                    비활성
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ fontSize: '0.8125rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                                            {formatDate(category.createdAt)}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    className="btn btn-secondary"
                                                    style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
                                                    onClick={() => handleEdit(category)}
                                                >
                                                    수정
                                                </button>
                                                <button
                                                    className="btn btn-danger"
                                                    style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
                                                    onClick={() => handleDeleteClick(category)}
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
                    <div className="modal-content" style={{ minWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingCategory ? '카테고리 수정' : '새 카테고리 추가'}</h3>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label htmlFor="value" className="form-label">값 (value) *</label>
                                    <input
                                        type="text"
                                        id="value"
                                        className="form-input"
                                        value={formData.value}
                                        onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                        placeholder="예: tesla, baby"
                                        required
                                    />
                                    <small style={{ color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
                                        시스템에서 사용하는 고유 식별자입니다. 영문 소문자로 입력하세요.
                                    </small>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="label" className="form-label">표시 이름 (label) *</label>
                                    <input
                                        type="text"
                                        id="label"
                                        className="form-input"
                                        value={formData.label}
                                        onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                                        placeholder="예: 테슬라, 육아"
                                        required
                                    />
                                    <small style={{ color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
                                        사용자에게 표시되는 이름입니다.
                                    </small>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="sortOrder" className="form-label">정렬 순서</label>
                                    <input
                                        type="number"
                                        id="sortOrder"
                                        className="form-input"
                                        value={formData.sortOrder}
                                        onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                                        min="0"
                                    />
                                    <small style={{ color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
                                        숫자가 작을수록 먼저 표시됩니다.
                                    </small>
                                </div>
                                <div className="form-group">
                                    <label
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            cursor: 'pointer',
                                            padding: '0.75rem',
                                            borderRadius: '8px',
                                            backgroundColor: formData.isActive ? '#dcfce7' : '#fee2e2',
                                            border: `2px solid ${formData.isActive ? '#22c55e' : '#ef4444'}`,
                                            fontWeight: 500,
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={formData.isActive}
                                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                            style={{
                                                width: '20px',
                                                height: '20px',
                                                marginRight: '0.75rem',
                                                accentColor: '#22c55e',
                                                cursor: 'pointer',
                                            }}
                                        />
                                        <span style={{ color: formData.isActive ? '#166534' : '#991b1b' }}>
                                            {formData.isActive ? '활성 상태' : '비활성 상태'}
                                        </span>
                                    </label>
                                </div>

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
                            <p>&quot;{deletingCategory?.label}&quot; 카테고리를 삭제하시겠습니까?</p>
                            <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                                삭제된 카테고리는 비활성 상태로 변경됩니다.
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
