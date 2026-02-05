'use client';

import { useState, useEffect } from 'react';
import { GemTransactionWithMember } from '../types/gemTransaction';

export default function GemTransactionsPage() {
    const [transactions, setTransactions] = useState<GemTransactionWithMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showMemberDetail, setShowMemberDetail] = useState(false);
    const [selectedMember, setSelectedMember] = useState<GemTransactionWithMember['member'] | null>(null);
    const [memberTransactions, setMemberTransactions] = useState<GemTransactionWithMember[]>([]);
    const [formData, setFormData] = useState({
        memberId: '',
        type: 'issue',
        amount: '',
        source: '',
        memo: '',
    });

    useEffect(() => {
        fetchTransactions();
    }, [searchQuery]);

    const fetchTransactions = async () => {
        try {
            setIsLoading(true);
            const url = searchQuery
                ? `/api/gem-transactions?search=${encodeURIComponent(searchQuery)}`
                : '/api/gem-transactions';
            const res = await fetch(url);
            const data = await res.json();
            setTransactions(data);
        } catch (error) {
            console.error('Failed to fetch gem transactions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchQuery(searchInput);
    };

    const handleClearSearch = () => {
        setSearchInput('');
        setSearchQuery('');
    };

    const handleSubmitTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await fetch('/api/gem-transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    memberId: formData.memberId,
                    type: formData.type,
                    amount: parseInt(formData.amount),
                    source: formData.source,
                    memo: formData.memo || null,
                }),
            });

            if (res.ok) {
                // Reset form
                setFormData({
                    memberId: '',
                    type: 'issue',
                    amount: '',
                    source: '',
                    memo: '',
                });
                // Refresh transactions
                await fetchTransactions();
                alert('Gem 거래가 성공적으로 생성되었습니다!');
            } else {
                const error = await res.json();
                alert(`오류: ${error.error || '거래 생성 실패'}`);
            }
        } catch (error) {
            console.error('Failed to create transaction:', error);
            alert('거래 생성 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleShowMemberDetail = (member: GemTransactionWithMember['member']) => {
        setSelectedMember(member);
        // Filter transactions for this member
        const filtered = transactions.filter(t => t.member.uid === member.uid);
        setMemberTransactions(filtered);
        setShowMemberDetail(true);
    };

    const handleCloseMemberDetail = () => {
        setShowMemberDetail(false);
        setSelectedMember(null);
        setMemberTransactions([]);
    };

    const calculateTotalGems = (transactions: GemTransactionWithMember[]) => {
        return transactions.reduce((sum, t) => sum + t.amount, 0);
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        try {
            return new Date(dateStr).toLocaleString('ko-KR');
        } catch {
            return dateStr;
        }
    };

    const getTypeLabel = (type: string) => {
        const typeMap: { [key: string]: { label: string; color: string } } = {
            issue: { label: '지급', color: '#10b981' },
            use: { label: '사용', color: '#ef4444' },
        };
        return typeMap[type] || { label: type, color: '#64748b' };
    };

    if (isLoading && transactions.length === 0) {
        return (
            <div className="loading-container" style={{ minHeight: '400px' }}>
                <div className="loading-spinner"></div>
                <p>로딩 중...</p>
            </div>
        );
    }

    return (
        <div>
            {/* Search Bar */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-body">
                    <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input
                            type="text"
                            className="form-input"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Member ID 또는 UID로 검색..."
                            style={{ flex: 1 }}
                        />
                        <button type="submit" className="btn btn-primary" disabled={isLoading}>
                            {isLoading ? '검색 중...' : '검색'}
                        </button>
                        {searchQuery && (
                            <button type="button" className="btn btn-secondary" onClick={handleClearSearch}>
                                초기화
                            </button>
                        )}
                    </form>
                    {searchQuery && (
                        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#64748b' }}>
                            검색어: <strong>{searchQuery}</strong> ({transactions.length}건)
                        </p>
                    )}
                </div>
            </div>

            {/* Gem Grant/Deduct Form */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-header">
                    <h2 className="card-title">Gem 지급/회수</h2>
                </div>
                <div className="card-body">
                    <form onSubmit={handleSubmitTransaction}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label htmlFor="memberId" className="form-label">Member ID (필수)</label>
                                <input
                                    type="number"
                                    id="memberId"
                                    className="form-input"
                                    value={formData.memberId}
                                    onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
                                    placeholder="Member ID 입력"
                                    required
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label htmlFor="type" className="form-label">타입 (필수)</label>
                                <select
                                    id="type"
                                    className="form-input"
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    required
                                >
                                    <option value="issue">지급 (issue)</option>
                                    <option value="use">사용 (use)</option>
                                </select>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label htmlFor="amount" className="form-label">금액 (필수)</label>
                                <input
                                    type="number"
                                    id="amount"
                                    className="form-input"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    placeholder="금액 입력 (양수만 입력)"
                                    required
                                    min="1"
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label htmlFor="source" className="form-label">출처 (필수)</label>
                                <input
                                    type="text"
                                    id="source"
                                    className="form-input"
                                    value={formData.source}
                                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                                    placeholder="예: admin, event, purchase"
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label htmlFor="memo" className="form-label">메모 (선택)</label>
                            <input
                                type="text"
                                id="memo"
                                className="form-input"
                                value={formData.memo}
                                onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                                placeholder="메모 입력 (선택)"
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? '처리 중...' : 'Gem 거래 생성'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">Gem 거래 내역</h2>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                    {transactions.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">💎</div>
                            <h3>{searchQuery ? '검색 결과가 없습니다' : '거래 내역이 없습니다'}</h3>
                            <p>{searchQuery ? '다른 검색어로 시도해보세요.' : 'Gem 거래 내역이 표시됩니다.'}</p>
                        </div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Member ID</th>
                                    <th>UID</th>
                                    <th>이름</th>
                                    <th>타입</th>
                                    <th>금액</th>
                                    <th>출처</th>
                                    <th>메모</th>
                                    <th>생성일</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((transaction) => {
                                    const typeInfo = getTypeLabel(transaction.type);
                                    return (
                                        <tr key={transaction.id}>
                                            <td style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                                {transaction.id}
                                            </td>
                                            <td style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                                {transaction.memberId}
                                            </td>
                                            <td
                                                style={{ fontWeight: 500, color: '#3b82f6', cursor: 'pointer', textDecoration: 'underline' }}
                                                onClick={() => handleShowMemberDetail(transaction.member)}
                                            >
                                                {transaction.member.uid}
                                            </td>
                                            <td>{transaction.member.name || '-'}</td>
                                            <td>
                                                <span
                                                    className="badge"
                                                    style={{
                                                        backgroundColor: typeInfo.color,
                                                        color: 'white',
                                                        padding: '0.25rem 0.5rem',
                                                        borderRadius: '0.25rem',
                                                        fontSize: '0.75rem',
                                                    }}
                                                >
                                                    {typeInfo.label}
                                                </span>
                                            </td>
                                            <td
                                                style={{
                                                    fontWeight: 600,
                                                    color: transaction.amount >= 0 ? '#10b981' : '#ef4444',
                                                }}
                                            >
                                                {transaction.amount >= 0 ? '+' : ''}
                                                {transaction.amount.toLocaleString()}
                                            </td>
                                            <td style={{ fontSize: '0.875rem' }}>{transaction.source}</td>
                                            <td style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                                {transaction.memo || '-'}
                                            </td>
                                            <td style={{ fontSize: '0.8125rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                                                {formatDate(transaction.createdAt)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Member Detail Modal */}
            {showMemberDetail && selectedMember && (
                <div className="modal-overlay" onClick={handleCloseMemberDetail}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">회원 Gem 상세 정보</h2>
                            <button className="modal-close" onClick={handleCloseMemberDetail}>×</button>
                        </div>
                        <div className="modal-body">
                            {/* Member Info */}
                            <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                    <div>
                                        <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>UID</p>
                                        <p style={{ fontSize: '1rem', fontWeight: 600 }}>{selectedMember.uid}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>이름</p>
                                        <p style={{ fontSize: '1rem', fontWeight: 600 }}>{selectedMember.name || '-'}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>이메일</p>
                                        <p style={{ fontSize: '1rem', fontWeight: 600 }}>{selectedMember.email || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Total Gems */}
                            <div style={{ marginBottom: '1.5rem', padding: '1.5rem', backgroundColor: '#eff6ff', borderRadius: '0.5rem', border: '2px solid #3b82f6' }}>
                                <p style={{ fontSize: '0.875rem', color: '#1e40af', marginBottom: '0.5rem', fontWeight: 500 }}>총 Gem 보유량</p>
                                <p style={{ fontSize: '2rem', fontWeight: 700, color: '#1e40af', margin: 0 }}>
                                    {calculateTotalGems(memberTransactions).toLocaleString()} Gems
                                </p>
                            </div>

                            {/* Transaction History */}
                            <div>
                                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>
                                    거래 내역 ({memberTransactions.length}건)
                                </h3>
                                {memberTransactions.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                                        <p>거래 내역이 없습니다.</p>
                                    </div>
                                ) : (
                                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th>타입</th>
                                                    <th>금액</th>
                                                    <th>출처</th>
                                                    <th>메모</th>
                                                    <th>생성일</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {memberTransactions.map((transaction) => {
                                                    const typeInfo = getTypeLabel(transaction.type);
                                                    return (
                                                        <tr key={transaction.id}>
                                                            <td>
                                                                <span
                                                                    className="badge"
                                                                    style={{
                                                                        backgroundColor: typeInfo.color,
                                                                        color: 'white',
                                                                        padding: '0.25rem 0.5rem',
                                                                        borderRadius: '0.25rem',
                                                                        fontSize: '0.75rem',
                                                                    }}
                                                                >
                                                                    {typeInfo.label}
                                                                </span>
                                                            </td>
                                                            <td
                                                                style={{
                                                                    fontWeight: 600,
                                                                    color: transaction.amount >= 0 ? '#10b981' : '#ef4444',
                                                                }}
                                                            >
                                                                {transaction.amount >= 0 ? '+' : ''}
                                                                {transaction.amount.toLocaleString()}
                                                            </td>
                                                            <td style={{ fontSize: '0.875rem' }}>{transaction.source}</td>
                                                            <td style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                                                {transaction.memo || '-'}
                                                            </td>
                                                            <td style={{ fontSize: '0.8125rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                                                                {formatDate(transaction.createdAt)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
