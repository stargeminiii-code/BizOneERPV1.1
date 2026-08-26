import React from 'react';

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  containerClassName?: string;
}

export const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className = '', containerClassName = '', children, ...props }, ref) => {
    return (
      <div className={`w-full overflow-x-auto rounded-xl border border-slate-200 bg-white ${containerClassName}`}>
        <table ref={ref} className={`w-full text-left border-collapse text-sm ${className}`} {...props}>
          {children}
        </table>
      </div>
    );
  }
);
Table.displayName = 'Table';

export const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <thead ref={ref} className={`bg-slate-50/90 border-b border-slate-200 ${className}`} {...props}>
        {children}
      </thead>
    );
  }
);
TableHeader.displayName = 'TableHeader';

export const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <tbody ref={ref} className={`divide-y divide-slate-100 bg-white ${className}`} {...props}>
        {children}
      </tbody>
    );
  }
);
TableBody.displayName = 'TableBody';

export const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <tfoot ref={ref} className={`bg-slate-50 border-t border-slate-200 font-medium ${className}`} {...props}>
        {children}
      </tfoot>
    );
  }
);
TableFooter.displayName = 'TableFooter';

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  isSelected?: boolean;
  isClickable?: boolean;
}

export const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className = '', isSelected = false, isClickable = false, children, ...props }, ref) => {
    return (
      <tr
        ref={ref}
        className={`
          transition-colors
          ${isSelected ? 'bg-slate-100/90 font-medium' : isClickable ? 'hover:bg-slate-50/80 cursor-pointer' : 'hover:bg-slate-50/40'}
          ${className}
        `}
        {...props}
      >
        {children}
      </tr>
    );
  }
);
TableRow.displayName = 'TableRow';

export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  align?: 'left' | 'center' | 'right';
}

export const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className = '', align = 'left', children, ...props }, ref) => {
    const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

    return (
      <th
        ref={ref}
        className={`px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider select-none ${alignClass} ${className}`}
        {...props}
      >
        {children}
      </th>
    );
  }
);
TableHead.displayName = 'TableHead';

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  align?: 'left' | 'center' | 'right';
  isNumeric?: boolean;
}

export const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className = '', align, isNumeric = false, children, ...props }, ref) => {
    const resolvedAlign = align || (isNumeric ? 'right' : 'left');
    const alignClass =
      resolvedAlign === 'right'
        ? 'text-right tabular-nums'
        : resolvedAlign === 'center'
        ? 'text-center'
        : 'text-left';

    return (
      <td
        ref={ref}
        className={`px-4 py-3 text-slate-800 text-sm align-middle ${alignClass} ${className}`}
        {...props}
      >
        {children}
      </td>
    );
  }
);
TableCell.displayName = 'TableCell';
