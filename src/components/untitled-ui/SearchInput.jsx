/**
 * Untitled UI — Search Input Component
 * https://www.untitledui.com/react/components/inputs
 */

import React from 'react';
import { SearchIcon } from '../Icons.jsx';
import '../../styles/untitled-ui.css';

export function SearchInput({
  value,
  onChange,
  placeholder = 'Buscar...',
  shortcut = null,
  className = '',
  ...props
}) {
  return (
    <div className={`uui-search-wrap ${className}`}>
      <span className="uui-search-icon">
        <SearchIcon size={15} />
      </span>
      <input
        type="text"
        className="uui-search-input"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        {...props}
      />
      {shortcut && <span className="uui-search-kbd">{shortcut}</span>}
    </div>
  );
}

export default SearchInput;
