/**
 * Untitled UI — Badge Component
 * https://www.untitledui.com/react/components/badges
 */

import React from 'react';
import '../../styles/untitled-ui.css';

export function Badge({
  variant = 'brand',
  hasDot = true,
  children,
  className = ''
}) {
  return (
    <span className={`uui-badge uui-badge-${variant} ${className}`.trim()}>
      {hasDot && <span className="uui-badge-dot" aria-hidden="true" />}
      <span>{children}</span>
    </span>
  );
}

export default Badge;
