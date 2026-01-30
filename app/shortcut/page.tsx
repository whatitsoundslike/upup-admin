'use client';

import { useState } from 'react';

interface Shortcut {
  id: string;
  label: string;
  description: string;
  apiPath: string;
  icon: string;
}

const shortcuts: Shortcut[] = [
  {
    id: 'make-all-json',
    label: 'Make All JSON',
    description: 'zmake_all_json.py를 실행하여 전체 JSON 데이터를 생성합니다.',
    apiPath: '/api/run-script',
    icon: '📦',
  },
];

export default function ShortcutPage() {
  const [runningId, setRunningId] = useState<string | null>(null);
  const [result, setResult] = useState<{ id: string; success: boolean; message: string } | null>(null);

  const handleRun = async (shortcut: Shortcut) => {
    if (runningId) return;
    setRunningId(shortcut.id);
    setResult(null);

    try {
      const res = await fetch(shortcut.apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script: shortcut.id }),
      });
      const data = await res.json();
      setResult({ id: shortcut.id, success: data.success, message: data.message });
    } catch {
      setResult({ id: shortcut.id, success: false, message: '요청 중 오류가 발생했습니다.' });
    } finally {
      setRunningId(null);
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">단축 메뉴</h2>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {shortcuts.map((shortcut) => (
              <div
                key={shortcut.id}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>{shortcut.icon}</span>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{shortcut.label}</h3>
                </div>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                  {shortcut.description}
                </p>
                <button
                  className="btn btn-primary"
                  onClick={() => handleRun(shortcut)}
                  disabled={runningId !== null}
                  style={{ alignSelf: 'flex-start' }}
                >
                  {runningId === shortcut.id ? '실행 중...' : '실행'}
                </button>
                {result && result.id === shortcut.id && (
                  <div
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      backgroundColor: result.success ? '#f0fdf4' : '#fef2f2',
                      color: result.success ? '#16a34a' : '#dc2626',
                    }}
                  >
                    {result.message}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
