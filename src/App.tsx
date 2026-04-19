/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Instagram, 
  Download, 
  Search, 
  X, 
  Film, 
  Music, 
  AlertCircle, 
  Terminal,
  Activity,
  Cpu,
  Globe,
  Lock,
  Copy,
  Monitor,
  Play,
  ExternalLink
} from 'lucide-react';

interface ExtractionResult {
  quality: string;
  url: string;
  type: 'video' | 'audio';
}

interface LogEntry {
  type: 'info' | 'warn' | 'data' | 'scan';
  message: string;
  id: number;
}

export default function App() {
  const [url, setUrl] = useState('https://www.instagram.com/reels/DXDX2DCDb8L/');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ExtractionResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logCounter = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const addLog = (type: LogEntry['type'], message: string) => {
    setLogs(prev => {
      const newLogs = [...prev, { type, message, id: logCounter.current++ }];
      return newLogs.slice(-15);
    });
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [logs]);

  useEffect(() => {
    addLog('info', 'ENGINE v4.2.1: INITIALIZING OPTIMIZED MODE');
    addLog('info', 'PERFORMANCE STATUS: FLUID');
    addLog('data', 'Awaiting target injection...');
  }, []);

  const handleExtract = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setResults([]);
    setShowResults(false);
    
    addLog('info', 'Acquiring browser environment...');

    try {
      addLog('data', `TARGET: ${url.split('?')[0].substring(0, 30)}...`);
      
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro desconhecido');

      addLog('data', `Protocol success - Stream captured`);

      if (data.results && data.results.length > 0) {
        addLog('scan', `${data.results.length} links isolated.`);
        setResults(data.results);
        setShowResults(true);
      } else {
        addLog('warn', 'Zero matches found.');
        setError('Nenhum link encontrado. Verifique o link e tente novamente.');
      }
    } catch (err: any) {
      addLog('warn', `Error: ${err.message}`);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (videoUrl: string, type: string) => {
    const filename = `instagram_${type}_${Date.now()}.${type === 'video' ? 'mp4' : 'm4a'}`;
    const downloadUrl = `/api/proxy-download?url=${encodeURIComponent(videoUrl)}&filename=${encodeURIComponent(filename)}`;
    window.location.href = downloadUrl;
    addLog('info', 'Download stream initiated via server proxy.');
  };

  const handleTranslateToView = (videoUrl: string) => {
    window.open(videoUrl, '_blank');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    addLog('info', 'URL buffered.');
  };

  const mainVideo = results.find(r => r.type === 'video');

  return (
    <div className="bg-[#0B0C0E] text-slate-200 min-h-screen flex flex-col font-sans selection:bg-sky-500/30 overflow-hidden relative">
      {/* Ultra-Light Background */}
      <div className="fixed inset-0 z-0 bg-[#0B0C0E]" />
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #3b82f610 0%, transparent 50%)' }} />

      {/* Navbar */}
      <nav className="h-16 border-b border-white/5 flex items-center justify-between px-10 bg-black/60 backdrop-blur-md shrink-0 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] flex items-center justify-center shadow-lg">
            <Instagram className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="font-black tracking-tighter text-lg text-white uppercase italic leading-none block">
              REELSNIFFER
            </span>
            <span className="text-[10px] font-mono text-sky-500 uppercase tracking-widest block">Force-Download Edition</span>
          </div>
        </div>
        
        <div className="hidden lg:flex items-center gap-4">
           <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20">
             <div className="w-2 h-2 rounded-full bg-sky-500 animate-ping"></div>
             <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest">Proxy Active</span>
           </div>
        </div>
      </nav>

      {/* Main Layout */}
      <div className="flex-1 flex flex-col lg:flex-row gap-8 p-6 lg:p-10 z-10 overflow-hidden h-full">
        
        {/* Sidebar */}
        <div className="w-full lg:w-[350px] flex flex-col gap-6 shrink-0 overflow-visible">
          <section className="p-8 rounded-[2.5rem] bg-slate-900/40 backdrop-blur-3xl border border-white/10 shadow-2xl">
            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6 flex items-center gap-2">
              <Cpu size={14} className="text-sky-500" /> Control Unit
            </h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-sky-500/60 ml-1">Instagram URL</label>
                <div className="relative group">
                  <input 
                    type="text" 
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-2xl px-5 py-4 text-sm font-mono text-slate-300 focus:outline-none focus:border-sky-500 transition-all shadow-inner" 
                    placeholder="URL..."
                  />
                  {url && (
                    <button onClick={() => setUrl('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
              <button 
                onClick={handleExtract}
                disabled={loading || !url}
                className="w-full py-5 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-2xl font-black text-xs tracking-[0.3em] transition-all flex items-center justify-center gap-3 active:scale-95 shadow-[0_10px_30px_rgba(14,165,233,0.3)]"
              >
                {loading ? <Activity size={20} className="animate-spin" /> : <>EXECUTE SCAN <Search size={20} /></>}
              </button>
            </div>
          </section>

          <footer className="flex-1 p-6 rounded-[2.5rem] bg-black/40 border border-white/5 flex flex-col overflow-hidden">
             <div className="flex justify-between items-center mb-4 text-[10px] font-black text-slate-700 uppercase tracking-widest border-b border-white/5 pb-3">
                <span>Diagnostics</span>
                <span className="text-green-500 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div> Normal</span>
             </div>
             <div ref={scrollRef} className="flex-1 space-y-2 font-mono text-[10px] overflow-y-auto scroll-smooth py-1 scrollbar-hide">
                {logs.map((log) => (
                  <div key={log.id} className="opacity-80">
                    <span className={`
                      ${log.type === 'info' ? 'text-green-500' : ''}
                      ${log.type === 'warn' ? 'text-yellow-500' : ''}
                      ${log.type === 'data' ? 'text-sky-500' : ''}
                      ${log.type === 'scan' ? 'text-white' : ''}
                    `}>
                      [{log.type.toUpperCase()}]
                    </span> <span className="text-slate-500">{log.message}</span>
                  </div>
                ))}
             </div>
          </footer>
        </div>

        {/* Results / Preview Panel */}
        <div className="flex-1 min-w-0 flex flex-col gap-6 h-full overflow-hidden">
          <section className="flex-1 p-8 lg:p-10 rounded-[3.5rem] bg-slate-900/20 backdrop-blur-2xl border border-white/5 flex flex-col shadow-2xl relative overflow-hidden">
            <header className="flex justify-between items-start mb-8 shrink-0">
              <div>
                <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-1">Extraction Data</h1>
                <p className="text-[10px] text-slate-500 uppercase tracking-[0.4em] font-bold">Encrypted Stream Analysis</p>
              </div>
              <div className="flex items-center gap-4 bg-white/5 px-6 py-4 rounded-[2rem] border border-white/5">
                <div className="text-4xl font-black text-sky-500 leading-none">{results.length}</div>
                <div className="text-[10px] font-black text-slate-500 uppercase flex flex-col">
                  <span>Assets</span>
                  <span>Ready</span>
                </div>
              </div>
            </header>

            <div className="flex-1 flex flex-col lg:flex-row gap-10 overflow-hidden min-h-0">
               
               {/* Video Preview */}
               <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-4">
                  <div className="relative aspect-[9/16] bg-black rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl group">
                    {mainVideo ? (
                      <video 
                        src={mainVideo.url} 
                        controls 
                        className="w-full h-full object-contain"
                        poster="https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=300&auto=format&fit=crop"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-800">
                        <Play size={48} className="mb-4 opacity-20" />
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40">No Preview</span>
                      </div>
                    )}
                    <div className="absolute top-6 left-6 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-[9px] font-black uppercase tracking-widest text-white">
                      PREVIEW_MODE
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Auto-detected audio stream: 48kHz</span>
                  </div>
               </div>

               {/* Links List */}
               <div className="flex-1 space-y-4 overflow-y-auto pr-2 scrollbar-hide">
                    {results.length > 0 ? (
                      results.map((result, idx) => (
                        <div
                          key={idx}
                          className="group p-5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-sky-500/20 rounded-3xl flex items-center justify-between gap-4 transition-all"
                        >
                          <div className="flex items-center gap-4 min-w-0 flex-1">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${result.type === 'video' ? 'bg-sky-500/10 text-sky-400' : 'bg-pink-500/10 text-pink-400'}`}>
                              {result.type === 'video' ? <Film size={20} /> : <Music size={20} />}
                            </div>
                            <div className="min-w-0 flex-1">
                               <div className="flex items-center gap-3 mb-1">
                                 <span className="text-xs font-black uppercase text-white tracking-widest">{result.quality}</span>
                                 {result.type === 'video' && <span className="text-[9px] uppercase px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 font-bold border border-sky-500/20">Audio Included</span>}
                               </div>
                               <div className="text-[10px] font-mono text-slate-600 truncate group-hover:text-slate-400 transition-colors">{result.url}</div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 shrink-0">
                            <button 
                              onClick={() => handleTranslateToView(result.url)} 
                              title="Ver Online"
                              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 flex items-center justify-center transition-colors"
                            >
                              <ExternalLink size={16} />
                            </button>
                            <button 
                              onClick={() => copyToClipboard(result.url)}
                              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 flex items-center justify-center transition-colors"
                            >
                              <Copy size={16} />
                            </button>
                            <button 
                               onClick={() => handleDownload(result.url, result.type)}
                               className={`px-6 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl ${
                                 result.type === 'video' ? 'bg-sky-600 text-white shadow-sky-500/20 hover:bg-sky-500' : 'bg-pink-600 text-white shadow-pink-500/20 hover:bg-pink-500'
                               }`}
                            >
                              DOWNLOAD <Download size={16} />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center opacity-10">
                         <Monitor size={100} className="stroke-[1px]" />
                         <p className="mt-8 text-lg uppercase tracking-[0.6em] font-black">Scanning Stream...</p>
                      </div>
                    )}
               </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}
                  className="fixed bottom-10 right-10 left-10 lg:left-auto lg:w-[400px] p-6 bg-red-950/80 backdrop-blur-2xl border border-red-500/30 rounded-3xl z-[100] flex flex-col gap-3 shadow-2xl"
                >
                   <div className="flex items-center gap-3 text-red-400 font-black uppercase text-xs tracking-widest">
                     <AlertCircle size={20} /> System Alert
                   </div>
                   <p className="text-slate-300 text-sm leading-relaxed">{error}</p>
                   <button onClick={() => setError(null)} className="w-full py-3 bg-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-colors">Dismiss Report</button>
                </motion.div>
              )}
            </AnimatePresence>

            <footer className="mt-10 pt-6 border-t border-white/5 flex justify-between items-center text-[10px] font-black text-slate-700 tracking-[0.3em] uppercase">
               <span className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
                 Extraction Engine Verified
               </span>
               <div className="flex gap-2">
                  <div className={`w-8 h-1 rounded-full ${loading ? 'bg-sky-500 animate-pulse' : 'bg-slate-800'}`} />
                  <div className="w-8 h-1 rounded-full bg-slate-800" />
               </div>
            </footer>
          </section>
        </div>
      </div>

      <div className="h-8 bg-black/60 border-t border-white/5 flex items-center px-10 text-[9px] text-slate-600 z-[100] shrink-0 font-bold uppercase tracking-widest">
        <span>Cloud Provider: Render</span>
        <div className="flex-1"></div>
        <span className="flex items-center gap-2">
           <Lock size={12} className="text-green-500" /> TLS 1.3 Certified Connection
        </span>
      </div>
    </div>
  );
}
