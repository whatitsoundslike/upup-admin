'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface Subsidy {
    id: string;
    locationName1: string;
    locationName2: string;
    totalCount: number;
    recievedCount: number;
    releaseCount: number;
    remainCount: number;
    etc: string;
    updatedAt: string;
}

export default function SubsidiesPage() {
    const { user } = useAuth();
    const [subsidies, setSubsidies] = useState<Subsidy[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [filterLocation, setFilterLocation] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);

    const fetchSubsidies = async () => {
        try {
            const res = await fetch('/api/subsidies');
            const data = await res.json();
            setSubsidies(data);
            if (data.length > 0) {
                setLastUpdated(data[0].updatedAt);
            }
        } catch (error) {
            console.error('Failed to fetch subsidies:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefresh = async () => {
        if (isRefreshing) return;

        setIsRefreshing(true);
        try {
            const res = await fetch('/api/subsidies/scrape', { method: 'POST' });
            const data = await res.json();

            if (res.ok) {
                alert(data.message);
                await fetchSubsidies();
            } else {
                alert(data.error || '데이터 갱신에 실패했습니다.');
            }
        } catch (error) {
            console.error('Failed to refresh subsidies:', error);
            alert('데이터 갱신 중 오류가 발생했습니다.');
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchSubsidies();
    }, []);

    // 시도별 그룹화
    const locationGroups = [...new Set(subsidies.map((s) => s.locationName1))];

    // 필터링된 보조금 목록
    const filteredSubsidies = subsidies.filter((subsidy) => {
        const matchesLocation = !filterLocation || subsidy.locationName1 === filterLocation;
        const matchesSearch = !searchQuery ||
            subsidy.locationName1.toLowerCase().includes(searchQuery.toLowerCase()) ||
            subsidy.locationName2.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesLocation && matchesSearch;
    });

    // 통계 계산
    const stats = {
        totalCount: filteredSubsidies.reduce((sum, s) => sum + (s.totalCount || 0), 0),
        totalReceived: filteredSubsidies.reduce((sum, s) => sum + (s.recievedCount || 0), 0),
        totalReleased: filteredSubsidies.reduce((sum, s) => sum + (s.releaseCount || 0), 0),
        totalRemain: filteredSubsidies.reduce((sum, s) => sum + (s.remainCount || 0), 0),
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        try {
            return new Date(dateStr).toLocaleString('ko-KR');
        } catch {
            return dateStr;
        }
    };

    const formatNumber = (num: number) => {
        return num.toLocaleString();
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
            {/* Header with Refresh Button */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>전기차 보조금 현황</h2>
                    {lastUpdated && (
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#64748b' }}>
                            마지막 업데이트: {formatDate(lastUpdated)}
                        </p>
                    )}
                </div>
                <button
                    className="btn btn-primary"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    {isRefreshing ? (
                        <>
                            <span className="loading-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></span>
                            데이터 갱신 중...
                        </>
                    ) : (
                        <>🔄 데이터 갱신</>
                    )}
                </button>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="card" style={{ padding: '1.25rem' }}>
                    <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>총 보급대수</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ffffffff' }}>{formatNumber(stats.totalCount)}</div>
                </div>
                <div className="card" style={{ padding: '1.25rem' }}>
                    <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>접수대수</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#3b82f6' }}>{formatNumber(stats.totalReceived)}</div>
                </div>
                <div className="card" style={{ padding: '1.25rem' }}>
                    <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>출고대수</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f59e0b' }}>{formatNumber(stats.totalReleased)}</div>
                </div>
                <div className="card" style={{ padding: '1.25rem' }}>
                    <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>잔여대수</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#22c55e' }}>{formatNumber(stats.totalRemain)}</div>
                </div>
            </div>

            {/* Search and Filter */}
            <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <input
                    type="text"
                    className="form-input"
                    placeholder="지역명으로 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ maxWidth: '300px' }}
                />
            </div>

            {/* Location Filter */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                    className={`btn ${filterLocation === '' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFilterLocation('')}
                >
                    전체
                </button>
                {locationGroups.map((loc) => (
                    <button
                        key={loc}
                        className={`btn ${filterLocation === loc ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setFilterLocation(loc)}
                    >
                        {loc}
                    </button>
                ))}
            </div>

            {/* Data Table */}
            <div className="card">
                <div className="card-body" style={{ padding: 0 }}>
                    {filteredSubsidies.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">🚗</div>
                            <h3>보조금 데이터가 없습니다</h3>
                            <p>데이터 갱신 버튼을 눌러 최신 데이터를 가져오세요.</p>
                            <button className="btn btn-primary" onClick={handleRefresh} disabled={isRefreshing}>
                                🔄 데이터 갱신
                            </button>
                        </div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>시도</th>
                                    <th>시군구</th>
                                    <th style={{ textAlign: 'right' }}>총 보급</th>
                                    <th style={{ textAlign: 'right' }}>접수</th>
                                    <th style={{ textAlign: 'right' }}>출고</th>
                                    <th style={{ textAlign: 'right' }}>잔여</th>
                                    <th>비고</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSubsidies.map((subsidy) => {
                                    const remainPercent = subsidy.totalCount > 0
                                        ? (subsidy.remainCount / subsidy.totalCount) * 100
                                        : 0;
                                    const remainColor = remainPercent > 50 ? '#22c55e' :
                                        remainPercent > 20 ? '#f59e0b' : '#ef4444';

                                    return (
                                        <tr key={subsidy.id}>
                                            <td style={{ fontWeight: 500 }}>{subsidy.locationName1}</td>
                                            <td>{subsidy.locationName2}</td>
                                            <td style={{ textAlign: 'right', fontWeight: 500 }}>
                                                {formatNumber(subsidy.totalCount)}
                                            </td>
                                            <td style={{ textAlign: 'right', color: '#3b82f6' }}>
                                                {formatNumber(subsidy.recievedCount)}
                                            </td>
                                            <td style={{ textAlign: 'right', color: '#f59e0b' }}>
                                                {formatNumber(subsidy.releaseCount)}
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <span style={{
                                                    fontWeight: 700,
                                                    color: remainColor,
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.25rem',
                                                }}>
                                                    {formatNumber(subsidy.remainCount)}
                                                    <span style={{
                                                        fontSize: '0.75rem',
                                                        fontWeight: 400,
                                                        color: '#64748b',
                                                    }}>
                                                        ({remainPercent.toFixed(0)}%)
                                                    </span>
                                                </span>
                                            </td>
                                            <td style={{
                                                maxWidth: '300px',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                fontSize: '0.75rem',
                                                color: '#64748b',
                                            }}
                                                title={subsidy.etc}
                                            >
                                                {subsidy.etc || '-'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
