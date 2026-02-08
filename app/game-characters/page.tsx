'use client';

import { useState, useEffect } from 'react';
import { GameCharacter, RankCharacter } from '../types/game-character';

export default function GameCharactersPage() {
    const [characters, setCharacters] = useState<GameCharacter[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    useEffect(() => {
        fetchCharacters();
    }, []);

    const fetchCharacters = async () => {
        try {
            const res = await fetch('/api/game-characters');
            const data = await res.json();
            setCharacters(data);
        } catch (error) {
            console.error('Failed to fetch game characters:', error);
        } finally {
            setIsLoading(false);
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

    const toggleExpand = (id: string) => {
        setExpandedRow(expandedRow === id ? null : id);
    };

    const renderCharacterDetails = (rankCharacter: RankCharacter | null) => {
        if (!rankCharacter) {
            return (
                <div style={{
                    padding: '1rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    color: '#64748b',
                    textAlign: 'center'
                }}>
                    캐릭터 정보가 없습니다
                </div>
            );
        }

        const getElementColor = (element: string | null) => {
            const colors: Record<string, string> = {
                '불': '#ef4444',
                '물': '#3b82f6',
                '땅': '#a16207',
                '바람': '#22c55e',
                '빛': '#eab308',
                '어둠': '#7c3aed',
            };
            return colors[element || ''] || '#64748b';
        };

        return (
            <div style={{
                padding: '1.5rem',
                background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
                borderRadius: '12px',
                color: 'white'
            }}>
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                    {/* Character Image */}
                    {rankCharacter.imageUrl && (
                        <div style={{
                            width: '120px',
                            height: '120px',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            flexShrink: 0
                        }}>
                            <img
                                src={rankCharacter.imageUrl}
                                alt={rankCharacter.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>
                    )}

                    {/* Character Info */}
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>
                                {rankCharacter.name}
                            </h3>
                            <span style={{
                                padding: '0.25rem 0.75rem',
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                borderRadius: '20px',
                                fontSize: '0.875rem',
                                fontWeight: 600
                            }}>
                                Lv.{rankCharacter.level}
                            </span>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                            {rankCharacter.className && (
                                <span style={{
                                    padding: '0.25rem 0.5rem',
                                    backgroundColor: 'rgba(255,255,255,0.15)',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem'
                                }}>
                                    🗡️ {rankCharacter.className}
                                </span>
                            )}
                            {rankCharacter.element && (
                                <span style={{
                                    padding: '0.25rem 0.5rem',
                                    backgroundColor: getElementColor(rankCharacter.element),
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    fontWeight: 600
                                }}>
                                    {rankCharacter.element}
                                </span>
                            )}
                        </div>

                        {/* Stats */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: '0.75rem'
                        }}>
                            <div style={{
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.25rem' }}>❤️ HP</div>
                                <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>{rankCharacter.stats.hp}</div>
                            </div>
                            <div style={{
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.25rem' }}>⚔️ 공격</div>
                                <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>{rankCharacter.stats.attack}</div>
                            </div>
                            <div style={{
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.25rem' }}>🛡️ 방어</div>
                                <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>{rankCharacter.stats.defense}</div>
                            </div>
                            <div style={{
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.25rem' }}>⚡ 속도</div>
                                <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>{rankCharacter.stats.speed}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const formatKeyName = (key: string): string => {
        return key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    };

    const formatValue = (value: unknown): string => {
        if (value === null || value === undefined) return '-';
        if (typeof value === 'boolean') return value ? '✅ Yes' : '❌ No';
        if (typeof value === 'number') return value.toLocaleString();
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
    };

    const getRarityBadge = (rarity: string | undefined) => {
        const colors: Record<string, { bg: string; text: string }> = {
            common: { bg: '#94a3b8', text: '#fff' },
            uncommon: { bg: '#22c55e', text: '#fff' },
            rare: { bg: '#3b82f6', text: '#fff' },
            epic: { bg: '#a855f7', text: '#fff' },
            legendary: { bg: '#f59e0b', text: '#fff' },
            mythic: { bg: '#ef4444', text: '#fff' },
        };
        const color = colors[rarity?.toLowerCase() || ''] || colors.common;

        return (
            <span style={{
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: color.bg,
                color: color.text,
            }}>
                {rarity || 'Unknown'}
            </span>
        );
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
                    <h2 className="card-title">🎮 게임 캐릭터 관리</h2>
                    <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                        총 {characters.length}명의 캐릭터
                    </div>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                    {characters.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">🎮</div>
                            <h3>등록된 게임 캐릭터가 없습니다</h3>
                            <p>게임을 플레이한 회원이 없습니다.</p>
                        </div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '50px' }}></th>
                                    <th>Member ID</th>
                                    <th>UID</th>
                                    <th>랭크 스코어</th>
                                    <th>랭크 캐릭터 ID</th>
                                    <th>테스터</th>
                                    <th>수정일</th>
                                </tr>
                            </thead>
                            <tbody>
                                {characters.map((character) => (
                                    <>
                                        <tr
                                            key={character.id}
                                            onClick={() => toggleExpand(character.id)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <td>
                                                <button
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        fontSize: '1rem',
                                                        transform: expandedRow === character.id ? 'rotate(90deg)' : 'rotate(0deg)',
                                                        transition: 'transform 0.2s ease',
                                                    }}
                                                >
                                                    ▶
                                                </button>
                                            </td>
                                            <td style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                                {character.memberId}
                                            </td>
                                            <td style={{ fontWeight: 500 }}>{character.uid}</td>
                                            <td>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem'
                                                }}>
                                                    <span style={{
                                                        fontSize: '1.25rem',
                                                        fontWeight: 700,
                                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                        WebkitBackgroundClip: 'text',
                                                        WebkitTextFillColor: 'transparent',
                                                    }}>
                                                        {character.rankScore.toLocaleString()}
                                                    </span>
                                                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>점</span>
                                                </div>
                                            </td>
                                            <td>
                                                {character.rankCharacterId ? (
                                                    <code style={{
                                                        padding: '0.25rem 0.5rem',
                                                        backgroundColor: '#f1f5f9',
                                                        borderRadius: '4px',
                                                        fontSize: '0.8125rem',
                                                    }}>
                                                        {character.rankCharacterId}
                                                    </code>
                                                ) : (
                                                    <span style={{ color: '#94a3b8' }}>-</span>
                                                )}
                                            </td>
                                            <td>
                                                {character.tester ? (
                                                    <span style={{
                                                        padding: '0.25rem 0.5rem',
                                                        backgroundColor: '#fef3c7',
                                                        color: '#92400e',
                                                        borderRadius: '4px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600,
                                                    }}>
                                                        🧪 테스터
                                                    </span>
                                                ) : (
                                                    <span style={{ color: '#94a3b8' }}>-</span>
                                                )}
                                            </td>
                                            <td style={{ fontSize: '0.8125rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                                                {formatDate(character.updatedAt)}
                                            </td>
                                        </tr>
                                        {expandedRow === character.id && (
                                            <tr key={`${character.id}-details`}>
                                                <td colSpan={7} style={{ padding: '1rem', backgroundColor: '#f8fafc' }}>
                                                    <div style={{ marginBottom: '0.5rem', fontWeight: 600, color: '#334155' }}>
                                                        📊 캐릭터 세부 정보
                                                    </div>
                                                    {renderCharacterDetails(character.rankCharacter)}
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
