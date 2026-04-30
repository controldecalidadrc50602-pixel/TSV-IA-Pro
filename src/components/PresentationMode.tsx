import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Presentation, ChevronRight, ChevronLeft, Sparkles,
  Download, Play, LayoutDashboard, TrendingUp, Share2,
  Radio, Target, Zap, AlertTriangle, CheckCircle2, BarChart3,
  Settings2, Palette, FileText
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { DataStats } from '@/lib/data-processor';
import { cn } from '@/lib/utils';
import pptxgen from 'pptxgenjs';

interface PresentationConfig {
    theme: string;
    slideCount: number;
    includedTypes: string[];
}

interface PresentationModeProps {
  stats: DataStats;
  insights?: string;
  onBack: () => void;
  logo?: string | null;
  onGenerateSlides: (config: PresentationConfig) => Promise<Slide[]>;
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
}

const COLORS = ['#2DD4BF', '#6366F1', '#F59E0B', '#EF4444', '#10B981', '#8B5CF6', '#0EA5E9'];

const slideThemes: Record<string, { accent: string; bg: string; border: string; icon: any }> = {
  overview: { accent: 'text-teal-400', bg: 'from-teal-500/10', border: 'border-teal-500/30', icon: LayoutDashboard },
  efficiency: { accent: 'text-blue-400', bg: 'from-blue-500/10', border: 'border-blue-500/30', icon: TrendingUp },
  channels: { accent: 'text-purple-400', bg: 'from-purple-500/10', border: 'border-purple-500/30', icon: Radio },
  tipification: { accent: 'text-amber-400', bg: 'from-amber-500/10', border: 'border-amber-500/30', icon: AlertTriangle },
  action: { accent: 'text-emerald-400', bg: 'from-emerald-500/10', border: 'border-emerald-500/30', icon: Target },
  strategy: { accent: 'text-rose-400', bg: 'from-rose-500/10', border: 'border-rose-500/30', icon: Zap },
  colas: { accent: 'text-indigo-400', bg: 'from-indigo-500/10', border: 'border-indigo-500/30', icon: Radio },
  hourly: { accent: 'text-sky-400', bg: 'from-sky-500/10', border: 'border-sky-500/30', icon: TrendingUp },
};

const tooltipStyle = {
  borderRadius: '10px', border: 'none',
  boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
  backgroundColor: '#0F172A', color: '#F1F5F9', fontSize: '11px', fontWeight: 700
};

// ... SlideChart component remains the same ...
function SlideChart({ type, stats }: { type?: string; stats: DataStats }) {
  const schema = stats.detectedSchema;
  
  if (type === 'channels' && stats.sessionsByChannel?.length > 0) {
    const data = stats.sessionsByChannel.slice(0, 6);
    const label = schema?.categorical[0] || 'Categoría Principal';
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

  if ((type === 'tipification' || type === 'action') && stats.statsByTipificacion?.length > 0) {
    const data = stats.statsByTipificacion.slice(0, 6);
    const label = schema?.categorical[1] || 'Sub-categoría';
    return (
      <div className="h-[220px] w-full">
        <div className="text-[10px] font-bold text-slate-500 uppercase mb-2 ml-1 tracking-widest">{label}</div>
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
  
  if (type === 'colas' && stats.statsByCola?.length > 0) {
      const data = stats.statsByCola.slice(0, 6);
      const label = schema?.categorical[2] || 'Tercera Categoría';
      return (
        <div className="h-[220px] w-full">
          <div className="text-[10px] font-bold text-slate-500 uppercase mb-2 ml-1 tracking-widest">{label}</div>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical">
              <XAxis type="number" hide />
              <YAxis dataKey="cola" type="category" width={110} fontSize={9} fontWeight={700}
                tick={{ fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#F1F5F9' }} />
              <Bar dataKey="count" fill="#6366F1" radius={[0, 6, 6, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
  }

  if (type === 'efficiency' || type === 'overview' || type === 'hourly' || type === 'strategy') {
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

  return null;
}

const THEMES = [
    { id: 'teal', label: 'Teal (Modern)', color: 'bg-teal-500' },
    { id: 'blue', label: 'Blue (Corporate)', color: 'bg-blue-500' },
    { id: 'purple', label: 'Purple (Creative)', color: 'bg-purple-500' },
    { id: 'amber', label: 'Amber (Warm)', color: 'bg-amber-500' },
    { id: 'rose', label: 'Rose (Bold)', color: 'bg-rose-500' },
];

const SLIDE_TYPES = [
    { id: 'overview', label: 'Resumen General' },
    { id: 'efficiency', label: 'Eficiencia Operativa' },
    { id: 'channels', label: 'Mix de Canales' },
    { id: 'tipification', label: 'Tipificaciones' },
    { id: 'colas', label: 'Análisis de Colas' },
    { id: 'hourly', label: 'Comportamiento Horario' },
    { id: 'action', label: 'Plan de Acción' },
    { id: 'strategy', label: 'Estrategia Mediano Plazo' },
];

export function PresentationMode({ stats, insights, onBack, logo, onGenerateSlides }: PresentationModeProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [aiSlides, setAiSlides] = useState<Slide[]>([]);
  
  // Config state
  const [config, setConfig] = useState<PresentationConfig>({
      theme: 'teal',
      slideCount: 5,
      includedTypes: ['overview', 'efficiency', 'channels', 'tipification', 'action']
  });

  const handleToggleType = (typeId: string) => {
      setConfig(prev => {
          const isIncluded = prev.includedTypes.includes(typeId);
          let newTypes = [];
          if (isIncluded) {
              // Prevent removing if it's the last one
              if (prev.includedTypes.length <= 1) return prev;
              newTypes = prev.includedTypes.filter(t => t !== typeId);
          } else {
              newTypes = [...prev.includedTypes, typeId];
          }
          // Adjust slide count if we selected fewer types than the current slide count
          // Or if we select more types, we might want to bump the slide count.
          // For simplicity, let's just update the types.
          return { ...prev, includedTypes: newTypes };
      });
  };

  const handleStart = async () => {
    setIsGenerating(true);
    try {
      const generated = await onGenerateSlides(config);
      setAiSlides(generated);
      setHasStarted(true);
    } catch (err) {
      console.error('Error generating slides', err);
      // Fallback slide
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
      s.addText(slide.title, { x: 0.5, y: 0.9, w: '90%', fontSize: 34, bold: true, color: '2DD4BF' }); // Might need to adapt color to theme
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

  // Landing Screen with Config Panel
  if (!hasStarted) {
    return (
      <div className="h-full flex flex-col p-8 bg-slate-50 dark:bg-dark-bg rounded-[3rem]">
        <div className="flex-1 max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left: Hero Info */}
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                <div className="w-20 h-20 bg-gradient-to-br from-brand-turquoise/20 to-teal-500/10 rounded-[2rem] flex items-center justify-center mb-6 border border-brand-turquoise/20">
                    <Presentation size={36} className="text-brand-turquoise" />
                </div>
                <h2 className="text-4xl font-black text-slate-800 dark:text-white mb-4 tracking-tight">
                    AI <span className="text-brand-turquoise">Presentation Engine</span>
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed text-sm">
                    Personaliza y genera una narrativa ejecutiva de alto impacto. Gemini AI analizará tus datos y construirá slides interactivos listos para presentar o exportar a PPTX.
                </p>

                <div className="flex flex-col gap-4">
                    <button
                        onClick={handleStart}
                        disabled={isGenerating}
                        className="group flex items-center justify-center gap-3 px-8 py-4 bg-brand-turquoise text-white rounded-2xl font-bold text-lg shadow-xl shadow-brand-turquoise/20 hover:scale-[1.02] transition-all disabled:opacity-50"
                    >
                        {isGenerating ? (
                        <><Sparkles className="animate-pulse" size={20} /> Generando Narrativa...</>
                        ) : (
                        <><Play size={20} /> Generar Presentación <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" /></>
                        )}
                    </button>
                    <button onClick={onBack} className="text-sm font-bold text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                        Cancelar y volver
                    </button>
                </div>
            </motion.div>

            {/* Right: Config Panel */}
            <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
                <div className="bg-white dark:bg-dark-card rounded-[2rem] border border-slate-200 dark:border-dark-border p-8 shadow-xl shadow-slate-200/50 dark:shadow-none">
                    <div className="flex items-center gap-2 mb-6">
                        <Settings2 size={18} className="text-slate-400" />
                        <h3 className="font-black text-slate-700 dark:text-white">Configuración del Reporte</h3>
                    </div>

                    <div className="space-y-8">
                        {/* Tema */}
                        <div>
                            <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                                <Palette size={14} /> Tema de Color Principal
                            </label>
                            <div className="flex flex-wrap gap-3">
                                {THEMES.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => setConfig({...config, theme: t.id})}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-bold transition-all",
                                            config.theme === t.id 
                                                ? "border-slate-800 bg-slate-800 text-white dark:border-white dark:bg-white dark:text-slate-900 shadow-md"
                                                : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500"
                                        )}
                                    >
                                        <div className={cn("w-3 h-3 rounded-full", t.color)} />
                                        {t.label.split(' ')[0]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Slide Count */}
                        <div>
                            <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                                <FileText size={14} /> Número de Slides
                            </label>
                            <div className="flex bg-slate-100 dark:bg-slate-900 rounded-xl p-1 inline-flex">
                                {[3, 4, 5, 6].map(num => (
                                    <button
                                        key={num}
                                        onClick={() => setConfig({...config, slideCount: num})}
                                        className={cn(
                                            "px-6 py-2 rounded-lg text-sm font-bold transition-all",
                                            config.slideCount === num
                                                ? "bg-white dark:bg-slate-700 text-brand-dark dark:text-white shadow-sm"
                                                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                                        )}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tipos a incluir */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                                    <LayoutDashboard size={14} /> Contenido a Analizar
                                </label>
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                                    Seleccionados: {config.includedTypes.length}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {SLIDE_TYPES.map(type => (
                                    <button
                                        key={type.id}
                                        onClick={() => handleToggleType(type.id)}
                                        className={cn(
                                            "flex items-center gap-2 p-3 rounded-xl border text-left transition-all",
                                            config.includedTypes.includes(type.id)
                                                ? "border-brand-turquoise bg-brand-turquoise/5 text-brand-dark dark:text-white"
                                                : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-brand-turquoise/30"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-4 h-4 rounded flex items-center justify-center border",
                                            config.includedTypes.includes(type.id) ? "bg-brand-turquoise border-brand-turquoise text-white" : "border-slate-300 dark:border-slate-600"
                                        )}>
                                            {config.includedTypes.includes(type.id) && <CheckCircle2 size={12} />}
                                        </div>
                                        <span className="text-xs font-bold truncate">{type.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
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
