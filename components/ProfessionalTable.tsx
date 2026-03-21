'use client';

import React, { useState } from 'react';
import { Copy, Check, Table as TableIcon, Download } from 'lucide-react';

interface ProfessionalTableProps {
  children: React.ReactNode;
}

export default function ProfessionalTable({ children }: ProfessionalTableProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const table = document.querySelector('.pro-table-container table');
    if (!table) return;
    const text = (table as HTMLElement).innerText;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCSV = () => {
    const table = document.querySelector('.pro-table-container table');
    if (!table) return;
    
    const rows = Array.from(table.querySelectorAll('tr'));
    const csvContent = rows.map(row => {
      const cells = Array.from(row.querySelectorAll('th, td'));
      return cells.map(cell => `"${(cell as HTMLElement).innerText.replace(/"/g, '""')}"`).join(',');
    }).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'notary_fees.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="my-8 pro-table-container animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
        {/* Table Header */}
        <div className="bg-gray-50/50 border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
              <TableIcon size={16} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900 tracking-tight">Fee Schedule</h4>
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Official Statutory Rates</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all group relative"
              title="Copy to clipboard"
            >
              {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {copied ? 'Copied!' : 'Copy Table'}
              </span>
            </button>
            <button
              onClick={handleDownloadCSV}
              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all group relative"
              title="Download CSV"
            >
              <Download size={16} />
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                Download CSV
              </span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            {children}
          </table>
        </div>

        {/* Table Footer */}
        <div className="bg-gray-50/30 px-6 py-3 border-t border-gray-100">
          <p className="text-[10px] text-gray-400 italic">
            Note: Fees listed are the maximum allowed by state law. Notaries may choose to charge less.
          </p>
        </div>
      </div>
    </div>
  );
}

// Custom sub-components for table elements to ensure consistent styling
export const TableHeader = ({ children }: { children: React.ReactNode }) => (
  <thead className="bg-gray-50/50">
    {children}
  </thead>
);

export const TableRow = ({ children }: { children: React.ReactNode }) => (
  <tr className="group hover:bg-indigo-50/20 transition-colors border-b border-gray-100 last:border-0">
    {children}
  </tr>
);

export const TableHead = ({ children }: { children: React.ReactNode }) => (
  <th className="px-6 py-4 text-[11px] font-bold text-indigo-600 uppercase tracking-widest">
    {children}
  </th>
);

export const TableCell = ({ children }: { children: React.ReactNode }) => (
  <td className="px-6 py-4 text-sm text-gray-700 font-medium">
    {children}
  </td>
);
