'use client';

import React, { useState } from 'react';
import { Copy, Check, Table as TableIcon, Download } from 'lucide-react';
import { motion } from 'framer-motion';

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
    <motion.div 
      className="my-8 pro-table-container"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
        {/* Premium Table Header */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div 
              className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center text-white shadow-lg"
              whileHover={{ scale: 1.05 }}
            >
              <TableIcon size={24} strokeWidth={1.5} />
            </motion.div>
            <div>
              <h4 className="text-xl font-bold text-gray-900 tracking-tight">Fee Schedule</h4>
              <p className="text-sm text-gray-500 font-medium">Official Statutory Rates</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              onClick={handleCopy}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Copy to clipboard"
            >
              {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} className="text-gray-400" />}
              {copied ? 'Copied!' : 'Copy Table'}
            </motion.button>
            <motion.button
              onClick={handleDownloadCSV}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Download CSV"
            >
              <Download size={16} className="text-gray-400" />
              Download CSV
            </motion.button>
          </div>
        </div>

        {/* Premium Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            {children}
          </table>
        </div>

        {/* Premium Table Footer */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-5 border-t border-gray-200">
          <p className="text-sm text-gray-700">
            <span className="font-bold text-gray-900">Note:</span> <span className="text-gray-600">Fees listed are the maximum allowed by state law. Notaries may choose to charge less.</span>
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// Custom sub-components for table elements to ensure consistent styling
export const TableHeader = ({ children }: { children: React.ReactNode }) => (
  <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
    {children}
  </thead>
);

export const TableRow = ({ children, isHeader }: { children: React.ReactNode; isHeader?: boolean }) => {
  if (isHeader) {
    return (
      <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        {children}
      </tr>
    );
  }
  return (
    <motion.tr 
      className="border-b border-gray-100 last:border-0 odd:bg-white even:bg-gray-50 hover:bg-blue-50 transition-colors group"
      whileHover={{ backgroundColor: "#eff6ff" }}
    >
      {children}
    </motion.tr>
  );
};

export const TableHead = ({ children }: { children: React.ReactNode }) => {
  const text = String(children).toLowerCase();
  const isRight = text.includes('fee') || text.includes('rate') || text.includes('price') || text.includes('amount');
  
  return (
    <th className={`px-6 py-5 text-sm font-bold text-white uppercase tracking-wider ${isRight ? 'text-right' : 'text-left'}`}>
      {children}
    </th>
  );
};

export const TableCell = ({ children, isPrice }: { children: React.ReactNode; isPrice?: boolean }) => (
  <td className={`px-6 py-5 text-sm ${isPrice ? 'text-right font-bold text-blue-600' : 'text-gray-700 font-medium'} leading-relaxed`}>
    {children}
  </td>
);
