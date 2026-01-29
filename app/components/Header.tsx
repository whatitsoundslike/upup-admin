'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

const pageTitles: { [key: string]: string } = {
  '/': '대시보드',
  '/news': '뉴스 관리',
  '/tips': '팁 게시물 관리',
  '/products': '상품 리스트 관리',
  '/charging-stations': '전기차 충전소 위치 관리',
};

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const getPageTitle = () => {
    if (pageTitles[pathname]) {
      return pageTitles[pathname];
    }

    for (const [path, title] of Object.entries(pageTitles)) {
      if (pathname.startsWith(path) && path !== '/') {
        return title;
      }
    }

    return '대시보드';
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = () => {
    setShowLogoutModal(false);
    logout();
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  return (
    <>
      <header className="header">
        <div className="header-left">
          <button className="menu-toggle" onClick={onMenuClick}>
            <span className="menu-icon">☰</span>
          </button>
          <h1 className="header-title">{getPageTitle()}</h1>
        </div>

        <div className="header-actions">
          <button onClick={handleLogoutClick} className="btn btn-secondary" style={{ fontSize: '0.875rem' }}>
            로그아웃
          </button>
          <div className="header-user">
            <div className="user-avatar">A</div>
            <span>Admin</span>
          </div>
        </div>
      </header>

      {showLogoutModal && (
        <div className="modal-overlay" onClick={handleLogoutCancel}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>로그아웃</h3>
            </div>
            <div className="modal-body">
              <p>정말 로그아웃 하시겠습니까?</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleLogoutCancel}>
                취소
              </button>
              <button className="btn btn-primary" onClick={handleLogoutConfirm}>
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
