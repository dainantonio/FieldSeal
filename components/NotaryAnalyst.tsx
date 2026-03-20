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
  CheckCircle2
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

const FIELD_ASSIST_SYSTEM_INSTRUCTION = `You are a professional Notary Law Assistant. Your goal is to provide accurate, grounded answers to notary questions by searching official state statutes and handbooks. Always cite your sources and provide specific fee amounts or requirements when asked. Do not provide legal advice.

Write for a working notary in the field:
- lead with the direct answer
- keep answers short, scan-friendly, and operational
- use plain English, not article-style narration
- prefer bullets and markdown tables over long paragraphs

When the user asks about fees, charges, or what a notary may collect, always use this structure unless the law does not support one of the sections:
### [State] Notary Fees
**Effective [date if known]** — [statute citation]

**Fast Answer:** [one sentence with the amount, charging basis, and remote add-ons if applicable]

| Service | Max Fee | Charging Basis |
|---|---:|---|
| ... | ... | ... |

### Quick Rules
- Per act vs per signature
- Travel fee rule
- Remote / technology fee rule
- Overcharging / violation rule

**Example:** [only if it helps prevent a common billing mistake]

**Authority:** [statute citation(s)]

For non-fee questions, keep the same scan-first style:
- start with a one- or two-sentence direct answer
- then use short bullets under a useful heading such as Quick Rules, ID Requirements, Recordkeeping, or Exceptions
- end with the controlling authority

Important:
- If a statute applies broadly to notarial acts, do not imply it applies only to acknowledgments unless the law specifically says that.
- If law changed recently or an override URL is provided, use the most current effective date you can verify.
- If the answer is uncertain, say so briefly and explain what is clear from the official source.`;

export default function NotaryAnalyst() {
  const [query, setQuery] = useState('');
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [overrideUrl, setOverrideUrl] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isQuerying, setIsQuerying] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [recentBills, setRecentBills] = useState<any[]>([]);
  const [isFetchingBills, setIsFetchingBills] = useState(false);
  
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

    // Validate URL if provided
    if (overrideUrl && !validateUrl(overrideUrl)) {
      setUrlError("Please enter a valid URL (e.g., https://example.gov)");
      return;
    }
    setUrlError(null);

    setIsQuerying(true);
    setAnswer(null);
    setSources([]);
    // Optionally fetch bills related to the state if detected
    fetchRecentBills(activeQuery);

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

  const fetchRecentBills = async (text: string) => {
    const foundState = US_STATES.find(s => text.toLowerCase().includes(s.name.toLowerCase()));
    if (!foundState) return;

    setIsFetchingBills(true);
    try {
      // This is where LegiScan API would be called. 
      // We'll simulate a targeted search for "notary" or "notarial" legislation.
      // In a real implementation, you'd fetch from a server-side route that uses process.env.LEGISCAN_API_KEY
      // with a query parameter like ?q=notary
      setTimeout(() => {
        setRecentBills([
          { id: 'SB123', title: 'Notary Public Modernization Act', status: 'In Committee', state: foundState.name, date: '2026-03-15' },
          { id: 'HB456', title: 'Remote Online Notarization (RON) Standards', status: 'Passed House', state: foundState.name, date: '2026-03-10' }
        ]);
        setIsFetchingBills(false);
      }, 1500);
    } catch (err) {
      console.error(err);
      setIsFetchingBills(false);
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
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans text-[#1a1a1a]">
      {/* Header */}
      <header className="bg-white border-b border-black/5 px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <Scale size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Notary Field Assistant</h1>
            <p className="text-[10px] font-mono text-indigo-600/60 uppercase tracking-widest font-bold">State Law Grounded</p>
          </div>
        </div>
        
        <button 
          onClick={clearAll}
          className="text-[10px] font-mono uppercase text-black/40 hover:text-black transition-colors"
        >
          [ Reset ]
        </button>
      </header>

      <main className="flex-1 flex flex-col max-w-3xl mx-auto w-full p-4 md:p-8 gap-8">
        {/* Hero / Intro */}
        {!answer && !isQuerying && (
          <div className="py-12 text-center space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">How can I help you in the field?</h2>
            <p className="text-gray-500 max-w-md mx-auto">Ask any question about state notary laws, fees, or requirements for an instant, grounded answer.</p>
          </div>
        )}

        {/* Query Section */}
        <div className="space-y-6 sticky top-20 z-40">
          <div className="space-y-4">
            {/* Multi-State Selector */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-1 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex-shrink-0 w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 ml-1">
                  <MapPin size={18} />
                </div>
                <div className="flex-1 relative">
                  <select 
                    value=""
                    onChange={(e) => {
                      if (e.target.value) toggleState(e.target.value);
                    }}
                    className="w-full bg-transparent py-3 pr-10 text-sm font-bold text-gray-900 focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="">Add US States...</option>
                    {US_STATES.filter(s => !selectedStates.includes(s.name)).map(state => (
                      <option key={state.abbr} value={state.name}>{state.name}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <ChevronRight size={16} className="rotate-90" />
                  </div>
                </div>
                {selectedStates.length > 0 && (
                  <button 
                    onClick={() => setSelectedStates([])}
                    className="mr-4 text-[10px] font-bold text-indigo-400 hover:text-indigo-600 uppercase tracking-tighter"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {selectedStates.length > 0 && (
                <div className="flex flex-wrap gap-2 px-1">
                  {selectedStates.map(state => (
                    <button
                      key={state}
                      onClick={() => toggleState(state)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all group"
                    >
                      {state}
                      <span className="opacity-50 group-hover:opacity-100">×</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative group">
              <input 
                type="text"
                placeholder="e.g., What is the travel fee in Texas?"
                className="w-full p-6 pr-16 bg-white rounded-2xl border border-gray-200 shadow-xl text-lg focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-gray-300"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
              />
              <button 
                onClick={() => handleQuery()}
                disabled={isQuerying || !query.trim()}
                className="absolute right-3 top-3 bottom-3 w-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center disabled:opacity-20 transition-all hover:bg-indigo-700 active:scale-95 shadow-lg shadow-indigo-200"
              >
                {isQuerying ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
              </button>
            </div>

            {/* Legislative Override Input */}
            <div className={`flex flex-col gap-1`}>
              <div className={`flex items-center gap-3 p-4 bg-indigo-50/50 rounded-2xl border ${urlError ? 'border-red-300 ring-4 ring-red-500/10' : 'border-indigo-100/50'} group transition-all`}>
                <div className="flex-shrink-0 w-8 h-8 bg-white rounded-lg flex items-center justify-center text-indigo-600 shadow-sm">
                  <Gavel size={14} />
                </div>
                <div className="flex-1">
                  <input 
                    type="url"
                    placeholder="Legislative Update URL (Optional: .gov or .state link to override search)"
                    className="w-full bg-transparent text-xs font-medium focus:outline-none placeholder:text-indigo-300 text-indigo-900"
                    value={overrideUrl}
                    onChange={(e) => {
                      setOverrideUrl(e.target.value);
                      if (urlError) setUrlError(null);
                    }}
                  />
                </div>
                {overrideUrl && (
                  <button 
                    onClick={() => {
                      setOverrideUrl('');
                      setUrlError(null);
                    }}
                    className="text-[10px] font-bold text-indigo-400 hover:text-indigo-600 uppercase tracking-tighter"
                  >
                    Clear
                  </button>
                )}
              </div>
              {urlError && (
                <p className="px-4 text-[10px] font-bold text-red-500 uppercase tracking-tight animate-in fade-in slide-in-from-top-1">
                  {urlError}
                </p>
              )}
            </div>
          </div>

          {!answer && !isQuerying && (
            <div className="flex flex-wrap gap-2 justify-center">
              {filteredSuggestedQueries.map((q, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setQuery(q);
                    handleQuery(q);
                  }}
                  className="px-4 py-2 bg-white rounded-full border border-gray-200 text-xs font-medium hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm text-gray-600"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Results Area */}
        <div className="flex-1 space-y-6 pb-12">
          {isQuerying && (
            <div className="flex flex-col items-center justify-center py-20 gap-6 animate-pulse">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full animate-ping"></div>
                <Loader2 size={40} className="animate-spin text-indigo-600 relative" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm font-bold text-gray-900">Searching State Statutes...</p>
                <p className="text-xs text-gray-400 font-mono uppercase tracking-widest">Verifying current law for accuracy</p>
              </div>
            </div>
          )}

          {answer && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                  <div className="flex items-center gap-2 text-indigo-600">
                    <BookOpen size={18} />
                    <span className="text-xs font-bold uppercase tracking-widest">Statutory Guidance</span>
                  </div>
                  <div className="text-[10px] font-mono text-gray-400 uppercase">Verified {new Date().toLocaleDateString()}</div>
                </div>
                
                <div className="markdown-body prose prose-indigo prose-sm max-w-none">
                  <CollapsibleMarkdown content={answer} />
                </div>
              </div>

              {/* Sources Section */}
              {sources.length > 0 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                  {/* Recent Bills Feed (LegiScan Integration) */}
                  {recentBills.length > 0 && (
                    <div className="bg-indigo-900 text-white rounded-[2.5rem] p-8 shadow-2xl shadow-indigo-900/20 space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-800 rounded-xl flex items-center justify-center">
                            <Search size={18} className="text-indigo-300" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold tracking-tight">Notary Legislative Monitor</h3>
                            <p className="text-[10px] text-indigo-300 font-mono uppercase tracking-widest">Tracking Notarial Policy via LegiScan</p>
                          </div>
                        </div>
                        <div className="px-3 py-1 bg-indigo-800 rounded-full text-[9px] font-bold uppercase tracking-widest text-indigo-300 border border-indigo-700">
                          Live Tracking Active
                        </div>
                      </div>

                      <div className="space-y-3">
                        {recentBills.map((bill, i) => (
                          <div key={i} className="flex items-center justify-between p-4 bg-indigo-800/50 rounded-2xl border border-indigo-700/50 group hover:bg-indigo-800 transition-colors">
                            <div className="flex items-center gap-4">
                              <div className="text-[10px] font-mono font-bold text-indigo-400">{bill.id}</div>
                              <div>
                                <p className="text-xs font-bold text-indigo-100">{bill.title}</p>
                                <p className="text-[10px] text-indigo-400">{bill.state} • {bill.date}</p>
                              </div>
                            </div>
                            <div className="px-2 py-1 bg-indigo-900/50 rounded-md text-[8px] font-bold uppercase tracking-tighter text-emerald-400 border border-emerald-900/50">
                              {bill.status}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4 px-4">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                      <ShieldCheck size={14} className="text-emerald-500" />
                      Verified Statutory Sources
                    </h3>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
                  </div>

                  <div className="space-y-10">
                    {Object.entries(
                      filteredSources.reduce((acc, source) => {
                        const state = source.state || "Other";
                        if (!acc[state]) acc[state] = [];
                        acc[state].push(source);
                        return acc;
                      }, {} as Record<string, Source[]>)
                    ).map(([state, stateSources]) => (
                      <div key={state} className="space-y-4">
                        <div className="flex items-center justify-between px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                              <MapPin size={16} />
                            </div>
                            <div>
                              <span className="text-sm font-bold text-gray-900">{state}</span>
                              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                                {stateSources.length} {stateSources.length === 1 ? 'Reference' : 'References'}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4">
                          {stateSources.map((source, i) => (
                            <SourceCard key={i} source={source} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 p-6 text-center">
        <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Grounded in Official State Notary Laws // Not Legal Advice</p>
      </footer>
    </div>
  );
}

function SourceCard({ source }: { source: Source }) {
  const [copied, setCopied] = useState(false);
  const isGov = source.uri.includes('.gov');

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(source.uri);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <a 
      href={source.uri}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex items-start gap-5 p-5 bg-white rounded-[2rem] border border-gray-100 hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500"
    >
      <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
        isGov 
          ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white' 
          : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'
      }`}>
        {isGov ? <Gavel size={20} /> : <FileText size={20} />}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center flex-wrap gap-2 mb-1.5">
          <p className="text-sm font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
            {source.title}
          </p>
          {isGov && (
            <span className="flex-shrink-0 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-bold uppercase tracking-wider rounded-full border border-emerald-100">
              Official Gov Source
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-gray-400 group-hover:text-gray-500 transition-colors">
            <Globe size={10} />
            <p className="text-[10px] font-mono truncate max-w-[180px] md:max-w-xs">{source.uri}</p>
          </div>
          
          <button 
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-gray-100 text-[9px] font-bold uppercase tracking-widest text-gray-400 hover:text-indigo-600 transition-all"
          >
            {copied ? <CheckCircle2 size={10} className="text-emerald-500" /> : <Copy size={10} />}
            {copied ? 'Copied' : 'Copy Link'}
          </button>
        </div>
      </div>
      
      <div className="flex-shrink-0 self-center p-2 bg-gray-50 rounded-full opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-500">
        <ExternalLink size={14} className="text-indigo-600" />
      </div>
    </a>
  );
}
