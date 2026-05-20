import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, TrendingUp, TrendingDown, AlertCircle, 
  X, Play, Volume2, ShieldCheck, Zap 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DataStats } from '@/lib/data-processor';

interface ExecutiveBriefingProps {
  isOpen: boolean;
  onClose: () => void;
  stats: DataStats;
  insights?: string;
}

export function ExecutiveBriefing({ isOpen, onClose, stats, insights }: ExecutiveBriefingProps) {
  const slaColor = (stats.slaCompliance ?? 0) >= 80 ? 'text-emerald-500' : 'text-red-500';
  
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-4xl bg-white dark:bg-dark-card rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl relative z-10 overflow-hidden flex flex-col md:flex-row"
          >
            {/* Visual Side */}
            <div className="w-full md:w-2/5 bg-slate-900 p-8 flex flex-col justify-between relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-brand-turquoise/20 rounded-full blur-[100px]" />
               
               <div className="relative z-10">
                 <div className="flex items-center gap-2 text-brand-turquoise mb-4">
                   <ShieldCheck size={24} />
                   <span className="text-[10px] font-black uppercase tracking-[0.2em]">Forensic Analysis</span>
                 </div>
                 <h2 className="text-3xl font-black text-white leading-tight italic">
                   Executive <br />
                   <span className="text-brand-turquoise not-italic">Briefing</span>
                 </h2>
               </div>

               <div className="space-y-6 relative z-10">
                 <div className="flex items-center justify-between border-b border-white/10 pb-4">
                   <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">SLA Compliance</span>
                   <span className={cn("text-xl font-black", slaColor)}>{(stats.slaCompliance ?? 0).toFixed(1)}%</span>
                 </div>
                 <div className="flex items-center justify-between border-b border-white/10 pb-4">
                   <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Volume</span>
                   <span className="text-xl font-black text-white">{stats.totalSessions.toLocaleString()}</span>
                 </div>
                 <div className="flex items-center justify-between border-b border-white/10 pb-4">
                   <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Efficiency</span>
                   <span className="text-xl font-black text-brand-turquoise">{(stats.efficiencyIndex ?? 0).toFixed(1)}%</span>
                 </div>
               </div>

               <div className="relative z-10 p-4 bg-white/5 rounded-2xl border border-white/10">
                 <div className="flex items-center gap-2 text-white/60 text-[10px] font-bold uppercase mb-2">
                   <Zap size={12} className="text-amber-500" /> Anomalies Detected
                 </div>
                 <p className="text-xs text-slate-400">
                   {stats.peakHour ? `Peak hour at ${stats.peakHour.hour}:00 with ${stats.peakHour.count} sessions.` : 'No peak hour data available.'}
                 </p>
               </div>
            </div>

            {/* Narrative Side */}
            <div className="w-full md:w-3/5 p-8 md:p-12 flex flex-col bg-white dark:bg-dark-card">
              <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-brand-turquoise/10 flex items-center justify-center text-brand-turquoise">
                     <Sparkles size={20} />
                   </div>
                   <div>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI Intelligence</p>
                     <p className="text-xs font-bold text-slate-900 dark:text-white">Narrativa Estratégica</p>
                   </div>
                 </div>
                 <button 
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
                 >
                   <X size={20} />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                <div className="prose prose-slate dark:prose-invert">
                    <p className="text-xl text-slate-700 dark:text-slate-300 leading-relaxed font-medium italic">
                      "{insights || 'Analizando tendencias actuales para generar tu reporte ejecutivo... Por favor espera un momento.'}"
                    </p>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button className="flex items-center gap-3 px-6 py-3 bg-brand-turquoise text-white rounded-2xl font-black text-sm shadow-xl shadow-brand-turquoise/20 hover:scale-105 transition-all">
                  <Play size={18} fill="currentColor" />
                  Escuchar Briefing
                </button>
                
                <div className="flex items-center gap-4 text-slate-400">
                  <Volume2 size={20} />
                  <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Powered by Gemini 2.0</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
