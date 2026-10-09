/**
 * Untitled UI — Button Component
 * https://www.untitledui.com/react/components/buttons
 */

import React from 'react';
import '../../styles/untitled-ui.css';

export default function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  isBlock = false,
  leftIcon = null,
  rightIcon = null,
  children,
  className = '',
  disabled,
  type = 'button',
  ...props
}) {
  const variantClass = `uui-btn-${variant}`;
  const sizeClass = `uui-btn-${size}`;
  const blockClass = isBlock ? 'uui-btn-block' : '';

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
        leftIcon && <span className="uui-btn-icon-left">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && (
        <span className="uui-btn-icon-right">{rightIcon}</span>
      )}
    </button>
  );
}
