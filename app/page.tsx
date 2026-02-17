import Link from 'next/link';

export default function Home() {
  const menuItems = [
    {
      href: '/members',
      label: '회원 관리',
      icon: '👥',
      description: '회원 정보를 조회하고 관리합니다.',
      color: 'purple'
    },
    {
      href: '/gem-transactions',
      label: 'Gem 거래 내역',
      icon: '💎',
      description: 'Gem 획득 및 사용 내역을 조회합니다.',
      color: 'cyan'
    },
    {
      href: '/news',
      label: '뉴스 관리',
      icon: '📰',
      description: '최신 뉴스 및 공지사항을 관리합니다.',
      color: 'blue'
    },
    {
      href: '/tips',
      label: '팁 게시물 관리',
      icon: '💡',
      description: '유용한 팁과 가이드 게시물을 관리합니다.',
      color: 'green'
    },
    {
      href: '/products',
      label: '상품 리스트 관리',
      icon: '🛒',
      description: '상품 목록 및 정보를 관리합니다.',
      color: 'yellow'
    },
  ];

  return (
    <div>
      <div className="stats-grid">
        {menuItems.map((item) => (
          <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
            <div className="stat-card" style={{ cursor: 'pointer', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}>
              <div className={`stat-icon ${item.color}`}>
                <span style={{ fontSize: '1.5rem' }}>{item.icon}</span>
              </div>
              <div className="stat-content">
                <h3 style={{ margin: 0, marginBottom: '0.5rem' }}>{item.label}</h3>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                  {item.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">시작하기</h2>
        </div>
        <div className="card-body">
          <p style={{ color: '#64748b', marginBottom: '1rem' }}>
            왼쪽 사이드바에서 관리할 메뉴를 선택하거나, 위의 카드를 클릭하여 해당 관리 페이지로 이동하세요.
          </p>
          <p style={{ color: '#64748b' }}>
            각 메뉴에서 JSON 기반의 데이터를 <strong>조회</strong>, <strong>생성</strong>, <strong>수정</strong>, <strong>삭제</strong>할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
