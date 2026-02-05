'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { href: '/members', label: '회원 관리', icon: '👥' },
  { href: '/gem-transactions', label: 'Gem 거래 내역', icon: '💎' },
  { href: '/news', label: '뉴스 관리', icon: '📰' },
  { href: '/tips', label: '팁 게시물 관리', icon: '💡' },
  { href: '/products', label: '상품 리스트 관리', icon: '🛒' },
  { href: '/charging-stations', label: '전기차 충전소 위치 관리', icon: '⚡' },
  { href: '/shortcut', label: '단축 메뉴', icon: '⚙️' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const handleNavClick = () => {
    // Close sidebar on mobile when a link is clicked
    onClose();
  };

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
          {navItems.map((item) => (
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
      </nav>
    </aside>
  );
}
