'use client';

import { useState, useEffect } from 'react';
import { Product, PRODUCT_CATEGORIES } from '../types/product';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('');

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    price: '',
    thumbnail: '',
    deliverType: '',
    link: '',
    order: '0',
    category: 'tesla',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [filterCategory]);

  const fetchProducts = async () => {
    try {
      const url = filterCategory ? `/api/products?category=${filterCategory}` : '/api/products';
      const res = await fetch(url);
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setFormData({
      id: '',
      name: '',
      price: '',
      thumbnail: '',
      deliverType: '',
      link: '',
      order: (products.length + 1).toString(),
      category: filterCategory || 'tesla',
    });
    setShowModal(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      id: product.id,
      name: product.name,
      price: product.price,
      thumbnail: product.thumbnail,
      deliverType: product.deliverType || '',
      link: product.link,
      order: product.order,
      category: product.category,
    });
    setShowModal(true);
  };

  const handleDeleteClick = (product: Product) => {
    setDeletingProduct(product);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProduct) return;

    try {
      await fetch(`/api/products/${deletingProduct.id}`, { method: 'DELETE' });
      await fetchProducts();
    } catch (error) {
      console.error('Failed to delete product:', error);
    } finally {
      setShowDeleteModal(false);
      setDeletingProduct(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingProduct) {
        await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } else {
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }
      await fetchProducts();
      setShowModal(false);
    } catch (error) {
      console.error('Failed to save product:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryLabel = (value: string) => {
    const category = PRODUCT_CATEGORIES.find(c => c.value === value);
    return category ? category.label : value;
  };

  const filteredProducts = products.filter((product) => {
    if (!searchQuery) return true;
    return product.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

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
      {/* Search */}
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          className="form-input"
          placeholder="상품명으로 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ maxWidth: '400px' }}
        />
      </div>

      {/* Category Filter */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button
          className={`btn ${filterCategory === '' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilterCategory('')}
        >
          전체
        </button>
        {PRODUCT_CATEGORIES.map((cat) => (
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
            상품 리스트 관리
            {filterCategory && (
              <span style={{ fontSize: '0.875rem', fontWeight: 400, marginLeft: '0.5rem', color: '#64748b' }}>
                ({getCategoryLabel(filterCategory)})
              </span>
            )}
          </h2>
          <button className="btn btn-primary" onClick={handleAdd}>
            + 새 상품 추가
          </button>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {filteredProducts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🛒</div>
              <h3>등록된 상품이 없습니다</h3>
              <p>새 상품을 추가하여 시작하세요.</p>
              <button className="btn btn-primary" onClick={handleAdd}>
                + 새 상품 추가
              </button>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>ID</th>
                  <th style={{ width: '80px' }}>이미지</th>
                  <th>카테고리</th>
                  <th>상품명</th>
                  <th>가격</th>
                  <th style={{ width: '120px' }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td style={{ textAlign: 'center', color: '#64748b' }}>{product.id}</td>
                    <td>
                      <img
                        src={product.thumbnail}
                        alt={product.name}
                        style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover', background: '#f1f5f9' }}
                      />
                    </td>
                    <td>
                      <span className="badge badge-success">{getCategoryLabel(product.category)}</span>
                    </td>
                    <td style={{ fontWeight: 500 }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span>{product.name}</span>
                        <a
                          href={product.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: '0.75rem', color: '#3b82f6', textDecoration: 'none' }}
                        >
                          링크 열기 ↗
                        </a>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, color: '#ffffffff' }}>{product.price}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
                          onClick={() => handleEdit(product)}
                        >
                          수정
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
                          onClick={() => handleDeleteClick(product)}
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
          <div className="modal-content" style={{ minWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingProduct ? '상품 수정' : '새 상품 추가'}</h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label htmlFor="category" className="form-label">카테고리</label>
                    <select
                      id="category"
                      className="form-input"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      required
                    >
                      {PRODUCT_CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="order" className="form-label">정렬 순서</label>
                    <input
                      type="number"
                      id="order"
                      className="form-input"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="name" className="form-label">상품명</label>
                  <input
                    type="text"
                    id="name"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="상품 이름을 입력하세요"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label htmlFor="price" className="form-label">가격</label>
                    <input
                      type="text"
                      id="price"
                      className="form-input"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="예: 712,600원"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="deliverType" className="form-label">배송 타입</label>
                    <input
                      type="text"
                      id="deliverType"
                      className="form-input"
                      value={formData.deliverType}
                      onChange={(e) => setFormData({ ...formData, deliverType: e.target.value })}
                      placeholder="예: 무료배송"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="thumbnail" className="form-label">썸네일 URL</label>
                  <input
                    type="text"
                    id="thumbnail"
                    className="form-input"
                    value={formData.thumbnail}
                    onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                    placeholder="이미지 주소를 입력하세요"
                    required
                  />
                  {formData.thumbnail && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'center', background: '#f8fafc', padding: '1rem', borderRadius: '4px' }}>
                      <img
                        src={formData.thumbnail}
                        alt="미리보기"
                        style={{ maxHeight: '150px', borderRadius: '4px' }}
                        onError={(e) => { (e.target as any).src = 'https://via.placeholder.com/150?text=Invalid+URL'; }}
                      />
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="link" className="form-label">구매 링크</label>
                  <input
                    type="text"
                    id="link"
                    className="form-input"
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    placeholder="https://..."
                    required
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
              <p>&quot;{deletingProduct?.name}&quot; 상품을 삭제하시겠습니까?</p>
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
