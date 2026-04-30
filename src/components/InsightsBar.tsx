import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, AlertTriangle, CheckCircle2, TrendingDown, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Finding {
  type: 'alert' | 'trend' | 'achievement' | 'risk';
  title: string;
  description: string;
  value: string;
  action: string;
}

interface InsightsBarProps {
  findings: Finding[];
  executiveSummary?: string;
  isLoading?: boolean;
  onDismiss?: () => void;
}

const findingConfig = {
  alert: {
    icon: AlertTriangle,
    colors: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    badge: 'bg-amber-500/20 text-amber-300',
    dot: 'bg-amber-500',
    label: '⚠ Alerta',
  },
  trend: {
    icon: TrendingUp,
    colors: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    badge: 'bg-blue-500/20 text-blue-300',
    dot: 'bg-blue-500',
    label: '📈 Tendencia',
  },
  achievement: {
    icon: CheckCircle2,
    colors: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-300',
    dot: 'bg-emerald-500',
    label: '✅ Logro',
  },
  risk: {
    icon: TrendingDown,
    colors: 'bg-red-500/10 border-red-500/30 text-red-400',
    badge: 'bg-red-500/20 text-red-300',
    dot: 'bg-red-500',
    label: '🔴 Riesgo',
  },
};

export function InsightsBar({ findings, executiveSummary, isLoading, onDismiss }: InsightsBarProps) {
  if (isLoading) {
    return (
      <div className="mx-8 mb-0 mt-4 bg-slate-900/50 dark:bg-dark-card/80 border border-slate-200 dark:border-dark-border rounded-2xl p-4 flex items-center gap-3">
        <Sparkles size={16} className="text-brand-turquoise animate-pulse" />
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest animate-pulse">
          Gemini analizando los datos...
        </span>
      </div>
    );
  }

  if (!findings || findings.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="mx-8 mt-4 mb-0"
      >
        {/* Executive Summary */}
        {executiveSummary && (
          <div className="mb-3 flex items-start gap-3 bg-gradient-to-r from-brand-turquoise/10 to-transparent border border-brand-turquoise/20 rounded-2xl px-5 py-3">
            <Sparkles size={15} className="text-brand-turquoise shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium italic">
              {executiveSummary}
            </p>
            {onDismiss && (
              <button onClick={onDismiss} className="ml-auto text-slate-400 hover:text-slate-600 dark:hover:text-white shrink-0">
                <X size={14} />
              </button>
            )}
          </div>
        )}

        {/* Findings Chips */}
        <div className="flex flex-wrap gap-2">
          {findings.map((finding, i) => {
            const config = findingConfig[finding.type];
            const Icon = config.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08 }}
                className={cn(
                  'group flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold cursor-default',
                  'transition-all hover:scale-[1.02] hover:shadow-lg',
                  config.colors
                )}
                title={`${finding.description}\n\n💡 ${finding.action}`}
              >
                <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', config.dot)} />
                <Icon size={13} className="shrink-0" />
                <span className="truncate max-w-[160px]">{finding.title}</span>
                <span className={cn('px-1.5 py-0.5 rounded-md text-[10px] font-black shrink-0', config.badge)}>
                  {finding.value}
                </span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
