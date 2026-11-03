import { Search, Bell, ChevronRight } from 'lucide-react';
import './Header.css';

export default function Header({ collapsed }) {
  return (
    <header className={`header${collapsed ? ' sidebar-collapsed' : ''}`}>
      <div className="header-left">
        <div>
          <h1 className="header-title">Enterprise Analytics</h1>
          <div className="header-breadcrumb">
            Dashboard <ChevronRight size={12} /> <span>Executive Summary</span>
          </div>
        </div>
      </div>
      <div className="header-right">
        <div className="header-search">
          <Search />
          <input type="text" placeholder="Search analytics..." />
        </div>
        <button className="header-notification" aria-label="Notifications">
          <Bell />
          <span className="header-notification-badge">5</span>
        </button>
        <div className="header-user">
          <div className="header-avatar">AK</div>
          <div className="header-user-info">
            <span className="header-user-name">Admin User</span>
            <span className="header-user-role">Finance Director</span>
          </div>
        </div>
      </div>
    </header>
  );
}
