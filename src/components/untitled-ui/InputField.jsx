/**
 * Untitled UI — Input Field Component
 * https://www.untitledui.com/react/components/input-fields
 */

import React, { useState } from 'react';
import { EyeIcon, EyeOffIcon } from '../Icons.jsx';
import '../../styles/untitled-ui.css';

export function InputField({
  label,
  hint,
  error,
  leadingIcon = null,
  trailingIcon = null,
  type = 'text',
  isPasswordToggle = false,
  id,
  className = '',
  required = false,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || `uui-input-${Math.random().toString(36).slice(2, 7)}`;

  const computedType = isPasswordToggle
    ? showPassword ? 'text' : 'password'
    : type;

  const hasLeading = Boolean(leadingIcon);
  const hasTrailing = Boolean(trailingIcon || isPasswordToggle);

  return (
    <div className={`uui-input-wrap ${className}`.trim()}>
      {label && (
        <label htmlFor={inputId} className="uui-input-label">
          <span>{label} {required && <span style={{ color: '#ef4444' }}>*</span>}</span>
        </label>
      )}

      <div className="uui-input-inner">
        {hasLeading && (
          <span className="uui-input-leading-icon" aria-hidden="true">
            {leadingIcon}
          </span>
        )}

        <input
          id={inputId}
          type={computedType}
          className={`uui-input-box ${hasLeading ? 'with-leading' : ''} ${hasTrailing ? 'with-trailing' : ''} ${error ? 'error' : ''}`.trim()}
          required={required}
          aria-invalid={Boolean(error)}
          {...props}
        />

        {isPasswordToggle ? (
          <button
            type="button"
            className="uui-input-trailing-icon"
            onClick={() => setShowPassword(!showPassword)}
            title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
          >
            {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
          </button>
        ) : (
          trailingIcon && (
            <span className="uui-input-trailing-icon" aria-hidden="true">
              {trailingIcon}
            </span>
          )
        )}
      </div>

      {(error || hint) && (
        <span className={`uui-input-hint ${error ? 'error' : ''}`}>
          {error || hint}
        </span>
      )}
    </div>
  );
}

export default InputField;
