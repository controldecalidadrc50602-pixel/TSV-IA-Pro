import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { Send, Bot, User, Sparkles, Loader2, X } from 'lucide-react';
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
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key not found");

      const ai = new GoogleGenAI({ apiKey });
      
      const systemPrompt = `
        Eres un experto analista de datos. Tienes acceso al siguiente resumen de un archivo TSV cargado por el usuario:
        
        ${dataSummary}
        
        Responde a las preguntas del usuario basándote en esta información. 
        Si te preguntan algo que no puedes saber con el resumen proporcionado, explica amablemente que solo tienes acceso a estadísticas generales y una muestra de los datos.
        Sé conciso, profesional y útil. Usa formato Markdown para tus respuestas.
      `;

      // Use chat model for better context handling
      const chat = ai.chats.create({
        model: "gemini-2.5-flash",
        config: {
            systemInstruction: systemPrompt,
        },
        history: messages.slice(1).map(m => ({
            role: m.role,
            parts: [{ text: m.content }]
        }))
      });

      const response = await chat.sendMessage({
        message: userMessage
      });

      const text = response.text || "Lo siento, no pude generar una respuesta.";
      
      setMessages(prev => [...prev, { role: 'model', content: text }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'model', content: "Hubo un error al conectar con Gemini. Por favor verifica tu API Key." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200 shadow-xl w-full md:w-[400px]">
      <div className="p-4 border-b border-slate-200 bg-brand-dark text-white flex items-center justify-between">
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

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
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
              msg.role === 'user' ? "bg-brand-dark/10 text-brand-dark" : "bg-brand-turquoise/10 text-brand-turquoise"
            )}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className={cn(
              "p-3 rounded-2xl text-sm shadow-sm",
              msg.role === 'user' 
                ? "bg-brand-turquoise text-white rounded-tr-none" 
                : "bg-white text-brand-text border border-slate-200 rounded-tl-none"
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
             <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm">
               <Loader2 className="animate-spin text-slate-400" size={16} />
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Pregunta sobre tus datos..."
            className="flex-1 px-4 py-2 border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-turquoise focus:border-transparent text-sm"
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
