/**
 * Untitled UI — Data Table Component
 * https://www.untitledui.com/react/components/tables
 */

import React from 'react';
import '../../styles/untitled-ui.css';

export function TableContainer({ children, className = '', ...props }) {
  return (
    <div className={`uui-table-container ${className}`} {...props}>
      {children}
    </div>
  );
}

export function TableToolbar({ children, className = '', ...props }) {
  return (
    <div className={`uui-table-toolbar ${className}`} {...props}>
      {children}
    </div>
  );
}

export function Table({ children, className = '', ...props }) {
  return (
    <div className="uui-table-scroll">
      <table className={`uui-table ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className = '', ...props }) {
  return (
    <thead className={className} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = '', ...props }) {
  return (
    <tbody className={className} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className = '', ...props }) {
  return (
    <tr className={`uui-tr ${className}`} {...props}>
      {children}
    </tr>
  );
}

export function TableHead({ children, className = '', ...props }) {
  return (
    <th className={`uui-th ${className}`} {...props}>
      {children}
    </th>
  );
}

export function TableCell({ children, className = '', ...props }) {
  return (
    <td className={`uui-td ${className}`} {...props}>
      {children}
    </td>
  );
}

export default Table;
