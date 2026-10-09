/**
 * Untitled UI — Card Component
 * https://www.untitledui.com/react/components/cards
 */

import React from 'react';
import '../../styles/untitled-ui.css';

export function Card({ children, className = '', ...props }) {
  return (
    <div className={`uui-card ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={`uui-card-header ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', ...props }) {
  return (
    <h3 className={`uui-card-title ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function CardSubtitle({ children, className = '', ...props }) {
  return (
    <p className={`uui-card-subtitle ${className}`} {...props}>
      {children}
    </p>
  );
}

export default Card;
