import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, User, Loader2, X, Sparkles, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChartRenderer, ChartConfig } from '@/components/ChartRenderer';
import { DataStats } from '@/lib/data-processor';

interface ChatAssistantProps {
  dataSummary: string;
  rawStats?: DataStats;
  onClose?: () => void;
  projectId?: string;
}

interface Message {
  role: 'user' | 'model';
  content: string;
  chartConfig?: ChartConfig | null;
}

const QUICK_QUESTIONS = [
  '¿Cuál es el canal con más volumen?',
  '¿Cómo está el SLA?',
  'Muéstrame las tipificaciones',
  'Análisis de hora pico',
  '¿Qué recomiendas mejorar?',
];

export function ChatAssistant({ dataSummary, rawStats, onClose, projectId }: ChatAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);

  // Load project-specific chat history
  useEffect(() => {
    const cacheKey = `tsv_chat_${projectId || 'default'}`;
    const saved = localStorage.getItem(cacheKey);
    if (saved) {
      setMessages(JSON.parse(saved));
    } else {
      setMessages([
        {
          role: 'model',
          content: '👋 Hola! Soy tu analista de datos con IA. Puedo responderte con texto **y gráficos** generados en tiempo real. ¿Qué quieres analizar?',
        }
      ]);
    }
  }, [projectId]);

  // Persist chat history
  useEffect(() => {
    if (messages.length > 0) {
      const cacheKey = `tsv_chat_${projectId || 'default'}`;
      localStorage.setItem(cacheKey, JSON.stringify(messages));
    }
  }, [messages, projectId]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const buildRawData = () => {
    if (!rawStats) return null;
    return {
      sessionsByChannel: rawStats.sessionsByChannel,
      statsByTipificacion: rawStats.statsByTipificacion,
      statsByCola: rawStats.statsByCola,
      sessionsByHour: rawStats.sessionsByHour,
      statsByStatus: rawStats.statsByStatus,
      slaCompliance: rawStats.slaCompliance,
      botSuccessRate: rawStats.botSuccessRate,
      efficiencyIndex: rawStats.efficiencyIndex,
      totalSessions: rawStats.totalSessions,
      avgDuration: rawStats.avgDuration,
      peakHour: rawStats.peakHour,
      totalTransfers: rawStats.totalTransfers,
      totalResponses: rawStats.totalResponses,
      dateRange: rawStats.dateRange,
    };
  };

  const handleSend = async (text?: string) => {
    const userMessage = text ?? input;
    if (!userMessage.trim() || isLoading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const systemPrompt = `Eres un experto Analista Senior de Contact Center y Customer Experience.
Tienes acceso a datos operativos reales. Tu rol es proveer análisis precisos, detectar anomalías y 
sugerir mejoras tácticas basadas en datos.

RESUMEN DEL DATASET:
${dataSummary}

INSTRUCCIONES:
- Responde siempre en español con tono profesional y directo.
- Usa Markdown para estructurar tus respuestas (negritas, listas, etc.).
- Cuando menciones métricas, cítalas exactamente del dataset.
- Si el usuario pide ver datos en un gráfico, inclúyelo en formato <chart>...</chart>.`;

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMessage }],
          systemPrompt,
          rawData: buildRawData()
        })
      });

      if (!response.ok) throw new Error('Error en servidor');

      const data = await response.json();
      setMessages(prev => [...prev, {
        role: 'model',
        content: data.text || 'No pude generar una respuesta.',
        chartConfig: data.chartConfig || null
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'model',
        content: '⚠️ Error al conectar con el servidor de IA. Verifica que el backend esté corriendo con `node server.js`.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-dark-card border-l border-slate-200 dark:border-dark-border shadow-2xl w-full md:w-[420px] transition-colors">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-dark-border bg-brand-dark dark:bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-brand-turquoise/20 flex items-center justify-center">
            <Sparkles size={16} className="text-brand-turquoise" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Asistente Analítico IA</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Gemini 2.0 Flash</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Quick Questions */}
      <div className="p-3 border-b border-slate-100 dark:border-dark-border bg-slate-50 dark:bg-slate-900/50 flex gap-2 overflow-x-auto no-scrollbar">
        {QUICK_QUESTIONS.map((q, i) => (
          <button
            key={i}
            onClick={() => handleSend(q)}
            disabled={isLoading}
            className="whitespace-nowrap text-[10px] font-bold text-slate-500 dark:text-slate-400 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 hover:border-brand-turquoise hover:text-brand-turquoise bg-white dark:bg-slate-800 transition-all shrink-0"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-dark-bg/50">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={cn(
              'flex gap-3',
              msg.role === 'user' ? 'flex-row-reverse' : ''
            )}
          >
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1',
              msg.role === 'user'
                ? 'bg-brand-turquoise text-white'
                : 'bg-brand-dark/10 dark:bg-brand-turquoise/10 text-brand-turquoise'
            )}>
              {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
            </div>

            <div className={cn(
              'max-w-[85%] space-y-2',
              msg.role === 'user' ? 'items-end' : 'items-start'
            )}>
              <div className={cn(
                'p-3 rounded-2xl text-sm shadow-sm',
                msg.role === 'user'
                  ? 'bg-brand-turquoise text-white rounded-tr-none'
                  : 'bg-white dark:bg-slate-800 text-brand-text dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-none'
              )}>
                <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>

              {/* Chart Embebido */}
              {msg.chartConfig && (
                <div className="w-full">
                  <div className="flex items-center gap-2 mb-1 ml-1">
                    <BarChart2 size={12} className="text-brand-turquoise" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Visualización Generada por IA</span>
                  </div>
                  <ChartRenderer config={msg.chartConfig} />
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-turquoise/10 text-brand-turquoise flex items-center justify-center flex-shrink-0">
              <Bot size={14} />
            </div>
            <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-tl-none border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-2">
              <Loader2 className="animate-spin text-brand-turquoise" size={14} />
              <span className="text-xs text-slate-400 font-medium">Analizando datos...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white dark:bg-dark-card border-t border-slate-200 dark:border-dark-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Pregunta sobre tus datos..."
            className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-turquoise focus:border-transparent text-sm dark:text-white placeholder-slate-400 transition-all"
            disabled={isLoading}
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="p-2.5 bg-brand-turquoise text-white rounded-xl hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-brand-turquoise/20"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
