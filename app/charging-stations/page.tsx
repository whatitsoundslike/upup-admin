'use client';

import { useState, useEffect } from 'react';
import { ChargingStation } from '../types/charging-station';

export default function ChargingStationsPage() {
  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStation, setEditingStation] = useState<ChargingStation | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    lat: '',
    lng: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingStation, setDeletingStation] = useState<ChargingStation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      const res = await fetch('/api/charging-stations');
      const data = await res.json();
      setStations(data);
    } catch (error) {
      console.error('Failed to fetch stations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingStation(null);
    setFormData({ name: '', address: '', lat: '', lng: '' });
    setShowModal(true);
  };

  const handleEdit = (station: ChargingStation) => {
    setEditingStation(station);
    setFormData({
      name: station.name,
      address: station.address,
      lat: station.position.lat.toString(),
      lng: station.position.lng.toString(),
    });
    setShowModal(true);
  };

  const handleDeleteClick = (station: ChargingStation) => {
    setDeletingStation(station);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingStation) return;
    
    try {
      await fetch(`/api/charging-stations/${deletingStation.id}`, { method: 'DELETE' });
      await fetchStations();
    } catch (error) {
      console.error('Failed to delete station:', error);
    } finally {
      setShowDeleteModal(false);
      setDeletingStation(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      name: formData.name,
      address: formData.address,
      position: {
        lat: parseFloat(formData.lat),
        lng: parseFloat(formData.lng),
      },
    };

    try {
      if (editingStation) {
        await fetch(`/api/charging-stations/${editingStation.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch('/api/charging-stations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      await fetchStations();
      setShowModal(false);
    } catch (error) {
      console.error('Failed to save station:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredStations = stations.filter((station) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return station.name.toLowerCase().includes(q) || station.address.toLowerCase().includes(q);
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
          placeholder="명칭 또는 주소로 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ maxWidth: '400px' }}
        />
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            전기차 충전소 위치 관리
            <span style={{ fontSize: '0.875rem', fontWeight: 400, marginLeft: '0.5rem', color: '#64748b' }}>
              ({filteredStations.length}개{searchQuery && ` / 전체 ${stations.length}개`})
            </span>
          </h2>
          <button className="btn btn-primary" onClick={handleAdd}>
            + 새 충전소 추가
          </button>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {filteredStations.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">⚡</div>
              <h3>등록된 충전소가 없습니다</h3>
              <p>새 충전소 정보를 추가하여 시작하세요.</p>
              <button className="btn btn-primary" onClick={handleAdd}>
                + 새 충전소 추가
              </button>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>명칭</th>
                  <th>주소</th>
                  <th>위도(Lat)</th>
                  <th>경도(Lng)</th>
                  <th style={{ width: '120px' }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {filteredStations.map((station) => (
                  <tr key={station.id}>
                    <td style={{ fontWeight: 500 }}>{station.name}</td>
                    <td style={{ color: '#64748b' }}>{station.address}</td>
                    <td style={{ color: '#64748b', fontSize: '0.8125rem' }}>{station.position.lat}</td>
                    <td style={{ color: '#64748b', fontSize: '0.8125rem' }}>{station.position.lng}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
                          onClick={() => handleEdit(station)}
                        >
                          수정
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
                          onClick={() => handleDeleteClick(station)}
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
              <h3>{editingStation ? '충전소 정보 수정' : '새 충전소 추가'}</h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="name" className="form-label">충전소 명칭</label>
                  <input
                    type="text"
                    id="name"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="예: 서울 대치 - KT&G"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="address" className="form-label">주소</label>
                  <input
                    type="text"
                    id="address"
                    className="form-input"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="상세 주소를 입력하세요"
                    required
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label htmlFor="lat" className="form-label">위도(Latitude)</label>
                    <input
                      type="number"
                      step="any"
                      id="lat"
                      className="form-input"
                      value={formData.lat}
                      onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                      placeholder="37.XXXX"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="lng" className="form-label">경도(Longitude)</label>
                    <input
                      type="number"
                      step="any"
                      id="lng"
                      className="form-input"
                      value={formData.lng}
                      onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                      placeholder="127.XXXX"
                      required
                    />
                  </div>
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
              <p>&quot;{deletingStation?.name}&quot; 정보를 삭제하시겠습니까?</p>
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
