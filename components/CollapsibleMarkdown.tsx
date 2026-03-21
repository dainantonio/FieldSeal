'use client';

import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChevronDown, ChevronRight } from 'lucide-react';
import ProfessionalTable, { TableHeader, TableRow, TableHead, TableCell } from './ProfessionalTable';

interface CollapsibleMarkdownProps {
  content: string;
}

/**
 * Robustly pre-processes markdown to fix table rendering issues.
 * This is more aggressive than previous versions:
 * 1. Fixes double pipes (||)
 * 2. Ensures table headers have a separator row if missing
 * 3. Adds required empty lines before and after table blocks
 */
const robustPreprocess = (text: string): string => {
  if (!text) return text;
  
  const lines = text.split('\n');
  const processedLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    
    // Fix double pipes
    if (line.includes('|')) {
      line = line.replace(/\|\|/g, '|');
      
      // Ensure row starts and ends with a pipe
      if (line.includes('|')) {
        if (!line.startsWith('|')) line = '| ' + line;
        if (!line.endsWith('|')) line = line + ' |';
      }
      
      // If this is a header row and the next row isn't a separator, inject one
      const isHeaderCandidate = line.includes('|') && !line.includes('---');
      const nextLine = lines[i + 1]?.trim() || '';
      const isNextSeparator = nextLine.includes('|') && nextLine.includes('---');
      
      processedLines.push(line);
      
      if (isHeaderCandidate && !isNextSeparator && nextLine.includes('|')) {
        // Create a separator based on column count
        const colCount = (line.match(/\|/g) || []).length - 1;
        const separator = '|' + Array(colCount).fill(' --- |').join('');
        processedLines.push(separator);
      }
    } else {
      processedLines.push(lines[i]);
    }
  }
  
  // Join and ensure empty lines around table blocks (lines starting with |)
  let result = '';
  for (let i = 0; i < processedLines.length; i++) {
    const curr = processedLines[i];
    const prev = processedLines[i - 1];
    
    if (curr.trim().startsWith('|') && prev && !prev.trim().startsWith('|') && prev.trim() !== '') {
      result += '\n';
    }
    result += curr + '\n';
    const next = processedLines[i + 1];
    if (curr.trim().startsWith('|') && next && !next.trim().startsWith('|') && next.trim() !== '') {
      result += '\n';
    }
  }
  
  return result;
};

// Define markdown components outside to avoid scope issues
const getMarkdownComponents = () => ({
  table: ({ children }: any) => <ProfessionalTable>{children}</ProfessionalTable>,
  thead: ({ children }: any) => <TableHeader>{children}</TableHeader>,
  tbody: ({ children }: any) => <tbody>{children}</tbody>,
  th: ({ children }: any) => {
    const text = String(children).toLowerCase();
    const isPrice = text.includes('fee') || text.includes('rate') || text.includes('price') || text.includes('amount');
    return <TableHead>{children}</TableHead>;
  },
  tr: ({ children }: any) => <TableRow>{children}</TableRow>,
  td: ({ children }: any) => {
    const content = String(children).trim();
    const isPrice = content.startsWith('$') || /^\d+\.\d{2}$/.test(content);
    return <TableCell isPrice={isPrice}>{children}</TableCell>;
  },
});

export default function CollapsibleMarkdown({ content }: CollapsibleMarkdownProps) {
  const processedContent = useMemo(() => robustPreprocess(content), [content]);
  const sections = useMemo(() => processedContent.split(/(?=### )/g), [processedContent]);
  const markdownComponents = useMemo(() => getMarkdownComponents(), []);

  if (sections.length <= 1) {
    return (
      <div className="markdown-body prose prose-indigo prose-sm max-w-none">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]} 
          components={markdownComponents}
        >
          {processedContent}
        </ReactMarkdown>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sections.map((section, index) => {
        if (index === 0 && !section.startsWith('### ')) {
          return (
            <div key={index} className="markdown-body prose prose-indigo prose-sm max-w-none mb-6">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]} 
                components={markdownComponents}
              >
                {section}
              </ReactMarkdown>
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
  const markdownComponents = useMemo(() => getMarkdownComponents(), []);
  
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
              remarkPlugins={[remarkGfm]} 
              components={markdownComponents}
            >
              {body}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
