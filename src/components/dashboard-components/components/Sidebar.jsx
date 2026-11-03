import { LayoutDashboard, TrendingUp, DollarSign, AlertTriangle, BarChart3, Users, UserCheck, Package, PieChart, Globe, FileText, ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import './Sidebar.css';

const navItems = [
  { id: 'executive-summary', label: 'Executive Summary', icon: LayoutDashboard },
  { id: 'exception-monitoring', label: 'Exception Monitoring', icon: AlertTriangle },
];

export default function Sidebar({ activeSection, collapsed, onToggle }) {
  const handleClick = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <Activity size={18} />
        </div>
        <div className="sidebar-brand-text">
          <span className="sidebar-brand-name">AnalyticsPro</span>
          <span className="sidebar-brand-label">Enterprise</span>
        </div>
      </div>
      <button className="sidebar-toggle" onClick={onToggle} aria-label="Toggle sidebar">
        {collapsed ? <ChevronRight /> : <ChevronLeft />}
      </button>
      <nav className="sidebar-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`sidebar-nav-item${activeSection === item.id ? ' active' : ''}`}
            onClick={() => handleClick(item.id)}
            title={collapsed ? item.label : undefined}
          >
            <item.icon />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
