'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChevronDown, ChevronRight } from 'lucide-react';
import ProfessionalTable from './ProfessionalTable';

interface CollapsibleMarkdownProps {
  content: string;
}

// Define markdown components outside to avoid scope issues
const getMarkdownComponents = () => ({
  table: ({ children }: any) => <ProfessionalTable>{children}</ProfessionalTable>,
  thead: ({ children }: any) => <thead className="bg-[#3f4b8c] text-white">{children}</thead>,
  tbody: ({ children }: any) => <tbody>{children}</tbody>,
  th: ({ children }: any) => {
    // Determine if it's the last column (usually Fee) to align right
    const isLast = (children: any) => {
      // This is a heuristic, in markdown-react children is usually the text content
      const text = String(children).toLowerCase();
      return text.includes('fee') || text.includes('rate') || text.includes('price');
    };
    
    return (
      <th className={`px-6 py-5 text-sm font-bold text-white uppercase tracking-wider ${isLast(children) ? 'text-right' : 'text-left'}`}>
        {children}
      </th>
    );
  },
  tr: ({ children }: any) => (
    <tr className="border-b border-gray-100 last:border-0 odd:bg-white even:bg-[#f8faff] hover:bg-indigo-50/50 transition-colors">
      {children}
    </tr>
  ),
  td: ({ children }: any) => {
    // Heuristic for price: starts with $ or is a number with 2 decimals
    const isPrice = (content: any) => {
      if (typeof content !== 'string') return false;
      return content.trim().startsWith('$') || /^\d+\.\d{2}$/.test(content.trim());
    };
    
    const price = isPrice(children);
    
    return (
      <td className={`px-6 py-5 text-sm ${price ? 'text-right font-bold text-gray-900' : 'text-gray-700 font-medium'} leading-relaxed`}>
        {children}
      </td>
    );
  },
});

export default function CollapsibleMarkdown({ content }: CollapsibleMarkdownProps) {
  // Split content by H3 headers (###)
  const sections = content.split(/(?=### )/g);
  const markdownComponents = getMarkdownComponents();

  if (sections.length <= 1) {
    return (
      <div className="markdown-body prose prose-indigo prose-sm max-w-none">
        <ReactMarkdown components={markdownComponents}>
          {content}
        </ReactMarkdown>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sections.map((section, index) => {
        // If it's the first section and doesn't start with ###, show it normally
        if (index === 0 && !section.startsWith('### ')) {
          return (
            <div key={index} className="markdown-body prose prose-indigo prose-sm max-w-none mb-6">
              <ReactMarkdown components={markdownComponents}>{section}</ReactMarkdown>
            </div>
          );
        }
        return <CollapsibleSection key={index} section={section} defaultOpen={index === 0} />;
      })}
    </div>
  );
}

function CollapsibleSection({ section, defaultOpen = false }: { section: string; defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const markdownComponents = getMarkdownComponents();
  
  // Extract title from the first line (removing ### )
  const lines = section.split('\n');
  const title = lines[0].replace('### ', '').trim();
  const body = lines.slice(1).join('\n').trim();

  if (!title) return null;

  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm transition-all hover:border-indigo-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left bg-gray-50/50 hover:bg-indigo-50/30 transition-colors group"
      >
        <span className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
          {title}
        </span>
        <div className="text-gray-400 group-hover:text-indigo-500 transition-colors">
          {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </div>
      </button>
      
      {isOpen && (
        <div className="p-6 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="markdown-body prose prose-indigo prose-sm max-w-none">
            <ReactMarkdown components={markdownComponents}>
              {body}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
