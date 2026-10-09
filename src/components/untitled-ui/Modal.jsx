/**
 * Untitled UI — Modal & Dialog Component
 * https://www.untitledui.com/react/components/modals
 */

import React, { useEffect } from 'react';
import '../../styles/untitled-ui.css';

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle = null,
  icon = null,
  children,
  footer = null,
  maxWidth = '520px',
  className = ''
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="uui-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`uui-modal-box ${className}`}
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="uui-modal-header">
          {icon && <div className="uui-modal-icon-badge">{icon}</div>}
          {title && <h3 className="uui-modal-title">{title}</h3>}
          {subtitle && <p className="uui-modal-subtitle">{subtitle}</p>}

          {onClose && (
            <button
              type="button"
              className="uui-modal-close-btn"
              onClick={onClose}
              aria-label="Cerrar modal"
            >
              ✕
            </button>
          )}
        </div>

        <div className="uui-modal-body">{children}</div>

        {footer && <div className="uui-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export default Modal;
