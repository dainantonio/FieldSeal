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
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-lg">
        {/* Table Header */}
        <div className="bg-white border-b border-gray-100 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#3f4b8c] rounded-xl flex items-center justify-center text-white shadow-inner">
              <TableIcon size={24} />
            </div>
            <div>
              <h4 className="text-xl font-bold text-gray-900 tracking-tight">Fee Schedule</h4>
              <p className="text-sm text-gray-500 font-medium">Official Statutory Rates</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm active:scale-95"
              title="Copy to clipboard"
            >
              {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} className="text-gray-400" />}
              {copied ? 'Copied!' : 'Copy Table'}
            </button>
            <button
              onClick={handleDownloadCSV}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm active:scale-95"
              title="Download CSV"
            >
              <Download size={16} className="text-gray-400" />
              Download CSV
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
        <div className="bg-gray-50/50 px-6 py-4 border-t border-gray-100">
          <p className="text-sm text-gray-600 italic">
            <span className="font-bold not-italic text-gray-900">Note:</span> Fees listed are the maximum allowed by state law. Notaries may choose to charge less.
          </p>
        </div>
      </div>
    </div>
  );
}

// Custom sub-components for table elements to ensure consistent styling
export const TableHeader = ({ children }: { children: React.ReactNode }) => (
  <thead className="bg-[#3f4b8c] text-white">
    {children}
  </thead>
);

export const TableRow = ({ children, isHeader }: { children: React.ReactNode; isHeader?: boolean }) => {
  if (isHeader) {
    return (
      <tr className="bg-[#3f4b8c] text-white">
        {children}
      </tr>
    );
  }
  return (
    <tr className="border-b border-gray-100 last:border-0 odd:bg-white even:bg-[#f8faff] hover:bg-indigo-50/50 transition-colors group">
      {children}
    </tr>
  );
};

export const TableHead = ({ children }: { children: React.ReactNode }) => (
  <th className="px-6 py-4 text-sm font-bold text-white uppercase tracking-wider first:rounded-tl-none last:rounded-tr-none">
    <div className="flex items-center justify-between">
      {children}
    </div>
  </th>
);

export const TableCell = ({ children, isPrice }: { children: React.ReactNode; isPrice?: boolean }) => (
  <td className={`px-6 py-5 text-sm ${isPrice ? 'text-right font-bold text-gray-900' : 'text-gray-700 font-medium'} leading-relaxed`}>
    {children}
  </td>
);
