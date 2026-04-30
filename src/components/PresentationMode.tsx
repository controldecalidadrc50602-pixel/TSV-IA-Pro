import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Presentation, ChevronRight, ChevronLeft, Sparkles,
  Download, Play, LayoutDashboard, TrendingUp, Share2,
  Radio, Target, Zap, AlertTriangle, CheckCircle2, BarChart3
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { DataStats } from '@/lib/data-processor';
import { cn } from '@/lib/utils';
import pptxgen from 'pptxgenjs';

interface PresentationModeProps {
  stats: DataStats;
  insights?: string;
  onBack: () => void;
  logo?: string | null;
  onGenerateSlides: () => Promise<Slide[]>;
}

interface Slide {
  title: string;
  subtitle: string;
  content: string;
  insight: string;
  metric?: string;
  type?: string;
  bulletPoints?: string[];
  color?: string;
  icon?: any;
}

const COLORS = ['#2DD4BF', '#6366F1', '#F59E0B', '#EF4444', '#10B981', '#8B5CF6', '#0EA5E9'];

const slideThemes: Record<string, { accent: string; bg: string; border: string; icon: any }> = {
  overview: { accent: 'text-teal-400', bg: 'from-teal-500/10', border: 'border-teal-500/30', icon: LayoutDashboard },
  efficiency: { accent: 'text-blue-400', bg: 'from-blue-500/10', border: 'border-blue-500/30', icon: TrendingUp },
  channels: { accent: 'text-purple-400', bg: 'from-purple-500/10', border: 'border-purple-500/30', icon: Radio },
  tipification: { accent: 'text-amber-400', bg: 'from-amber-500/10', border: 'border-amber-500/30', icon: AlertTriangle },
  action: { accent: 'text-emerald-400', bg: 'from-emerald-500/10', border: 'border-emerald-500/30', icon: Target },
  strategy: { accent: 'text-rose-400', bg: 'from-rose-500/10', border: 'border-rose-500/30', icon: Zap },
};

const tooltipStyle = {
  borderRadius: '10px', border: 'none',
  boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
  backgroundColor: '#0F172A', color: '#F1F5F9', fontSize: '11px', fontWeight: 700
};

function SlideChart({ type, stats }: { type?: string; stats: DataStats }) {
  if (type === 'channels' && stats.sessionsByChannel?.length > 0) {
    const data = stats.sessionsByChannel.slice(0, 6);
    return (
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
              paddingAngle={4} dataKey="count" nameKey="channel">
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#F1F5F9' }} />
            <Legend formatter={(v) => <span style={{ color: '#94A3B8', fontSize: '10px', fontWeight: 700 }}>{v}</span>} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === 'tipification' && stats.statsByTipificacion?.length > 0) {
    const data = stats.statsByTipificacion.slice(0, 6);
    return (
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical">
            <XAxis type="number" hide />
            <YAxis dataKey="category" type="category" width={110} fontSize={9} fontWeight={700}
              tick={{ fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#F1F5F9' }} />
            <Bar dataKey="count" fill="#2DD4BF" radius={[0, 6, 6, 0]} barSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === 'efficiency' || type === 'overview') {
    const data = stats.sessionsByHour?.filter(h => h.count > 0) ?? [];
    return (
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2DD4BF" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#2DD4BF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" />
            <XAxis dataKey="hour" fontSize={9} fontWeight={700} tickLine={false} axisLine={false} tick={{ fill: '#475569' }} />
            <YAxis fontSize={9} tickLine={false} axisLine={false} tick={{ fill: '#475569' }} />
            <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#F1F5F9' }} />
            <Area type="monotone" dataKey="count" stroke="#0D9488" strokeWidth={3}
              fillOpacity={1} fill="url(#areaGrad)" name="Sesiones" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === 'action') {
    const kpiData = [
      { name: 'SLA', value: stats.slaCompliance ?? 0, target: 80 },
      { name: 'Bot Res.', value: stats.botSuccessRate ?? 0, target: 70 },
      { name: 'Eficiencia', value: stats.efficiencyIndex ?? 0, target: 75 },
    ];
    return (
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={kpiData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" />
            <XAxis dataKey="name" fontSize={10} fontWeight={700} tickLine={false} axisLine={false} tick={{ fill: '#94A3B8' }} />
            <YAxis domain={[0, 100]} fontSize={9} tickLine={false} axisLine={false} tick={{ fill: '#94A3B8' }} unit="%" />
            <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#F1F5F9' }} formatter={(v: any) => [`${v.toFixed(1)}%`]} />
            <Bar dataKey="value" name="Real" fill="#2DD4BF" radius={[6, 6, 0, 0]} barSize={40} />
            <Bar dataKey="target" name="Meta" fill="#1E3A4A" radius={[6, 6, 0, 0]} barSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return null;
}

export function PresentationMode({ stats, insights, onBack, logo, onGenerateSlides }: PresentationModeProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [aiSlides, setAiSlides] = useState<Slide[]>([]);

  const handleStart = async () => {
    setIsGenerating(true);
    try {
      const generated = await onGenerateSlides();
      setAiSlides(generated);
      setHasStarted(true);
    } catch (err) {
      console.error('Error generating slides', err);
      setAiSlides([{
        title: 'Análisis Ejecutivo',
        subtitle: stats.dateRange,
        content: `Se procesaron un total de ${stats.totalSessions} sesiones en el período analizado.`,
        insight: 'La eficiencia operativa se mantiene dentro de los parámetros esperados.',
        metric: `${stats.totalSessions} Sesiones`,
        type: 'overview'
      }]);
      setHasStarted(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePPTXExport = () => {
    const pres = new pptxgen();
    pres.layout = 'LAYOUT_WIDE';
    slides.forEach((slide, idx) => {
      const s = pres.addSlide();
      s.background = { color: '0F172A' };
      if (logo) s.addImage({ data: logo, x: 0.5, y: 0.2, w: 1.2, h: 0.5 });
      s.addText(`${idx + 1} / ${slides.length}`, { x: 8.5, y: 0.2, w: 1.5, fontSize: 10, color: '475569', bold: true, align: 'right' });
      s.addText(slide.title, { x: 0.5, y: 0.9, w: '90%', fontSize: 34, bold: true, color: '2DD4BF' });
      s.addText(`"${slide.subtitle}"`, { x: 0.5, y: 1.7, w: '90%', fontSize: 16, italic: true, color: '94A3B8' });
      s.addText(slide.content, { x: 0.5, y: 2.5, w: '58%', fontSize: 14, color: 'CBD5E1', lineSpacing: 22 });
      if (slide.bulletPoints?.length) {
        slide.bulletPoints.forEach((bp, bi) => {
          s.addText(`• ${bp}`, { x: 0.5, y: 3.5 + bi * 0.45, w: '58%', fontSize: 12, color: '94A3B8' });
        });
      }
      if (slide.metric) {
        s.addShape(pres.ShapeType.rect, { x: 7.2, y: 2.3, w: 2.3, h: 2.6, fill: { color: '1E293B' }, line: { color: '2DD4BF', width: 1.5 } });
        const [val, ...unit] = slide.metric.split(' ');
        s.addText(val, { x: 7.2, y: 3.0, w: 2.3, fontSize: 40, bold: true, color: '2DD4BF', align: 'center' });
        s.addText(unit.join(' '), { x: 7.2, y: 4.1, w: 2.3, fontSize: 11, bold: true, color: '64748B', align: 'center' });
      }
      s.addShape(pres.ShapeType.rect, { x: 0, y: 6.8, w: '100%', h: 0.45, fill: { color: '0B1120' } });
      s.addText('TSV Intelligence Pro — Executive Report | Powered by Gemini AI', {
        x: 0.5, y: 6.85, w: '90%', fontSize: 9, color: '334155'
      });
    });
    pres.writeFile({ fileName: `TSV_Executive_${new Date().getTime()}.pptx` });
  };

  const slides = aiSlides.length > 0 ? aiSlides : [];

  // Landing Screen
  if (!hasStarted) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-dark-card rounded-[3rem] border border-slate-100 dark:border-dark-border shadow-2xl">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-xl">
          <div className="w-24 h-24 bg-gradient-to-br from-brand-turquoise/20 to-teal-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-brand-turquoise/20">
            <Presentation size={48} className="text-brand-turquoise" />
          </div>
          <h2 className="text-4xl font-black text-slate-800 dark:text-white mb-4 tracking-tight">
            AI <span className="text-brand-turquoise">Presentation Engine</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-4 leading-relaxed text-sm">
            Transforma tus datos operativos en una narrativa ejecutiva de alto impacto con <strong>gráficos en vivo</strong> generados por Gemini AI.
          </p>

          {/* Preview features */}
          <div className="grid grid-cols-3 gap-3 mb-10">
            {[
              { icon: BarChart3, label: 'Gráficos en vivo' },
              { icon: Sparkles, label: 'Análisis Gemini' },
              { icon: Download, label: 'Export PPTX/PDF' },
            ].map((f, i) => (
              <div key={i} className="flex flex-col items-center gap-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                <f.icon size={20} className="text-brand-turquoise" />
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{f.label}</span>
              </div>
            ))}
          </div>

          <button
            onClick={handleStart}
            disabled={isGenerating}
            className="group px-10 py-4 bg-brand-turquoise text-white rounded-2xl font-bold text-lg shadow-xl shadow-brand-turquoise/20 hover:scale-105 transition-all disabled:opacity-50"
          >
            {isGenerating ? (
              <span className="flex items-center gap-3">
                <Sparkles className="animate-pulse" size={20} /> Generando Narrativa...
              </span>
            ) : (
              <span className="flex items-center gap-3">
                <Play size={20} /> Generar Presentación <ChevronRight size={20} />
              </span>
            )}
          </button>
        </motion.div>
      </div>
    );
  }

  const slide = slides[currentSlide];
  const theme = slideThemes[slide?.type ?? 'overview'] ?? slideThemes.overview;
  const SlideIcon = theme.icon;

  return (
    <div className="h-full flex flex-col bg-slate-900 rounded-[3rem] overflow-hidden relative border-[10px] border-slate-800 shadow-2xl">
      {/* Ambient BG */}
      <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-brand-turquoise/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 flex z-50">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentSlide(i)}
            className={cn(
              'flex-1 h-full transition-all duration-500 first:rounded-tl-3xl last:rounded-tr-3xl',
              i <= currentSlide ? 'bg-brand-turquoise shadow-[0_0_8px_rgba(45,212,191,0.6)]' : 'bg-slate-800 hover:bg-slate-700'
            )}
          />
        ))}
      </div>

      {/* Slide Content */}
      <div className="flex-1 pt-6 px-10 pb-0 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 grid grid-cols-12 gap-10 items-start"
          >
            {/* LEFT: Text Content (7 cols) */}
            <div className="col-span-7 space-y-6 py-6">
              {/* Header */}
              <div>
                {logo && <img src={logo} alt="Logo" className="max-h-8 object-contain mb-4 opacity-80" />}
                <div className="flex items-center gap-2 mb-3">
                  <span className={cn('text-[10px] font-black uppercase tracking-[0.3em]', theme.accent)}>
                    SLIDE {currentSlide + 1} · {slide?.type?.toUpperCase()}
                  </span>
                </div>
                <h1 className="text-4xl font-black text-white leading-tight tracking-tight">
                  {slide?.title}
                </h1>
              </div>

              {/* Subtitle */}
              <p className="text-lg text-slate-400 font-medium leading-relaxed italic">
                "{slide?.subtitle}"
              </p>

              {/* Content */}
              <p className="text-base text-slate-300 leading-relaxed">
                {slide?.content}
              </p>

              {/* Bullet Points */}
              {slide?.bulletPoints && slide.bulletPoints.length > 0 && (
                <ul className="space-y-2">
                  {slide.bulletPoints.map((bp, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-400">
                      <div className={cn('w-1.5 h-1.5 rounded-full mt-2 shrink-0 bg-brand-turquoise')} />
                      {bp}
                    </li>
                  ))}
                </ul>
              )}

              {/* Insight Box */}
              <div className={cn('p-5 rounded-2xl border bg-gradient-to-r to-transparent', theme.bg, theme.border)}>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={14} className={theme.accent} />
                  <span className={cn('text-[10px] font-black uppercase tracking-widest', theme.accent)}>Recomendación Gemini AI</span>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed">{slide?.insight}</p>
              </div>
            </div>

            {/* RIGHT: Visual Panel (5 cols) */}
            <div className="col-span-5 py-6 flex flex-col gap-4">
              {/* Metric Card */}
              {slide?.metric && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className={cn(
                    'relative p-6 rounded-3xl border text-center overflow-hidden',
                    'bg-gradient-to-br from-slate-800 to-slate-900',
                    theme.border
                  )}
                >
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-brand-turquoise to-transparent" />
                  <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4', `bg-gradient-to-br ${theme.bg}`)}>
                    <SlideIcon size={24} className={theme.accent} />
                  </div>
                  <div className="text-5xl font-black text-white tracking-tighter mb-1">
                    {slide.metric.split(' ')[0]}
                  </div>
                  <div className={cn('text-xs font-black uppercase tracking-widest', theme.accent)}>
                    {slide.metric.split(' ').slice(1).join(' ')}
                  </div>
                </motion.div>
              )}

              {/* Live Chart */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="bg-slate-800/60 rounded-3xl p-5 border border-slate-700/50"
              >
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 size={13} className="text-brand-turquoise" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Live Data</span>
                </div>
                <SlideChart type={slide?.type} stats={stats} />
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="px-10 py-5 flex items-center justify-between border-t border-white/5 bg-slate-900/50 backdrop-blur-sm">
        <button onClick={onBack} className="text-slate-600 hover:text-slate-400 text-xs font-bold uppercase tracking-widest transition-colors">
          ← Salir
        </button>

        <div className="flex items-center gap-3 bg-white/5 backdrop-blur-xl px-2 py-1.5 rounded-2xl border border-white/10">
          <button
            onClick={() => setCurrentSlide(p => Math.max(0, p - 1))}
            disabled={currentSlide === 0}
            className="p-2.5 text-white hover:bg-white/10 rounded-xl transition-colors disabled:opacity-20"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex gap-1.5 px-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={cn(
                  'w-2 h-2 rounded-full transition-all',
                  i === currentSlide ? 'bg-brand-turquoise w-5' : 'bg-slate-700 hover:bg-slate-600'
                )}
              />
            ))}
          </div>
          <button
            onClick={() => setCurrentSlide(p => Math.min(slides.length - 1, p + 1))}
            disabled={currentSlide === slides.length - 1}
            className="p-2.5 text-white hover:bg-white/10 rounded-xl transition-colors disabled:opacity-20"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3 py-2 bg-white/5 text-slate-400 hover:text-white rounded-xl border border-white/10 hover:bg-white/10 transition-colors flex items-center gap-2 text-xs font-bold"
          >
            <Download size={14} /> PDF
          </button>
          <button
            onClick={handlePPTXExport}
            className="px-3 py-2 bg-brand-turquoise/20 text-brand-turquoise rounded-xl border border-brand-turquoise/30 hover:bg-brand-turquoise/30 transition-colors flex items-center gap-2 text-xs font-bold"
          >
            <Presentation size={14} /> PPTX
          </button>
        </div>
      </div>

      {/* Print container */}
      <div className="hidden slide-print-container">
        {slides.map((slide, i) => (
          <div key={i} className="slide-page">
            {logo && <img src={logo} alt="Logo" style={{ maxHeight: '50px', marginBottom: '1.5rem' }} />}
            <h1 style={{ fontSize: '30pt', fontWeight: 'bold', color: '#0f172a', marginBottom: '0.5rem' }}>{slide.title}</h1>
            <h2 style={{ fontSize: '16pt', fontStyle: 'italic', color: '#64748b', marginBottom: '1.5rem' }}>"{slide.subtitle}"</h2>
            <p style={{ fontSize: '14pt', color: '#334155', marginBottom: '1rem', lineHeight: 1.6 }}>{slide.content}</p>
            {slide.bulletPoints?.map((bp, bi) => (
              <p key={bi} style={{ fontSize: '12pt', color: '#475569', marginLeft: '1rem', marginBottom: '0.3rem' }}>• {bp}</p>
            ))}
            {slide.metric && (
              <div style={{ marginTop: '1.5rem', padding: '1rem 2rem', border: '2px solid #2dd4bf', borderRadius: '1rem', textAlign: 'center', display: 'inline-block' }}>
                <div style={{ fontSize: '40pt', fontWeight: 900, color: '#2dd4bf' }}>{slide.metric.split(' ')[0]}</div>
                <div style={{ fontSize: '10pt', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{slide.metric.split(' ').slice(1).join(' ')}</div>
              </div>
            )}
            <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0', fontSize: '9pt', color: '#94a3b8' }}>
              TSV Intelligence Pro · AI Executive Report · Powered by Gemini AI
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
