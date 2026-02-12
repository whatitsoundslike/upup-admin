'use client';

import { useState, useEffect, useMemo } from 'react';
import { News } from '../types/news';
import { useAuth } from '../contexts/AuthContext';

export default function NewsPage() {
  const { hasPermission, getAllowedCategories, categories } = useAuth();
  const [newsList, setNewsList] = useState<News[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [formData, setFormData] = useState({
    category: '',
    source: '',
    title: '',
    link: '',
    thumbnail: '',
    description: '',
    published_at: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingNews, setDeletingNews] = useState<News | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('');

  // 권한이 있는 카테고리만 필터링
  const allowedCategories = useMemo(() => {
    return getAllowedCategories();
  }, [getAllowedCategories]);

  // 권한이 있는 뉴스만 필터링
  const filteredNewsList = useMemo(() => {
    return newsList.filter((news) => hasPermission(news.category));
  }, [newsList, hasPermission]);

  useEffect(() => {
    fetchNews();
  }, [filterCategory]);

  const fetchNews = async () => {
    try {
      const url = filterCategory ? `/api/news?category=${filterCategory}` : '/api/news';
      const res = await fetch(url);
      const data = await res.json();
      setNewsList(data);
    } catch (error) {
      console.error('Failed to fetch news:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingNews(null);
    setFormData({
      category: filterCategory || allowedCategories[0]?.value || 'tesla',
      source: '',
      title: '',
      link: '',
      thumbnail: '',
      description: '',
      published_at: '',
    });
    setShowModal(true);
  };

  const handleEdit = (news: News) => {
    setEditingNews(news);
    setFormData({
      category: news.category,
      source: news.source,
      title: news.title,
      link: news.link,
      thumbnail: news.thumbnail,
      description: news.description,
      published_at: news.published_at,
    });
    setShowModal(true);
  };

  const handleDeleteClick = (news: News) => {
    setDeletingNews(news);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingNews) return;

    try {
      await fetch(`/api/news/${deletingNews.id}`, { method: 'DELETE' });
      await fetchNews();
    } catch (error) {
      console.error('Failed to delete news:', error);
    } finally {
      setShowDeleteModal(false);
      setDeletingNews(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingNews) {
        await fetch(`/api/news/${editingNews.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } else {
        await fetch('/api/news', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }
      await fetchNews();
      setShowModal(false);
    } catch (error) {
      console.error('Failed to save news:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryLabel = (value: string) => {
    const category = categories.find(c => c.value === value);
    return category ? category.label : value;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleString('ko-KR');
    } catch {
      return dateStr;
    }
  };

  // 권한이 없는 경우
  if (allowedCategories.length === 0) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="empty-state">
            <div className="empty-state-icon">🔒</div>
            <h3>접근 권한이 없습니다</h3>
            <p>뉴스 관리에 대한 카테고리 권한이 없습니다.</p>
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
            뉴스 목록
            {filterCategory && (
              <span style={{ fontSize: '0.875rem', fontWeight: 400, marginLeft: '0.5rem', color: '#64748b' }}>
                ({getCategoryLabel(filterCategory)})
              </span>
            )}
          </h2>
          <button className="btn btn-primary" onClick={handleAdd}>
            + 새 뉴스 추가
          </button>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {filteredNewsList.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📰</div>
              <h3>등록된 뉴스가 없습니다</h3>
              <p>새 뉴스를 추가하여 시작하세요.</p>
              <button className="btn btn-primary" onClick={handleAdd}>
                + 새 뉴스 추가
              </button>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>카테고리</th>
                  <th>출처</th>
                  <th>제목</th>
                  <th>발행일</th>
                  <th style={{ width: '120px' }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {filteredNewsList.map((news) => (
                  <tr key={news.id}>
                    <td>
                      <span className="badge badge-success">{getCategoryLabel(news.category)}</span>
                    </td>
                    <td style={{ fontSize: '0.875rem', color: '#64748b' }}>{news.source}</td>
                    <td style={{ fontWeight: 500 }}>
                      {news.link ? (
                        <a href={news.link} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'none' }}>
                          {news.title}
                        </a>
                      ) : (
                        news.title
                      )}
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {formatDate(news.published_at)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
                          onClick={() => handleEdit(news)}
                        >
                          수정
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
                          onClick={() => handleDeleteClick(news)}
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
              <h3>{editingNews ? '뉴스 수정' : '새 뉴스 추가'}</h3>
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
                  <label htmlFor="source" className="form-label">출처</label>
                  <input
                    type="text"
                    id="source"
                    className="form-input"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    placeholder="출처를 입력하세요 (예: 조선일보)"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="title" className="form-label">제목</label>
                  <input
                    type="text"
                    id="title"
                    className="form-input"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="뉴스 제목을 입력하세요"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="link" className="form-label">링크</label>
                  <input
                    type="text"
                    id="link"
                    className="form-input"
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    placeholder="뉴스 링크 URL"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="description" className="form-label">설명</label>
                  <textarea
                    id="description"
                    className="form-input form-textarea"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="뉴스 설명을 입력하세요"
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
                    placeholder="썸네일 이미지 URL (선택)"
                  />
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
              <p>&quot;{deletingNews?.title}&quot; 뉴스를 삭제하시겠습니까?</p>
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
