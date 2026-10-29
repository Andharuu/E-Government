import React from 'react';

export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <div className="w-full overflow-x-auto no-scrollbar">
      <table className={`w-full text-left text-xs border-collapse ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
};

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <thead
      className={`border-b border-slate-200 dark:border-[#243048] bg-slate-50 dark:bg-[#101828] text-[12px] leading-[16px] font-semibold text-slate-600 dark:text-[#6EA2B3] ${className}`}
      {...props}
    >
      {children}
    </thead>
  );
};

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <tbody className={`divide-y divide-slate-100 dark:divide-[#243048]/60 font-normal text-[14px] leading-[20px] ${className}`} {...props}>
      {children}
    </tbody>
  );
};

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <tr
      className={`hover:bg-slate-50 dark:hover:bg-[#101828]/50 transition-colors duration-150 ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
};

export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <th className={`py-3.5 px-4 font-semibold text-slate-700 dark:text-[#7BBDE8] ${className}`} {...props}>
      {children}
    </th>
  );
};

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <td className={`py-3.5 px-4 text-slate-800 dark:text-[#BDD8E9] align-middle ${className}`} {...props}>
      {children}
    </td>
  );
};
