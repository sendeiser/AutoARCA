/**
 * Untitled UI — Button Component
 * https://www.untitledui.com/react/components/buttons
 */

import React from 'react';
import '../../styles/untitled-ui.css';

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  isBlock = false,
  leftIcon = null,
  rightIcon = null,
  iconLeading = null,
  iconTrailing = null,
  children,
  className = '',
  disabled,
  type = 'button',
  ...props
}) {
  const variantClass = `uui-btn-${variant}`;
  const sizeClass = `uui-btn-${size}`;
  const blockClass = isBlock ? 'uui-btn-block' : '';
  const lead = iconLeading || leftIcon;
  const trail = iconTrailing || rightIcon;

  return (
    <button
      type={type}
      className={`uui-btn ${variantClass} ${sizeClass} ${blockClass} ${className}`.trim()}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="uui-btn-spinner" aria-hidden="true">
          ⏳
        </span>
      ) : (
        lead && <span className="uui-btn-icon-left">{lead}</span>
      )}
      <span>{children}</span>
      {!isLoading && trail && (
        <span className="uui-btn-icon-right">{trail}</span>
      )}
    </button>
  );
}

export default Button;
