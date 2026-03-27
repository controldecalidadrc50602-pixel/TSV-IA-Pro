import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, UserPlus, Mail, Lock, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("¡Registro exitoso! Por favor revisa tu correo para confirmar (si está activado).");
      }
    } catch (err: any) {
      setError(err.message || "Error en la autenticación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-turquoise/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-startup p-10 rounded-[2.5rem] relative z-10 border border-white/10 shadow-2xl"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-brand-turquoise/10 rounded-2xl mb-4 border border-brand-turquoise/20">
            <ShieldCheck className="text-brand-turquoise icon-shadow" size={32} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2 italic">
            TSV <span className="text-brand-turquoise not-italic">INTEL PRO</span>
          </h1>
          <p className="text-slate-400 text-sm font-medium">Plataforma Elite de Inteligencia Operativa</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email Corporativo</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-turquoise transition-colors" size={18} />
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-brand-turquoise/50 focus:ring-4 focus:ring-brand-turquoise/10 transition-all"
                placeholder="ejemplo@empresa.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Contraseña</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-turquoise transition-colors" size={18} />
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-brand-turquoise/50 focus:ring-4 focus:ring-brand-turquoise/10 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3"
              >
                <AlertCircle className="text-red-500 shrink-0" size={18} />
                <p className="text-xs text-red-200 leading-relaxed">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-brand-turquoise hover:bg-brand-turquoise/90 text-slate-950 font-black py-4 rounded-2xl shadow-xl shadow-brand-turquoise/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 group"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
                <span>{isLogin ? "Iniciar Sesión Elite" : "Crear Cuenta Business"}</span>
                <Sparkles size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-white/5">
          <p className="text-slate-500 text-xs mb-4">
            {isLogin ? "¿Nuevo en la plataforma?" : "¿Ya tienes una cuenta?"}
          </p>
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-brand-turquoise font-bold text-sm hover:underline tracking-tight"
          >
            {isLogin ? "Solicitar Acceso Partner" : "Acceder al Portal"}
          </button>
        </div>
      </motion.div>
      
      <div className="absolute bottom-8 text-slate-600 text-[10px] font-medium uppercase tracking-[0.2em]">
        Secured by TSV Cloud Infrastructure & Supabase
      </div>
    </div>
  );
}
