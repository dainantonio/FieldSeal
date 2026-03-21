'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChevronDown, ChevronRight } from 'lucide-react';
import ProfessionalTable from './ProfessionalTable';

interface CollapsibleMarkdownProps {
  content: string;
}

export default function CollapsibleMarkdown({ content }: CollapsibleMarkdownProps) {
  // Split content by H3 headers (###)
  const sections = content.split(/(?=### )/g);

  if (sections.length <= 1) {
    return (
      <div className="markdown-body prose prose-indigo prose-sm max-w-none">
        <ReactMarkdown
          components={{
            table: ({ children }) => <ProfessionalTable>{children}</ProfessionalTable>,
            thead: ({ children }) => <thead className="bg-gray-50/50">{children}</thead>,
            th: ({ children }) => <th className="px-6 py-4 text-[11px] font-bold text-indigo-600 uppercase tracking-widest text-left">{children}</th>,
            tr: ({ children }) => <tr className="group hover:bg-indigo-50/20 transition-colors border-b border-gray-100 last:border-0">{children}</tr>,
            td: ({ children }) => <td className="px-6 py-4 text-sm text-gray-700 font-medium">{children}</td>,
          }}
        >
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
              <ReactMarkdown>{section}</ReactMarkdown>
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
            <ReactMarkdown
              components={{
                table: ({ children }) => <ProfessionalTable>{children}</ProfessionalTable>,
                thead: ({ children }) => <thead className="bg-gray-50/50">{children}</thead>,
                th: ({ children }) => <th className="px-6 py-4 text-[11px] font-bold text-indigo-600 uppercase tracking-widest text-left">{children}</th>,
                tr: ({ children }) => <tr className="group hover:bg-indigo-50/20 transition-colors border-b border-gray-100 last:border-0">{children}</tr>,
                td: ({ children }) => <td className="px-6 py-4 text-sm text-gray-700 font-medium">{children}</td>,
              }}
            >
              {body}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
