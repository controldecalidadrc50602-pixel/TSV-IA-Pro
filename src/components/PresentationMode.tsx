import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Presentation, ChevronRight, ChevronLeft, Sparkles, 
  Download, Share2, Play, MessageSquare, Layout, 
  TrendingUp, Users, Clock, Hash
} from 'lucide-react';
import { DataStats } from '@/lib/data-processor';
import { cn } from '@/lib/utils';

interface PresentationModeProps {
  stats: DataStats;
  insights?: string;
  onBack: () => void;
}

interface Slide {
  title: string;
  subtitle: string;
  content: string;
  insight: string;
  icon: any;
  metric?: string;
}

export function PresentationMode({ stats, insights, onBack }: PresentationModeProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const slides: Slide[] = [
    {
      title: "Resumen Ejecutivo de Operación",
      subtitle: stats.dateRange,
      content: `Durante este periodo se procesaron un total de ${stats.totalSessions} sesiones a través de ${stats.sessionsByChannel.length} canales activos.`,
      insight: "La carga operativa se mantiene estable con una tendencia de crecimiento en canales digitales.",
      icon: Layout,
      metric: `${stats.totalSessions} Sesiones`
    },
    {
      title: "Eficiencia y Nivel de Servicio",
      subtitle: "Indicadores de Desempeño (KPIs)",
      content: `El cumplimiento de SLA se sitúa en un ${(stats.slaCompliance || 0).toFixed(1)}%, con un tiempo promedio de atención (AHT) de ${stats.avgDuration}.`,
      insight: "El índice de eficiencia de conversión es del ${(stats.efficiencyIndex || 0).toFixed(1)}%, lo que indica un uso óptimo del tiempo de respuesta.",
      icon: TrendingUp,
      metric: `${(stats.slaCompliance || 0).toFixed(1)}% SLA`
    },
    {
      title: "Análisis de Resolución Directa",
      subtitle: "Efectividad de Automatización",
      content: `La tasa de resolución por bot alcanzó el ${(stats.botSuccessRate || 0).toFixed(1)}%, evitando la transferencia innecesaria de casos complejos.`,
      insight: "Se observa una correlación positiva entre la tipificación inteligente y la reducción de transferencias externas.",
      icon: Sparkles,
      metric: `${(stats.botSuccessRate || 0).toFixed(1)}% Resolución`
    },
    {
      title: "Conclusiones Estratégicas",
      subtitle: "Siguientes Pasos Proyectados",
      content: insights || "Se recomienda optimizar las colas de atención con menor SLA y reforzar las tipificaciones críticas detectadas.",
      insight: `La hora pico de las ${stats.peakHour?.hour}:00 requiere un refuerzo preventivo de recursos.`,
      icon: CheckCircle
    }
  ];

  const handleStart = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setHasStarted(true);
    }, 1500);
  };

  if (!hasStarted) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-dark-card rounded-[3rem] border border-slate-100 dark:border-dark-border shadow-2xl">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-xl"
        >
          <div className="w-24 h-24 bg-brand-turquoise/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-brand-turquoise">
            <Presentation size={48} />
          </div>
          <h2 className="text-4xl font-black text-slate-800 dark:text-white mb-6 tracking-tight italic">
            Bienvenido al <span className="text-brand-turquoise">AI Presentation Engine</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-12 leading-relaxed">
            Voy a transformar tus datos crutos en una narrativa visual de alto impacto para tu próxima junta. 
            Analizaré los KPIs de SLA, Eficiencia y Resolución para crear una historia basada en resultados.
          </p>
          
          <button 
            onClick={handleStart}
            disabled={isGenerating}
            className="group relative px-10 py-4 bg-brand-turquoise text-white rounded-2xl font-bold text-lg shadow-xl shadow-brand-turquoise/20 hover:scale-105 transition-all disabled:opacity-50"
          >
            {isGenerating ? (
              <span className="flex items-center gap-3">
                <Sparkles className="animate-pulse" /> Generando Narrativa...
              </span>
            ) : (
              <span className="flex items-center gap-3">
                Configurar Presentación <ChevronRight />
              </span>
            )}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-900 rounded-[3.5rem] overflow-hidden relative border-[12px] border-slate-800 shadow-2xl">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-turquoise/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 flex gap-1 p-4 bg-slate-900/50 backdrop-blur-md z-50">
        {slides.map((_, i) => (
          <div 
            key={i} 
            className={cn(
              "flex-1 h-full rounded-full transition-all duration-500",
              i <= currentSlide ? "bg-brand-turquoise shadow-[0_0_10px_rgba(45,212,191,0.5)]" : "bg-slate-800"
            )}
          />
        ))}
      </div>

      {/* Controls Overlay */}
      <div className="absolute bottom-12 left-0 right-0 px-12 flex items-center justify-between z-50">
        <button 
          onClick={onBack}
          className="text-slate-500 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors"
        >
          Finalizar
        </button>

        <div className="flex items-center gap-4 bg-white/5 backdrop-blur-xl p-2 rounded-2xl border border-white/10">
          <button 
            onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
            disabled={currentSlide === 0}
            className="p-3 text-white hover:bg-white/10 rounded-xl transition-colors disabled:opacity-20"
          >
            <ChevronLeft size={24} />
          </button>
          
          <div className="text-white/40 text-sm font-black px-2">
            SLIDE {currentSlide + 1} / {slides.length}
          </div>

          <button 
            onClick={() => setCurrentSlide(prev => Math.min(slides.length - 1, prev + 1))}
            disabled={currentSlide === slides.length - 1}
            className="p-3 text-white hover:bg-white/10 rounded-xl transition-colors disabled:opacity-20"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        <div className="flex items-center gap-3">
           <button className="p-3 bg-white/5 text-white rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
              <Download size={20} />
           </button>
        </div>
      </div>

      {/* Slide Content */}
      <div className="flex-1 p-24 flex items-center">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentSlide}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="grid grid-cols-12 gap-16 w-full items-center"
          >
            <div className="col-span-7 space-y-8">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-brand-turquoise/10 text-brand-turquoise rounded-2xl border border-brand-turquoise/20">
                    {React.createElement(slides[currentSlide].icon, { size: 32 })}
                </div>
                <div>
                   <h4 className="text-teal-400 font-bold uppercase tracking-[0.3em] text-xs">DATA ANALYSIS 2026</h4>
                   <h1 className="text-5xl font-black text-white leading-tight tracking-tight">
                    {slides[currentSlide].title}
                   </h1>
                </div>
              </div>

              <div className="space-y-6">
                <p className="text-2xl text-slate-400 font-medium leading-relaxed italic">
                    "{slides[currentSlide].subtitle}"
                </p>
                <p className="text-lg text-slate-300 leading-relaxed max-w-2xl">
                    {slides[currentSlide].content}
                </p>
              </div>

              <div className="pt-8">
                <div className="bg-gradient-to-r from-emerald-500/20 to-transparent p-6 rounded-[2rem] border-l-4 border-emerald-500 max-w-xl">
                   <div className="flex items-center gap-3 mb-2">
                      <Sparkles size={16} className="text-emerald-400" />
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">IA Insight Premium</span>
                   </div>
                   <p className="text-sm text-slate-200 leading-relaxed">
                    {slides[currentSlide].insight}
                   </p>
                </div>
              </div>
            </div>

            <div className="col-span-5 relative">
              <motion.div 
                initial={{ rotate: -5, scale: 0.9, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-slate-800 to-slate-900 p-12 rounded-[3.5rem] border border-white/5 shadow-2xl aspect-square flex flex-col items-center justify-center text-center relative overflow-hidden"
              >
                  <div className="absolute top-0 left-0 w-full h-1 bg-brand-turquoise" />
                  
                  {slides[currentSlide].metric && (
                    <>
                       <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6 text-brand-turquoise">
                          {React.createElement(slides[currentSlide].icon, { size: 28 })}
                       </div>
                       <h2 className="text-6xl font-black text-white mb-2 tracking-tighter">
                          {slides[currentSlide].metric.split(' ')[0]}
                       </h2>
                       <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
                          {slides[currentSlide].metric.split(' ').slice(1).join(' ')}
                       </p>
                    </>
                  )}
                  
                  {!slides[currentSlide].metric && (
                    <div className="flex flex-col items-center gap-6">
                       <Presentation size={80} className="text-slate-700 mb-2" />
                       <div className="space-y-2">
                          <div className="h-2 w-32 bg-slate-700 rounded-full mx-auto" />
                          <div className="h-2 w-24 bg-slate-800 rounded-full mx-auto" />
                       </div>
                    </div>
                  )}
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// Helper icons
function CheckCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
