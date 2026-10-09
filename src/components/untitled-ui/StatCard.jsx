/**
 * Untitled UI — Stat Card / Metric Component
 * https://www.untitledui.com/react/components/metrics
 */

import React from 'react';
import '../../styles/untitled-ui.css';

export function StatCard({
  label,
  value,
  icon = null,
  trend = null, // 'up' | 'down' | 'neutral'
  change = null,
  caption = '',
  className = '',
  iconBg = null,
  onClick = null,
  ...props
}) {
  const getTrendIcon = () => {
    if (trend === 'up') return '↗';
    if (trend === 'down') return '↘';
    return '→';
  };

  const getTrendClass = () => {
    if (trend === 'up') return 'uui-stat-trend-up';
    if (trend === 'down') return 'uui-stat-trend-down';
    return 'uui-stat-trend-neutral';
  };

  return (
    <div
      className={`uui-stat-card ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      {...props}
    >
      <div className="uui-stat-top">
        <span className="uui-stat-label">{label}</span>
        {icon && (
          <div
            className="uui-stat-icon-wrap"
            style={iconBg ? { background: iconBg, borderColor: 'transparent' } : {}}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="uui-stat-value">{value}</div>

      {(change || caption) && (
        <div className="uui-stat-footer">
          {change && (
            <span className={`uui-stat-trend ${getTrendClass()}`}>
              <span>{getTrendIcon()}</span>
              <span>{change}</span>
            </span>
          )}
          {caption && <span>{caption}</span>}
        </div>
      )}
    </div>
  );
}

export function StatGrid({ children, className = '' }) {
  return <div className={`uui-stat-grid ${className}`}>{children}</div>;
}

export default StatCard;
