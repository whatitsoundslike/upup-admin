'use client';

import { useState, useEffect } from 'react';
import { Inquiry, INQUIRY_STATUSES } from '../types/inquiry';

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');

  // 답변 모달
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 상세 보기 모달
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailInquiry, setDetailInquiry] = useState<Inquiry | null>(null);

  // 삭제 모달
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingInquiry, setDeletingInquiry] = useState<Inquiry | null>(null);

  useEffect(() => {
    fetchInquiries();
  }, [filterStatus]);

  const fetchInquiries = async () => {
    try {
      const url = filterStatus ? `/api/inquiries?status=${filterStatus}` : '/api/inquiries';
      const res = await fetch(url);
      const data = await res.json();
      setInquiries(data);
    } catch (error) {
      console.error('Failed to fetch inquiries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetail = (inquiry: Inquiry) => {
    setDetailInquiry(inquiry);
    setShowDetailModal(true);
  };

  const handleAnswerClick = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setAnswerText(inquiry.answer || '');
    setShowAnswerModal(true);
  };

  const handleAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInquiry) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/inquiries/${selectedInquiry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answer: answerText,
          status: 'answered',
        }),
      });

      if (res.ok) {
        await fetchInquiries();
        setShowAnswerModal(false);
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (inquiry: Inquiry) => {
    setDeletingInquiry(inquiry);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingInquiry) return;

    try {
      await fetch(`/api/inquiries/${deletingInquiry.id}`, { method: 'DELETE' });
      await fetchInquiries();
    } catch (error) {
      console.error('Failed to delete inquiry:', error);
    } finally {
      setShowDeleteModal(false);
      setDeletingInquiry(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const found = INQUIRY_STATUSES.find((s) => s.value === status);
    if (!found) return <span className="badge">{status}</span>;
    return <span className={`badge ${found.badgeClass}`}>{found.label}</span>;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleString('ko-KR');
    } catch {
      return dateStr;
    }
  };

  const pendingCount = inquiries.filter((i) => i.status === 'pending').length;

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
      {/* Status Filter */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button
          className={`btn ${filterStatus === '' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilterStatus('')}
        >
          전체 ({inquiries.length})
        </button>
        {INQUIRY_STATUSES.map((s) => (
          <button
            key={s.value}
            className={`btn ${filterStatus === s.value ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterStatus(s.value)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            고객 문의 목록
            {pendingCount > 0 && (
              <span style={{ fontSize: '0.875rem', fontWeight: 400, marginLeft: '0.5rem', color: '#ef4444' }}>
                (미답변 {pendingCount}건)
              </span>
            )}
          </h2>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {inquiries.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">💬</div>
              <h3>등록된 문의가 없습니다</h3>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>상태</th>
                  <th>제목</th>
                  <th>작성자</th>
                  <th>작성일</th>
                  <th style={{ width: '180px' }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {inquiries.map((inquiry) => (
                  <tr key={inquiry.id}>
                    <td>{getStatusBadge(inquiry.status)}</td>
                    <td
                      style={{ fontWeight: 500, cursor: 'pointer' }}
                      onClick={() => handleViewDetail(inquiry)}
                    >
                      {inquiry.title}
                    </td>
                    <td style={{ fontSize: '0.875rem', color: '#64748b' }}>
                      {inquiry.memberName}
                      {inquiry.memberEmail !== '-' && (
                        <span style={{ display: 'block', fontSize: '0.75rem' }}>{inquiry.memberEmail}</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {formatDate(inquiry.createdAt)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
                          onClick={() => handleViewDetail(inquiry)}
                        >
                          보기
                        </button>
                        <button
                          className="btn btn-primary"
                          style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
                          onClick={() => handleAnswerClick(inquiry)}
                        >
                          {inquiry.answer ? '답변수정' : '답변'}
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
                          onClick={() => handleDeleteClick(inquiry)}
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

      {/* Detail Modal */}
      {showDetailModal && detailInquiry && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" style={{ minWidth: '560px', maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>문의 상세</h3>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  {getStatusBadge(detailInquiry.status)}
                  <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                    {formatDate(detailInquiry.createdAt)}
                  </span>
                </div>
                <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>
                  작성자: {detailInquiry.memberName} ({detailInquiry.memberEmail})
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ fontWeight: 600 }}>제목</label>
                <div style={{ padding: '0.75rem', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                  {detailInquiry.title}
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ fontWeight: 600 }}>문의 내용</label>
                <div style={{ padding: '0.75rem', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', whiteSpace: 'pre-wrap', minHeight: '80px' }}>
                  {detailInquiry.content}
                </div>
              </div>

              {detailInquiry.answer && (
                <div>
                  <label className="form-label" style={{ fontWeight: 600, color: '#22c55e' }}>답변</label>
                  <div style={{ padding: '0.75rem', background: 'var(--card-bg)', border: '1px solid #22c55e40', borderRadius: '8px', whiteSpace: 'pre-wrap', minHeight: '60px' }}>
                    {detailInquiry.answer}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>
                닫기
              </button>
              <button className="btn btn-primary" onClick={() => {
                setShowDetailModal(false);
                handleAnswerClick(detailInquiry);
              }}>
                {detailInquiry.answer ? '답변 수정' : '답변 작성'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Answer Modal */}
      {showAnswerModal && selectedInquiry && (
        <div className="modal-overlay" onClick={() => setShowAnswerModal(false)}>
          <div className="modal-content" style={{ minWidth: '560px', maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedInquiry.answer ? '답변 수정' : '답변 작성'}</h3>
            </div>
            <form onSubmit={handleAnswerSubmit}>
              <div className="modal-body">
                <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{selectedInquiry.title}</div>
                  <div style={{ fontSize: '0.875rem', color: '#64748b', whiteSpace: 'pre-wrap' }}>{selectedInquiry.content}</div>
                </div>

                <div className="form-group">
                  <label htmlFor="answer" className="form-label">답변 내용</label>
                  <textarea
                    id="answer"
                    className="form-input form-textarea"
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    placeholder="답변을 입력하세요"
                    required
                    style={{ minHeight: '150px' }}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAnswerModal(false)}>
                  취소
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? '저장 중...' : '답변 저장'}
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
              <p>&quot;{deletingInquiry?.title}&quot; 문의를 삭제하시겠습니까?</p>
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
