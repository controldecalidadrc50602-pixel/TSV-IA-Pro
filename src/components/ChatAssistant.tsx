import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, User, Loader2, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatAssistantProps {
  dataSummary: string;
  onClose?: () => void;
}

interface Message {
  role: 'user' | 'model';
  content: string;
}

export function ChatAssistant({ dataSummary, onClose }: ChatAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: 'Hola! Soy tu asistente de datos. Puedo ayudarte a analizar la información cargada. ¿Qué te gustaría saber?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMessage }],
          systemPrompt: `
            Eres un experto analista de datos Senior para una plataforma SaaS Enterprise. 
            Tienes acceso al siguiente resumen de un archivo cargado:
            ${dataSummary}
            
            Tu objetivo es proporcionar insights de alto nivel, detectar anomalías y sugerir visualizaciones.
            Responde de forma profesional, concisa y usando Markdown.
          `
        })
      });

      if (!response.ok) throw new Error("Error en la respuesta del servidor");

      const data = await response.json();
      const text = data.text || "Lo siento, no pude generar una respuesta.";
      
      setMessages(prev => [...prev, { role: 'model', content: text }]);
    } catch (error) {
       console.error("Chat error:", error);
       setMessages(prev => [...prev, { role: 'model', content: "Hubo un error al conectar con el servidor de IA. Por favor verifica que el backend esté corriendo." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-dark-card border-l border-slate-200 dark:border-dark-border shadow-xl w-full md:w-[400px] transition-colors">
      <div className="p-4 border-b border-slate-200 dark:border-dark-border bg-brand-dark dark:bg-slate-900 text-white flex items-center justify-between transition-colors">
        <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-brand-turquoise" />
            <h3 className="font-semibold">Asistente IA</h3>
        </div>
        {onClose && (
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                <X size={20} />
            </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-dark-bg/50 transition-colors">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={cn(
              "flex gap-3 max-w-[90%]",
              msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
              msg.role === 'user' ? "bg-brand-dark/10 dark:bg-brand-turquoise/20 text-brand-dark dark:text-brand-turquoise" : "bg-brand-turquoise/10 text-brand-turquoise"
            )}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className={cn(
              "p-3 rounded-2xl text-sm shadow-sm",
              msg.role === 'user' 
                ? "bg-brand-turquoise text-white rounded-tr-none" 
                : "bg-white dark:bg-slate-800 text-brand-text dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-none"
            )}>
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
             <div className="w-8 h-8 rounded-full bg-brand-turquoise/10 text-brand-turquoise flex items-center justify-center flex-shrink-0">
               <Bot size={16} />
             </div>
             <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-slate-200 dark:border-slate-700 shadow-sm">
               <Loader2 className="animate-spin text-slate-400" size={16} />
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white dark:bg-dark-card border-t border-slate-200 dark:border-dark-border transition-colors">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Pregunta sobre tus datos..."
            className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-turquoise focus:border-transparent text-sm dark:text-white"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="p-2 bg-brand-turquoise text-white rounded-full hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-brand-turquoise/20"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
