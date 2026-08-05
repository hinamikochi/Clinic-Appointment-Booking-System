import React from 'react';
import { TrendingUp } from 'lucide-react';

export function StatCard({ title, value, trend, icon: Icon }) {
  return (
    <div className="stat-card-natural">
      <div>
        <div className="stat-number">{value}</div>
        <div className="stat-title">{title}</div>
        {trend && (
          <div className="stat-trend">
            <TrendingUp size={14} />
            <span>{trend}</span>
          </div>
        )}
      </div>
      <div className="stat-icon-circle">
        <Icon size={24} />
      </div>
    </div>
  );
}

export default StatCard;