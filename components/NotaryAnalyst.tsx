'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import CollapsibleMarkdown from './CollapsibleMarkdown';
import { 
  FileText, 
  Search, 
  Scale, 
  BookOpen, 
  Loader2,
  ChevronRight,
  Globe,
  ExternalLink,
  ShieldCheck,
  MapPin,
  Gavel,
  Copy,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';

const US_STATES = [
  { name: "Alabama", abbr: "AL" }, { name: "Alaska", abbr: "AK" }, { name: "Arizona", abbr: "AZ" }, 
  { name: "Arkansas", abbr: "AR" }, { name: "California", abbr: "CA" }, { name: "Colorado", abbr: "CO" }, 
  { name: "Connecticut", abbr: "CT" }, { name: "Delaware", abbr: "DE" }, { name: "Florida", abbr: "FL" }, 
  { name: "Georgia", abbr: "GA" }, { name: "Hawaii", abbr: "HI" }, { name: "Idaho", abbr: "ID" }, 
  { name: "Illinois", abbr: "IL" }, { name: "Indiana", abbr: "IN" }, { name: "Iowa", abbr: "IA" }, 
  { name: "Kansas", abbr: "KS" }, { name: "Kentucky", abbr: "KY" }, { name: "Louisiana", abbr: "LA" }, 
  { name: "Maine", abbr: "ME" }, { name: "Maryland", abbr: "MD" }, { name: "Massachusetts", abbr: "MA" }, 
  { name: "Michigan", abbr: "MI" }, { name: "Minnesota", abbr: "MN" }, { name: "Mississippi", abbr: "MS" }, 
  { name: "Missouri", abbr: "MO" }, { name: "Montana", abbr: "MT" }, { name: "Nebraska", abbr: "NE" }, 
  { name: "Nevada", abbr: "NV" }, { name: "New Hampshire", abbr: "NH" }, { name: "New Jersey", abbr: "NJ" }, 
  { name: "New Mexico", abbr: "NM" }, { name: "New York", abbr: "NY" }, { name: "North Carolina", abbr: "NC" }, 
  { name: "North Dakota", abbr: "ND" }, { name: "Ohio", abbr: "OH" }, { name: "Oklahoma", abbr: "OK" }, 
  { name: "Oregon", abbr: "OR" }, { name: "Pennsylvania", abbr: "PA" }, { name: "Rhode Island", abbr: "RI" }, 
  { name: "South Carolina", abbr: "SC" }, { name: "South Dakota", abbr: "SD" }, { name: "Tennessee", abbr: "TN" }, 
  { name: "Texas", abbr: "TX" }, { name: "Utah", abbr: "UT" }, { name: "Vermont", abbr: "VT" }, 
  { name: "Virginia", abbr: "VA" }, { name: "Washington", abbr: "WA" }, { name: "West Virginia", abbr: "WV" }, 
  { name: "Wisconsin", abbr: "WI" }, { name: "Wyoming", abbr: "WY" }
];

interface Source {
  uri: string;
  title: string;
  state?: string;
}

export default function NotaryAnalyst() {
  const [query, setQuery] = useState('');
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [overrideUrl, setOverrideUrl] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isQuerying, setIsQuerying] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  
  const suggestedQueries = [
    "What is the fee for an acknowledgment in Ohio?",
    "What are the ID requirements in California?",
    "How long must RON recordings be kept in Texas?",
    "Is an electronic journal mandatory in Florida?",
    "Can I charge for travel in New York?"
  ];

  const clearAll = () => {
    setQuery('');
    setSelectedStates([]);
    setOverrideUrl('');
    setUrlError(null);
    setAnswer(null);
    setSources([]);
  };

  const validateUrl = (url: string) => {
    if (!url) return true;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleQuery = async (overrideQuery?: string) => {
    const activeQuery = overrideQuery || query;
    if (!activeQuery.trim()) return;

    if (overrideUrl && !validateUrl(overrideUrl)) {
      setUrlError("Please enter a valid URL (e.g., https://example.gov)");
      return;
    }
    setUrlError(null);

    setIsQuerying(true);
    setAnswer(null);
    setSources([]);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not configured in environment variables.');
      }

      const { queryGemini } = await import('@/lib/gemini');
      const data = await queryGemini({
        query: activeQuery,
        selectedStates,
        overrideUrl: overrideUrl || undefined,
        apiKey,
      });

      setAnswer(data.answer || 'No answer generated.');

      const extractedSources: Source[] = (data.sources || []).map((source: { title: string; uri: string }) => {
        const title = source.title;
        const uri = source.uri;
        const foundState = US_STATES.find(state =>
          title.toLowerCase().includes(state.name.toLowerCase()) ||
          uri.toLowerCase().includes(state.name.toLowerCase().replace(' ', '')) ||
          uri.toLowerCase().includes(`/${state.abbr.toLowerCase()}/`) ||
          uri.toLowerCase().includes(`.${state.abbr.toLowerCase()}.gov`)
        );

        return {
          uri,
          title,
          state: foundState ? foundState.name : 'General / Federal',
        };
      });

      setSources(extractedSources);
    } catch (err: any) {
      console.error(err);
      setAnswer(err.message || 'Failed to retrieve answer. Please try again.');
    } finally {
      setIsQuerying(false);
    }
  };

  const toggleState = (stateName: string) => {
    setSelectedStates(prev => 
      prev.includes(stateName) 
        ? prev.filter(s => s !== stateName) 
        : [...prev, stateName]
    );
  };

  const filteredSuggestedQueries = selectedStates.length > 0 
    ? [
        `What is the fee for an acknowledgment in ${selectedStates[0]}?`,
        `What are the ID requirements in ${selectedStates[0]}?`,
        `How long must RON recordings be kept in ${selectedStates[0]}?`,
        `Is an electronic journal mandatory in ${selectedStates[0]}?`,
        `Can I charge for travel in ${selectedStates[0]}?`
      ]
    : suggestedQueries;

  const filteredSources = selectedStates.length > 0 
    ? sources.filter(s => selectedStates.includes(s.state || "") || s.state === "General / Federal")
    : sources;

  return (
    <div className="min-h-screen bg-[#fdfdfc] flex flex-col font-sans text-[#1a1a1a]">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <Scale size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-gray-900">FieldSeal</h1>
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Notary Law Command Center</p>
          </div>
        </div>
        
        <button 
          onClick={clearAll}
          className="text-[10px] font-bold uppercase text-gray-400 hover:text-indigo-600 transition-colors tracking-widest"
        >
          [ Reset Workspace ]
        </button>
      </header>

      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-4 md:p-12 gap-12">
        {/* Hero Section */}
        {!answer && !isQuerying && (
          <div className="py-12 text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-full text-indigo-600 text-xs font-bold uppercase tracking-widest">
              <Sparkles size={14} />
              Grounded in Official Statutes
            </div>
            <h2 className="text-5xl font-bold tracking-tight text-gray-900 leading-tight">
              Professional Notary <br />
              <span className="text-indigo-600">Statutory Guidance.</span>
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto text-lg leading-relaxed">
              Instant, verified answers for notaries in the field. Search across all 50 states with direct statutory citations.
            </p>
          </div>
        )}

        {/* Search Interface */}
        <div className="space-y-6">
          <div className="glass-card p-2 flex flex-col gap-2">
            {/* State Selector */}
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex-shrink-0 w-8 h-8 bg-white rounded-lg flex items-center justify-center text-indigo-600 shadow-sm">
                <MapPin size={16} />
              </div>
              <div className="flex-1 relative">
                <select 
                  value=""
                  onChange={(e) => {
                    if (e.target.value) toggleState(e.target.value);
                  }}
                  className="w-full bg-transparent py-2 pr-8 text-sm font-bold text-gray-900 focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="">Select US States...</option>
                  {US_STATES.filter(s => !selectedStates.includes(s.name)).map(state => (
                    <option key={state.abbr} value={state.name}>{state.name}</option>
                  ))}
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <ChevronRight size={14} className="rotate-90" />
                </div>
              </div>
              {selectedStates.length > 0 && (
                <div className="flex flex-wrap gap-1.5 max-w-[60%] overflow-hidden">
                  {selectedStates.map(state => (
                    <button
                      key={state}
                      onClick={() => toggleState(state)}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200 text-gray-700 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:border-red-200 hover:text-red-600 transition-all group"
                    >
                      {state}
                      <span className="opacity-30 group-hover:opacity-100">×</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Main Input */}
            <div className="relative group">
              <input 
                type="text"
                placeholder="Ask a notary law question..."
                className="w-full p-6 pr-16 bg-transparent text-xl font-medium focus:outline-none placeholder:text-gray-300"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
              />
              <button 
                onClick={() => handleQuery()}
                disabled={isQuerying || !query.trim()}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center disabled:opacity-20 transition-all hover:bg-indigo-700 active:scale-95 shadow-lg shadow-indigo-200"
              >
                {isQuerying ? <Loader2 size={20} className="animate-spin" /> : <ArrowRight size={20} />}
              </button>
            </div>

            {/* Legislative Override */}
            <div className="flex items-center gap-3 px-4 py-3 border-t border-gray-50">
              <Gavel size={14} className="text-gray-400" />
              <input 
                type="url"
                placeholder="Optional: Override with specific legislative URL (.gov)"
                className="flex-1 bg-transparent text-xs font-medium focus:outline-none placeholder:text-gray-300 text-gray-600"
                value={overrideUrl}
                onChange={(e) => {
                  setOverrideUrl(e.target.value);
                  if (urlError) setUrlError(null);
                }}
              />
              {urlError && <span className="text-[10px] font-bold text-red-500 uppercase">{urlError}</span>}
            </div>
          </div>

          {!answer && !isQuerying && (
            <div className="flex flex-wrap gap-2 justify-center animate-in fade-in duration-1000 delay-300">
              {filteredSuggestedQueries.map((q, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setQuery(q);
                    handleQuery(q);
                  }}
                  className="px-4 py-2 bg-white rounded-full border border-gray-100 text-xs font-bold text-gray-500 hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Results Area */}
        <div className="flex-1 space-y-12 pb-24">
          {isQuerying && (
            <div className="flex flex-col items-center justify-center py-20 gap-6">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-500/10 blur-2xl rounded-full animate-pulse"></div>
                <Loader2 size={48} className="animate-spin text-indigo-600 relative" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-lg font-bold text-gray-900">Analyzing Statutes</p>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-[0.2em]">Verifying current law for accuracy</p>
              </div>
            </div>
          )}

          {answer && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="glass-card p-10 space-y-8">
                <div className="flex items-center justify-between border-b border-gray-50 pb-6">
                  <div className="flex items-center gap-3 text-indigo-600">
                    <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                      <BookOpen size={16} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-[0.2em]">Statutory Guidance</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full text-[10px] font-bold text-emerald-600 uppercase tracking-widest border border-emerald-100">
                    <ShieldCheck size={12} />
                    Verified {new Date().toLocaleDateString()}
                  </div>
                </div>
                
                <div className="markdown-body">
                  <CollapsibleMarkdown content={answer} />
                </div>
              </div>

              {/* Sources Section */}
              {sources.length > 0 && (
                <div className="space-y-8">
                  <div className="flex items-center gap-4 px-4">
                    <div className="h-px flex-1 bg-gray-100"></div>
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">
                      Authoritative References
                    </h3>
                    <div className="h-px flex-1 bg-gray-100"></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredSources.map((source, i) => (
                      <a 
                        key={i}
                        href={source.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="glass-card p-5 flex items-start gap-4 hover:border-indigo-200 hover:shadow-md transition-all group"
                      >
                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                          <ExternalLink size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{source.state || 'General'}</span>
                          </div>
                          <p className="text-sm font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">{source.title}</p>
                          <p className="text-[10px] text-gray-400 font-mono truncate mt-1">{source.uri}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-8 px-6">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-gray-400">
            <Scale size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">FieldSeal © 2026</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-indigo-600 transition-colors">Statutes</a>
            <a href="#" className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-indigo-600 transition-colors">Compliance</a>
            <a href="#" className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-indigo-600 transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
