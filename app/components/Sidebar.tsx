'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  superOnly?: boolean; // 슈퍼관리자 전용 여부
}

const navItems: NavItem[] = [
  { href: '/members', label: '회원 관리', icon: '👥', superOnly: true },
  { href: '/game-characters', label: '게임 캐릭터 관리', icon: '🎮', superOnly: true },
  { href: '/gem-transactions', label: 'Gem 거래 내역', icon: '💎', superOnly: true },
  { href: '/news', label: '뉴스 관리', icon: '📰' },
  { href: '/tips', label: '팁 게시물 관리', icon: '💡' },
  { href: '/products', label: '상품 리스트 관리', icon: '🛒' },
  { href: '/community', label: '커뮤니티 스크래핑', icon: '🌐' },
  { href: '/inquiries', label: '고객 문의 관리', icon: '💬' },
];

const adminItems: NavItem[] = [
  { href: '/admin-users', label: '관리자 관리', icon: '🔐' },
  { href: '/categories', label: '카테고리 관리', icon: '📁' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const handleNavClick = () => {
    // Close sidebar on mobile when a link is clicked
    onClose();
  };

  // 권한에 따라 보여줄 메뉴 필터링
  const visibleNavItems = navItems.filter((item) => {
    if (item.superOnly) {
      return user?.isSuper;
    }
    return true;
  });

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🚗</div>
          <span>ZROOM Admin</span>
        </div>
        {/* Mobile close button */}
        <button className="sidebar-close" onClick={onClose}>
          ✕
        </button>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-section-title">콘텐츠 관리</div>
          {visibleNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${pathname === item.href || pathname.startsWith(item.href + '/') ? 'active' : ''}`}
              onClick={handleNavClick}
            >
              <span className="nav-item-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        {/* 슈퍼 관리자 전용 메뉴 */}
        {user?.isSuper && (
          <div className="nav-section">
            <div className="nav-section-title">시스템 관리</div>
            {adminItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${pathname === item.href || pathname.startsWith(item.href + '/') ? 'active' : ''}`}
                onClick={handleNavClick}
              >
                <span className="nav-item-icon">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        )}
      </nav>
    </aside>
  );
}
