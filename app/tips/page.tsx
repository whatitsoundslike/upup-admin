'use client';

import { useState, useEffect } from 'react';
import { Tip, TIP_CATEGORIES } from '../types/tip';

export default function TipsPage() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTip, setEditingTip] = useState<Tip | null>(null);
  const [formData, setFormData] = useState({ title: '', summary: '', content: '', category: 'tesla', thumbnail: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingTip, setDeletingTip] = useState<Tip | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('');

  useEffect(() => {
    fetchTips();
  }, [filterCategory]);

  const fetchTips = async () => {
    try {
      const url = filterCategory ? `/api/tips?category=${filterCategory}` : '/api/tips';
      const res = await fetch(url);
      const data = await res.json();
      setTips(data);
    } catch (error) {
      console.error('Failed to fetch tips:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingTip(null);
    setFormData({ title: '', summary: '', content: '', category: 'tesla', thumbnail: '' });
    setShowModal(true);
  };

  const handleEdit = (tip: Tip) => {
    setEditingTip(tip);
    setFormData({
      title: tip.title,
      summary: tip.summary || '',
      content: tip.content,
      category: tip.category,
      thumbnail: tip.thumbnail || ''
    });
    setShowModal(true);
  };

  const handleDeleteClick = (tip: Tip) => {
    setDeletingTip(tip);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTip) return;

    try {
      await fetch(`/api/tips/${deletingTip.id}`, { method: 'DELETE' });
      await fetchTips();
    } catch (error) {
      console.error('Failed to delete tip:', error);
    } finally {
      setShowDeleteModal(false);
      setDeletingTip(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingTip) {
        await fetch(`/api/tips/${editingTip.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } else {
        await fetch('/api/tips', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }
      await fetchTips();
      setShowModal(false);
    } catch (error) {
      console.error('Failed to save tip:', error);
    } finally {
      setIsSubmitting(false);
    }
  };


  const getCategoryLabel = (value: string) => {
    const category = TIP_CATEGORIES.find(c => c.value === value);
    return category ? category.label : value;
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
      {/* Category Filter */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button
          className={`btn ${filterCategory === '' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilterCategory('')}
        >
          전체
        </button>
        {TIP_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            className={`btn ${filterCategory === cat.value ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterCategory(cat.value)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            팁 게시물 목록
            {filterCategory && (
              <span style={{ fontSize: '0.875rem', fontWeight: 400, marginLeft: '0.5rem', color: '#64748b' }}>
                ({getCategoryLabel(filterCategory)})
              </span>
            )}
          </h2>
          <button className="btn btn-primary" onClick={handleAdd}>
            + 새 팁 추가
          </button>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {tips.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">💡</div>
              <h3>등록된 팁 게시물이 없습니다</h3>
              <p>새 팁 게시물을 추가하여 시작하세요.</p>
              <button className="btn btn-primary" onClick={handleAdd}>
                + 새 팁 추가
              </button>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>카테고리</th>
                  <th>제목</th>
                  <th>요약</th>
                  <th style={{ width: '120px' }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {tips.map((tip) => (
                  <tr key={tip.id}>
                    <td style={{ color: '#64748b', fontSize: '0.8125rem' }}>{tip.id}</td>
                    <td>
                      <span className="badge badge-success">{getCategoryLabel(tip.category)}</span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{tip.title}</td>
                    <td style={{ fontSize: '0.875rem', color: '#475569' }}>{tip.summary}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
                          onClick={() => handleEdit(tip)}
                        >
                          수정
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
                          onClick={() => handleDeleteClick(tip)}
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
              <h3>{editingTip ? '팁 수정' : '새 팁 추가'}</h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="category" className="form-label">카테고리</label>
                  <select
                    id="category"
                    className="form-input"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  >
                    {TIP_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="title" className="form-label">제목</label>
                  <input
                    type="text"
                    id="title"
                    className="form-input"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="팁 제목을 입력하세요"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="summary" className="form-label">요약</label>
                  <input
                    type="text"
                    id="summary"
                    className="form-input"
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    placeholder="팁 요약을 입력하세요"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="content" className="form-label">내용</label>
                  <textarea
                    id="content"
                    className="form-input form-textarea"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="팁 내용을 입력하세요"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="thumbnail" className="form-label">썸네일 URL</label>
                  <input
                    type="text"
                    id="thumbnail"
                    className="form-input"
                    value={formData.thumbnail}
                    onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                    placeholder="썸네일 이미지 URL을 입력하세요 (선택)"
                  />
                  {formData.thumbnail && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <img
                        src={formData.thumbnail}
                        alt="썸네일 미리보기"
                        style={{ maxWidth: '200px', maxHeight: '120px', borderRadius: '4px', objectFit: 'cover' }}
                      />
                    </div>
                  )}
                </div>
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
              <p>&quot;{deletingTip?.title}&quot; 팁을 삭제하시겠습니까?</p>
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
