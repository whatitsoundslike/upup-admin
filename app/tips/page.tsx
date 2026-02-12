'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Tip } from '../types/tip';
import { useAuth } from '../contexts/AuthContext';
import 'react-quill-new/dist/quill.snow.css';

// React Quill을 SSR 없이 동적 import
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

export default function TipsPage() {
  const { hasPermission, getAllowedCategories, categories } = useAuth();
  const [tips, setTips] = useState<Tip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTip, setEditingTip] = useState<Tip | null>(null);
  const [formData, setFormData] = useState({ title: '', summary: '', content: '', category: '', thumbnail: '', keyword: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingTip, setDeletingTip] = useState<Tip | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('');

  // 권한이 있는 카테고리만 필터링
  const allowedCategories = useMemo(() => {
    return getAllowedCategories();
  }, [getAllowedCategories]);

  // 권한이 있는 팁만 필터링
  const filteredTips = useMemo(() => {
    return tips.filter((tip) => hasPermission(tip.category));
  }, [tips, hasPermission]);

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
    setFormData({
      title: '',
      summary: '',
      content: '',
      category: filterCategory || allowedCategories[0]?.value || 'tesla',
      thumbnail: '',
      keyword: ''
    });
    setShowModal(true);
  };

  const handleEdit = (tip: Tip) => {
    setEditingTip(tip);
    setFormData({
      title: tip.title,
      summary: tip.summary || '',
      content: tip.content,
      category: tip.category,
      thumbnail: tip.thumbnail || '',
      keyword: tip.keyword ? tip.keyword.join(', ') : ''
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

    // keyword 문자열을 배열로 변환
    const keywordArray = formData.keyword
      ? formData.keyword.split(',').map(k => k.trim()).filter(k => k)
      : null;

    const submitData = {
      ...formData,
      keyword: keywordArray,
    };

    try {
      if (editingTip) {
        await fetch(`/api/tips/${editingTip.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData),
        });
      } else {
        await fetch('/api/tips', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData),
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
    const category = categories.find(c => c.value === value);
    return category ? category.label : value;
  };

  // 권한이 없는 경우
  if (allowedCategories.length === 0) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="empty-state">
            <div className="empty-state-icon">🔒</div>
            <h3>접근 권한이 없습니다</h3>
            <p>팁 게시물 관리에 대한 카테고리 권한이 없습니다.</p>
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
      {/* Category Filter */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button
          className={`btn ${filterCategory === '' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilterCategory('')}
        >
          전체
        </button>
        {allowedCategories.map((cat) => (
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
          {filteredTips.length === 0 ? (
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
                {filteredTips.map((tip) => (
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
          <div className="modal-content" style={{ width: '90%', maxWidth: '900px', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
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
                    {allowedCategories.map((cat) => (
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <label htmlFor="content" className="form-label" style={{ margin: 0 }}>내용 (HTML)</label>
                    <label
                      style={{
                        padding: '0.375rem 0.75rem',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      📄 HTML 파일 가져오기
                      <input
                        type="file"
                        accept=".html,.htm"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const html = event.target?.result as string;
                              // body 태그 내용 추출
                              const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
                              if (bodyMatch) {
                                setFormData({ ...formData, content: bodyMatch[1].trim() });
                              } else {
                                // body 태그가 없으면 전체 내용 사용
                                setFormData({ ...formData, content: html });
                              }
                            };
                            reader.readAsText(file, 'UTF-8');
                          }
                          e.target.value = ''; // 같은 파일 다시 선택 가능하도록
                        }}
                      />
                    </label>
                  </div>
                  <div style={{
                    minHeight: '400px',
                    marginBottom: '1rem',
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <ReactQuill
                      theme="snow"
                      value={formData.content}
                      onChange={(value: string) => setFormData({ ...formData, content: value })}
                      style={{
                        height: '350px',
                        marginBottom: '50px',
                        color: '#1e293b'
                      }}
                      modules={{
                        toolbar: [
                          [{ 'header': [1, 2, 3, false] }],
                          ['bold', 'italic', 'underline', 'strike'],
                          [{ 'color': [] }, { 'background': [] }],
                          [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                          ['blockquote', 'code-block'],
                          ['link', 'image'],
                          ['clean']
                        ]
                      }}
                      placeholder="팁 내용을 입력하세요..."
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="keyword" className="form-label">키워드</label>
                  <input
                    type="text"
                    id="keyword"
                    className="form-input"
                    value={formData.keyword}
                    onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                    placeholder="키워드를 쉼표로 구분하여 입력하세요 (예: 테슬라, 모델Y, 충전)"
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
