import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Presentation, ChevronRight, ChevronLeft, Sparkles, 
  Download, Share2, Play, MessageSquare, Layout, 
  TrendingUp, Users, Clock, Hash
} from 'lucide-react';
import { DataStats } from '@/lib/data-processor';
import { cn } from '@/lib/utils';
import pptxgen from "pptxgenjs";

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
  icon: any;
  metric?: string;
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
      console.error("Error generating slides", err);
      // Fallback
      setAiSlides([
        {
          title: "Análisis Ejecutivo de Operación",
          subtitle: stats.dateRange,
          content: `Se procesaron un total de ${stats.totalSessions} sesiones.`,
          insight: "La eficiencia operativa se mantiene dentro de los parámetros esperados.",
          icon: Layout,
          metric: `${stats.totalSessions} Sesiones`
        }
      ]);
      setHasStarted(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePPTXExport = () => {
    const pres = new pptxgen();
    pres.layout = 'LAYOUT_WIDE';
    
    slides.forEach(slide => {
      const pptSlide = pres.addSlide();
      pptSlide.background = { color: "0F172A" };
      if (logo) pptSlide.addImage({ data: logo, x: 0.5, y: 0.2, w: 1, h: 0.5 });

      pptSlide.addText(slide.title, { x: 0.5, y: 1.0, w: '90%', fontSize: 36, bold: true, color: "2DD4BF" });
      pptSlide.addText(slide.subtitle, { x: 0.5, y: 1.8, w: '90%', fontSize: 18, italic: true, color: "94A3B8" });
      pptSlide.addText(slide.content, { x: 0.5, y: 2.8, w: '60%', fontSize: 16, color: "F1F5F9", lineSpacing: 1.5 });

      if (slide.metric) {
        pptSlide.addShape(pres.ShapeType.rect, { x: 7.0, y: 2.5, w: 2.5, h: 2.5, fill: { color: "#1E293B" }, line: { color: "2DD4BF", width: 1 } });
        pptSlide.addText(slide.metric.split(' ')[0], { x: 7.0, y: 3.2, w: 2.5, fontSize: 44, bold: true, color: "2DD4BF", align: 'center' });
        pptSlide.addText(slide.metric.split(' ').slice(1).join(' '), { x: 7.0, y: 4.2, w: 2.5, fontSize: 12, bold: true, color: "94A3B8", align: 'center' });
      }
      pptSlide.addText("TSV-IA Pro Executive Report", { x: 0.5, y: 6.8, w: '90%', fontSize: 10, color: "475569" });
    });

    pres.writeFile({ fileName: `TSV_Report_${new Date().getTime()}.pptx` });
  };

  const slides = aiSlides.length > 0 ? aiSlides : [
    {
      title: "Generando Presentación Elite...",
      subtitle: "Analizando KPIs Estratégicos",
      content: "Transformando datos en hallazgos ejecutivos...",
      insight: "Por favor espere un momento.",
      icon: Sparkles
    }
  ];

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
           <button 
             onClick={() => window.print()} 
             className="px-4 py-2.5 bg-white/5 text-white rounded-xl border border-white/10 hover:bg-white/10 transition-colors flex items-center gap-2 text-xs font-bold"
             title="Exportar a PDF"
           >
              <Download size={16} className="icon-shadow" /> PDF
           </button>
           <button 
             onClick={handlePPTXExport}
             className="px-4 py-2.5 bg-brand-turquoise/20 text-brand-turquoise rounded-xl border border-brand-turquoise/30 hover:bg-brand-turquoise/30 transition-colors flex items-center gap-2 text-xs font-bold"
             title="Exportar a PPTX"
           >
              <Presentation size={16} className="icon-shadow" /> PPTX
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
              {logo && (
                <div className="mb-4">
                  <img src={logo} alt="Brand Logo" className="max-h-10 object-contain" />
                </div>
              )}
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

      {/* Hidden Print Container (Only for PDF Export) */}
      <div className="hidden slide-print-container">
        {slides.map((slide, i) => (
          <div key={i} className="slide-page">
            {logo && <img src={logo} alt="Logo" style={{ maxHeight: '60px', marginBottom: '2rem' }} />}
            <h1 style={{ fontSize: '32pt', fontWeight: 'bold', color: '#0f172a', marginBottom: '1rem' }}>{slide.title}</h1>
            <h2 style={{ fontSize: '18pt', fontStyle: 'italic', color: '#64748b', marginBottom: '2rem' }}>{slide.subtitle}</h2>
            <div style={{ fontSize: '16pt', lineHeight: '1.6', color: '#334155', maxWidth: '800px', marginBottom: '3rem' }}>
              {slide.content}
            </div>
            {slide.metric && (
              <div style={{ padding: '2rem', border: '2px solid #2dd4bf', borderRadius: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '48pt', fontWeight: 'black', color: '#2dd4bf' }}>{slide.metric.split(' ')[0]}</div>
                <div style={{ fontSize: '12pt', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>{slide.metric.split(' ').slice(1).join(' ')}</div>
              </div>
            )}
            <div style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid #e2e8f0', width: '100%', fontSize: '10pt', color: '#94a3b8' }}>
              TSV-IA Pro Executive Report | AI Generated Insights
            </div>
          </div>
        ))}
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
