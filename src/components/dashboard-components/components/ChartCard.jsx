import './ChartCard.css';

export default function ChartCard({ title, subtitle, actions, children }) {
  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div className="chart-card-title-group">
          <h3 className="chart-card-title">{title}</h3>
          {subtitle && <p className="chart-card-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="chart-card-actions">{actions}</div>}
      </div>
      <div className="chart-card-body">{children}</div>
    </div>
  );
}
