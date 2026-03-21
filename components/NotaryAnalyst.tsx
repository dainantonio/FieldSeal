'use client';

import React, { useState } from 'react';
import CollapsibleMarkdown from './CollapsibleMarkdown';
import { 
  FileText, 
  Scale, 
  BookOpen, 
  Loader2,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  MapPin,
  ArrowRight,
  Lock,
  Sparkles,
  X
} from 'lucide-react';
import { motion } from 'framer-motion';

const US_STATES = [
  { name: "Alabama", abbr: "AL" }, { name: "Alaska", abbr: "AK" }, { name: "Arizona", abbr: "AZ" }, 
  { name: "Arkansas", abbr: "AR" }, { name: "California", abbr: "CA" }, { name: "Colorado", abbr: "CO" }, 
  { name: "Connecticut", abbr: "CT" }, { name: "Delaware", abbr: "DE" }, { name: "District of Columbia", abbr: "DC" }, { name: "Florida", abbr: "FL" }, 
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
  const [showUrlInput, setShowUrlInput] = useState(false);
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
    setShowUrlInput(false);
  };

  const validateUrl = (url: string) => {
    if (!url) return true;
    try { new URL(url); return true; } catch { return false; }
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
      if (!apiKey) throw new Error('GEMINI_API_KEY is not configured in environment variables.');

      const { queryGemini } = await import('@/lib/gemini');
      const data = await queryGemini({ query: activeQuery, selectedStates, overrideUrl: overrideUrl || undefined, apiKey });

      setAnswer(data.answer || 'No answer generated.');

      const extractedSources: Source[] = (data.sources || []).map((source: { title: string; uri: string }) => {
        const foundState = US_STATES.find(state =>
          source.title.toLowerCase().includes(state.name.toLowerCase()) ||
          source.uri.toLowerCase().includes(state.name.toLowerCase().replace(' ', '')) ||
          source.uri.toLowerCase().includes(`/${state.abbr.toLowerCase()}/`) ||
          source.uri.toLowerCase().includes(`.${state.abbr.toLowerCase()}.gov`)
        );
        return { uri: source.uri, title: source.title, state: foundState ? foundState.name : 'General / Federal' };
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
      prev.includes(stateName) ? prev.filter(s => s !== stateName) : [...prev, stateName]
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
    <div className="min-h-screen bg-gradient-to-br from-[#fafaf8] via-[#fcfbf9] to-[#f8f7f5] flex flex-col font-sans text-[#0f0f0f]">
      
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-white/40 backdrop-blur-md bg-white/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
          <motion.div 
            className="flex items-center gap-2 sm:gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center text-white shadow-lg flex-shrink-0">
              <Scale size={18} strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-gray-900">FieldSeal</h1>
              <p className="text-[10px] sm:text-xs font-bold text-blue-600 uppercase tracking-widest leading-tight">
                Notary Law Command Center
              </p>
            </div>
          </motion.div>
          
          {(answer || query || selectedStates.length > 0) && (
            <motion.button 
              onClick={clearAll}
              className="text-xs font-bold uppercase text-gray-400 hover:text-blue-600 transition-colors tracking-widest px-3 py-2 rounded-lg hover:bg-white/50 min-h-[44px] flex items-center"
              whileTap={{ scale: 0.95 }}
            >
              Reset
            </motion.button>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10 md:py-16 gap-8 sm:gap-12">

        {/* ── Hero ── */}
        {!answer && !isQuerying && (
          <motion.div 
            className="py-6 sm:py-10 text-center space-y-4 sm:space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div 
              className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-50 rounded-full text-blue-600 text-[10px] sm:text-xs font-bold uppercase tracking-widest border border-blue-100"
              whileHover={{ scale: 1.05 }}
            >
              <Sparkles size={12} />
              Grounded in Official Statutes
            </motion.div>

            <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-gray-900 leading-tight">
              Professional Notary{' '}
              <span className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                Statutory Guidance
              </span>
            </h2>

            <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed font-light px-2">
              Instant, verified answers for notaries in the field. Search across all 50 states with direct statutory citations.
            </p>
          </motion.div>
        )}

        {/* ── Search Interface ── */}
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="glass-card p-1 flex flex-col gap-1 border border-white/50">
            
            {/* State selector row */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-2 p-3 sm:p-4 bg-white/40 rounded-xl border border-white/30">
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 flex-shrink-0">
                  <MapPin size={16} strokeWidth={1.5} />
                </div>
                <div className="flex-1 sm:flex-none relative min-w-0">
                  <select 
                    value=""
                    onChange={(e) => { if (e.target.value) toggleState(e.target.value); }}
                    className="w-full sm:w-auto bg-transparent py-2 pl-1 pr-8 text-sm font-semibold text-gray-900 focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="">Select a state…</option>
                    {US_STATES.filter(s => !selectedStates.includes(s.name)).map(state => (
                      <option key={state.abbr} value={state.name}>{state.name} ({state.abbr})</option>
                    ))}
                  </select>
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <ChevronRight size={14} className="rotate-90" />
                  </div>
                </div>
              </div>

              {/* Selected state chips */}
              {selectedStates.length > 0 && (
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {selectedStates.map(state => (
                    <motion.button
                      key={state}
                      onClick={() => toggleState(state)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-blue-100 transition-all min-h-[36px]"
                      whileTap={{ scale: 0.95 }}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                    >
                      {state}
                      <X size={12} className="opacity-60" />
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            {/* Main query input */}
            <div className="relative group">
              <textarea
                placeholder="Ask a notary law question…"
                rows={2}
                className="w-full px-4 py-4 pr-16 bg-transparent text-base sm:text-lg font-medium focus:outline-none placeholder:text-gray-300 resize-none leading-snug"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleQuery();
                  }
                }}
              />
              <motion.button 
                onClick={() => handleQuery()}
                disabled={isQuerying || !query.trim()}
                className="absolute right-3 top-3 w-11 h-11 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl flex items-center justify-center disabled:opacity-30 transition-all hover:shadow-lg active:scale-95"
                whileTap={{ scale: 0.95 }}
                aria-label="Submit query"
              >
                {isQuerying 
                  ? <Loader2 size={18} className="animate-spin" /> 
                  : <ArrowRight size={18} />
                }
              </motion.button>
            </div>

            {/* Legislative URL override — collapsed by default on mobile */}
            <div className="border-t border-white/20">
              {!showUrlInput ? (
                <button
                  onClick={() => setShowUrlInput(true)}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Lock size={13} />
                  <span>Add specific legislative URL (optional)</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 px-4 py-3">
                  <Lock size={14} className="text-gray-400 flex-shrink-0" />
                  <input 
                    type="url"
                    placeholder="https://legislature.state.gov/statute/..."
                    className="flex-1 bg-transparent text-xs font-medium focus:outline-none placeholder:text-gray-300 text-gray-600 min-w-0"
                    value={overrideUrl}
                    onChange={(e) => {
                      setOverrideUrl(e.target.value);
                      if (urlError) setUrlError(null);
                    }}
                    autoFocus
                  />
                  <button onClick={() => { setShowUrlInput(false); setOverrideUrl(''); }} className="text-gray-400 hover:text-gray-600 flex-shrink-0 p-1">
                    <X size={14} />
                  </button>
                </div>
              )}
              {urlError && (
                <p className="px-4 pb-2 text-xs font-bold text-red-500">{urlError}</p>
              )}
            </div>
          </div>

          {/* Suggested queries */}
          {!answer && !isQuerying && (
            <motion.div 
              className="flex flex-wrap gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {filteredSuggestedQueries.map((q, i) => (
                <motion.button
                  key={i}
                  onClick={() => { setQuery(q); handleQuery(q); }}
                  className="px-3 py-2 sm:px-4 sm:py-2.5 bg-white rounded-full border border-gray-200 text-xs font-semibold text-gray-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm text-left min-h-[40px]"
                  whileTap={{ scale: 0.97 }}
                >
                  {q}
                </motion.button>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* ── Results ── */}
        <div className="flex-1 space-y-10 pb-16">

          {/* Loading state */}
          {isQuerying && (
            <motion.div 
              className="flex flex-col items-center justify-center py-16 sm:py-24 gap-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full" />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 size={40} className="text-blue-600 relative" />
                </motion.div>
              </div>
              <div className="text-center space-y-1">
                <p className="text-base sm:text-lg font-bold text-gray-900">Analyzing Statutes</p>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Verifying current law for accuracy</p>
              </div>
            </motion.div>
          )}

          {/* Answer */}
          {answer && (
            <motion.div 
              className="space-y-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="glass-card p-5 sm:p-8 md:p-10 space-y-6 border border-white/50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 pb-5">
                  <div className="flex items-center gap-2.5 text-blue-600">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BookOpen size={14} strokeWidth={1.5} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest">Statutory Guidance</span>
                  </div>
                  <motion.div 
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-full text-xs font-bold text-emerald-600 uppercase tracking-widest border border-emerald-100 self-start sm:self-auto"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                  >
                    <ShieldCheck size={11} />
                    Verified {new Date().toLocaleDateString()}
                  </motion.div>
                </div>

                <div className="markdown-body overflow-x-auto">
                  <CollapsibleMarkdown content={answer} />
                </div>
              </div>

              {/* Sources */}
              {filteredSources.length > 0 && (
                <motion.div 
                  className="space-y-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center gap-4 px-2">
                    <div className="h-px flex-1 bg-gray-200" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 whitespace-nowrap">
                      Authoritative References
                    </h3>
                    <div className="h-px flex-1 bg-gray-200" />
                  </div>

                  {/* Sources grid: 1 col mobile, 2 col md+ */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {filteredSources.map((source, i) => (
                      <motion.a 
                        key={i}
                        href={source.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="glass-card p-4 sm:p-5 flex items-start gap-3 sm:gap-4 hover:border-blue-200 hover:shadow-lg transition-all group border border-white/50 min-h-[76px]"
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition-colors flex-shrink-0">
                          <ExternalLink size={16} strokeWidth={1.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="mb-0.5">
                            <span className="text-[10px] sm:text-xs font-bold text-blue-600 uppercase tracking-widest">
                              {source.state || 'General'}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors leading-snug">
                            {source.title}
                          </p>
                          <p className="text-xs text-gray-400 font-mono truncate mt-0.5">{source.uri}</p>
                        </div>
                      </motion.a>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-white/40 bg-white/30 backdrop-blur-md py-6 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-gray-500">
            <Scale size={13} strokeWidth={1.5} />
            <span className="text-xs font-bold uppercase tracking-widest">FieldSeal © 2026</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-blue-600 transition-colors min-h-[44px] flex items-center">Statutes</a>
            <a href="#" className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-blue-600 transition-colors min-h-[44px] flex items-center">Compliance</a>
            <a href="#" className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-blue-600 transition-colors min-h-[44px] flex items-center">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
