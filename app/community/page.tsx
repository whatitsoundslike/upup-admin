'use client';

import { useState, useEffect, useMemo } from 'react';
import { CommunityPost } from '../types/community';
import { useAuth } from '../contexts/AuthContext';

const SOURCE_BADGES: Record<string, { label: string; color: string }> = {
  dcinside: { label: 'DC', color: '#3B4890' },
  fmkorea: { label: '에펨', color: '#3578E5' },
  clien: { label: '클리앙', color: '#4BAE4F' },
  ppomppu: { label: '뽐뿌', color: '#FF6B35' },
  ruliweb: { label: '루리웹', color: '#00A2E0' },
};

export default function CommunityPage() {
  const { getAllowedCategories, categories } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScraping, setIsScraping] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterSource, setFilterSource] = useState<string>('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingPost, setDeletingPost] = useState<CommunityPost | null>(null);
  const [scrapingCategory, setScrapingCategory] = useState<string>('');

  const allowedCategories = useMemo(() => getAllowedCategories(), [getAllowedCategories]);

  useEffect(() => {
    fetchPosts();
  }, [filterCategory, filterSource]);

  const fetchPosts = async () => {
    try {
      const params = new URLSearchParams();
      if (filterCategory) params.set('category', filterCategory);
      if (filterSource) params.set('source', filterSource);
      const url = `/api/community${params.toString() ? '?' + params.toString() : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      setPosts(data);
    } catch (error) {
      console.error('Failed to fetch community posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScrape = async (category?: string) => {
    if (isScraping) return;
    setIsScraping(true);

    try {
      const categoriesToScrape = category
        ? [category]
        : filterCategory
          ? [filterCategory]
          : allowedCategories.map((c) => c.value);

      const sourceToScrape = filterSource || 'dcinside';
      const results: string[] = [];

      for (const cat of categoriesToScrape) {
        setScrapingCategory(cat);
        const res = await fetch('/api/community/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category: cat, source: sourceToScrape }),
        });
        const data = await res.json();
        if (res.ok) {
          results.push(`${getCategoryLabel(cat)} (${sourceToScrape}): ${data.message}`);
        } else {
          results.push(`${getCategoryLabel(cat)} (${sourceToScrape}): ${data.error || '실패'}`);
        }
      }

      alert(results.join('\n'));
      await fetchPosts();
    } catch (error) {
      console.error('Scrape failed:', error);
      alert('스크래핑 중 오류가 발생했습니다.');
    } finally {
      setIsScraping(false);
      setScrapingCategory('');
    }
  };

  const handleDelete = async () => {
    if (!deletingPost) return;
    try {
      await fetch(`/api/community/${deletingPost.id}`, { method: 'DELETE' });
      await fetchPosts();
    } catch (error) {
      console.error('Failed to delete:', error);
    } finally {
      setShowDeleteModal(false);
      setDeletingPost(null);
    }
  };

  const handleToggleVerified = async (post: CommunityPost) => {
    try {
      await fetch(`/api/community/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiVerified: !post.aiVerified }),
      });
      await fetchPosts();
    } catch (error) {
      console.error('Failed to toggle verified:', error);
    }
  };

  const handleToggleActive = async (post: CommunityPost) => {
    try {
      await fetch(`/api/community/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !post.isActive }),
      });
      await fetchPosts();
    } catch (error) {
      console.error('Failed to toggle active:', error);
    }
  };

  const getCategoryLabel = (value: string) => {
    const cat = categories.find((c) => c.value === value);
    return cat ? cat.label : value;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleString('ko-KR', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const getHotScoreIcon = (score: number) => {
    if (score >= 500) return '🔥🔥🔥';
    if (score >= 200) return '🔥🔥';
    if (score >= 50) return '🔥';
    return '';
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
      {/* Filters */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.875rem', color: '#64748b', marginRight: '0.25rem' }}>카테고리:</span>
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

        <span style={{ fontSize: '0.875rem', color: '#64748b', marginLeft: '1rem', marginRight: '0.25rem' }}>출처:</span>
        <button
          className={`btn ${filterSource === '' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilterSource('')}
        >
          전체
        </button>
        {Object.entries(SOURCE_BADGES).map(([key, badge]) => (
          <button
            key={key}
            className={`btn ${filterSource === key ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterSource(key)}
          >
            {badge.label}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            커뮤니티 핫 게시물
            <span style={{ fontSize: '0.875rem', fontWeight: 400, marginLeft: '0.5rem', color: '#64748b' }}>
              ({posts.length}개)
            </span>
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-secondary"
              onClick={() => handleScrape()}
              disabled={isScraping}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {isScraping ? (
                <>
                  <span className="loading-spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></span>
                  {scrapingCategory ? `${getCategoryLabel(scrapingCategory)} 수집 중...` : '수집 중...'}
                </>
              ) : (
                `🔍 ${filterSource ? SOURCE_BADGES[filterSource]?.label : '전체'} 스크래핑`
              )}
            </button>
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {posts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🌐</div>
              <h3>수집된 게시물이 없습니다</h3>
              <p>DC인사이드 스크래핑을 실행하여 핫 게시물을 수집하세요.</p>
              <button className="btn btn-primary" onClick={() => handleScrape()}>
                🔍 스크래핑 시작
              </button>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>카테고리</th>
                  <th>출처</th>
                  <th>제목</th>
                  <th style={{ textAlign: 'center' }}>조회</th>
                  <th style={{ textAlign: 'center' }}>추천</th>
                  <th style={{ textAlign: 'center' }}>댓글</th>
                  <th style={{ textAlign: 'center' }}>핫스코어</th>
                  <th style={{ textAlign: 'center' }}>검수</th>
                  <th style={{ textAlign: 'center' }}>노출</th>
                  <th>수집일</th>
                  <th style={{ width: '80px' }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => {
                  const sourceBadge = SOURCE_BADGES[post.source] || { label: post.source, color: '#64748b' };
                  return (
                    <tr key={post.id} style={{ opacity: post.isActive ? 1 : 0.5 }}>
                      <td>
                        <span className="badge badge-success">{getCategoryLabel(post.category)}</span>
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: '#fff',
                            backgroundColor: sourceBadge.color,
                          }}
                        >
                          {sourceBadge.label}
                        </span>
                      </td>
                      <td style={{ fontWeight: 500, maxWidth: '300px' }}>
                        <a
                          href={post.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--foreground)', textDecoration: 'none' }}
                          title={post.title}
                        >
                          {post.title.length > 50 ? post.title.slice(0, 50) + '...' : post.title}
                        </a>
                      </td>
                      <td style={{ textAlign: 'center', fontSize: '0.8125rem', color: '#64748b' }}>
                        {post.views.toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'center', fontSize: '0.8125rem', color: '#22c55e' }}>
                        {post.likes}
                      </td>
                      <td style={{ textAlign: 'center', fontSize: '0.8125rem', color: '#3578E5' }}>
                        💬 {post.comments}
                      </td>
                      <td style={{ textAlign: 'center', fontSize: '0.8125rem', fontWeight: 600 }}>
                        {getHotScoreIcon(post.hotScore)} {post.hotScore.toFixed(0)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => handleToggleVerified(post)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '1rem',
                          }}
                          title={post.aiVerified ? '검수 완료' : '미검수'}
                        >
                          {post.aiVerified ? '✅' : '⬜'}
                        </button>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => handleToggleActive(post)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '1rem',
                          }}
                          title={post.isActive ? '노출 중' : '숨김'}
                        >
                          {post.isActive ? '👁️' : '🚫'}
                        </button>
                      </td>
                      <td style={{ fontSize: '0.8125rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {formatDate(post.crawledAt)}
                      </td>
                      <td>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
                          onClick={() => {
                            setDeletingPost(post);
                            setShowDeleteModal(true);
                          }}
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>삭제 확인</h3>
            </div>
            <div className="modal-body">
              <p>&quot;{deletingPost?.title}&quot; 게시물을 삭제하시겠습니까?</p>
              <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                이 작업은 되돌릴 수 없습니다.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>취소</button>
              <button className="btn btn-danger" onClick={handleDelete}>삭제</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
