'use client';

import { useState, useEffect } from 'react';
import { Member } from '../types/member';
import { useAuth } from '../contexts/AuthContext';

export default function MembersPage() {
    const { user } = useAuth();
    const [members, setMembers] = useState<Member[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // 슈퍼관리자 권한 체크
    if (!user?.isSuper) {
        return (
            <div className="card">
                <div className="card-body">
                    <div className="empty-state">
                        <div className="empty-state-icon">🔒</div>
                        <h3>접근 권한이 없습니다</h3>
                        <p>회원 관리는 슈퍼 관리자만 접근할 수 있습니다.</p>
                    </div>
                </div>
            </div>
        );
    }
    const [showModal, setShowModal] = useState(false);
    const [editingMember, setEditingMember] = useState<Member | null>(null);
    const [formData, setFormData] = useState({
        uid: '',
        name: '',
        email: '',
        password: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingMember, setDeletingMember] = useState<Member | null>(null);

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        try {
            const res = await fetch('/api/members');
            const data = await res.json();
            setMembers(data);
        } catch (error) {
            console.error('Failed to fetch members:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingMember(null);
        setFormData({
            uid: '',
            name: '',
            email: '',
            password: '',
        });
        setShowModal(true);
    };

    const handleEdit = (member: Member) => {
        setEditingMember(member);
        setFormData({
            uid: member.uid,
            name: member.name || '',
            email: member.email || '',
            password: '', // Not used in edit mode
        });
        setShowModal(true);
    };

    const handleDeleteClick = (member: Member) => {
        setDeletingMember(member);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingMember) return;

        try {
            await fetch(`/api/members/${deletingMember.id}`, { method: 'DELETE' });
            await fetchMembers();
        } catch (error) {
            console.error('Failed to delete member:', error);
        } finally {
            setShowDeleteModal(false);
            setDeletingMember(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (editingMember) {
                await fetch(`/api/members/${editingMember.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                });
            } else {
                await fetch('/api/members', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                });
            }
            await fetchMembers();
            setShowModal(false);
        } catch (error) {
            console.error('Failed to save member:', error);
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
                    <h2 className="card-title">회원 목록</h2>
                    <button className="btn btn-primary" onClick={handleAdd}>
                        + 새 회원 추가
                    </button>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                    {members.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">👥</div>
                            <h3>등록된 회원이 없습니다</h3>
                            <p>새 회원을 추가하여 시작하세요.</p>
                            <button className="btn btn-primary" onClick={handleAdd}>
                                + 새 회원 추가
                            </button>
                        </div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>UID</th>
                                    <th>이름</th>
                                    <th>이메일</th>
                                    <th>생성일</th>
                                    <th>수정일</th>
                                    <th style={{ width: '120px' }}>관리</th>
                                </tr>
                            </thead>
                            <tbody>
                                {members.map((member) => (
                                    <tr key={member.id}>
                                        <td style={{ fontSize: '0.875rem', color: '#64748b' }}>{member.id}</td>
                                        <td style={{ fontWeight: 500 }}>{member.uid}</td>
                                        <td>{member.name || '-'}</td>
                                        <td style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                            {member.email || '-'}
                                        </td>
                                        <td style={{ fontSize: '0.8125rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                                            {formatDate(member.createdAt)}
                                        </td>
                                        <td style={{ fontSize: '0.8125rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                                            {formatDate(member.updatedAt)}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    className="btn btn-secondary"
                                                    style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
                                                    onClick={() => handleEdit(member)}
                                                >
                                                    수정
                                                </button>
                                                <button
                                                    className="btn btn-danger"
                                                    style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
                                                    onClick={() => handleDeleteClick(member)}
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
                    <div className="modal-content" style={{ minWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingMember ? '회원 수정' : '새 회원 추가'}</h3>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label htmlFor="uid" className="form-label">UID (필수)</label>
                                    <input
                                        type="text"
                                        id="uid"
                                        className="form-input"
                                        value={formData.uid}
                                        onChange={(e) => setFormData({ ...formData, uid: e.target.value })}
                                        placeholder="고유 사용자 ID를 입력하세요"
                                        disabled={!!editingMember}
                                        required
                                        style={editingMember ? { backgroundColor: '#f1f5f9', cursor: 'not-allowed' } : {}}
                                    />
                                    {editingMember && (
                                        <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                                            UID는 수정할 수 없습니다.
                                        </p>
                                    )}
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
                                    <label htmlFor="email" className="form-label">이메일</label>
                                    <input
                                        type="email"
                                        id="email"
                                        className="form-input"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="이메일을 입력하세요 (선택)"
                                    />
                                </div>
                                {!editingMember && (
                                    <div className="form-group">
                                        <label htmlFor="password" className="form-label">비밀번호 (필수)</label>
                                        <input
                                            type="password"
                                            id="password"
                                            className="form-input"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            placeholder="비밀번호를 입력하세요"
                                            required
                                        />
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
                            <p>&quot;{deletingMember?.uid}&quot; 회원을 삭제하시겠습니까?</p>
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
