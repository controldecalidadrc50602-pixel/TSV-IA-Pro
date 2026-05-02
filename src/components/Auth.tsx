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
      {/* Background Decorative Elements - More vibrant for Premium feel */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-brand-turquoise/20 rounded-full blur-[140px] animate-pulse"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[140px]"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.05)_0%,transparent_70%)]"></div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900/40 backdrop-blur-3xl p-10 rounded-[3rem] relative z-10 border border-white/10 shadow-[0_25px_80px_-15px_rgba(0,0,0,0.6)]"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-4 bg-brand-turquoise rounded-3xl mb-6 shadow-lg shadow-brand-turquoise/40 rotate-3 transition-transform hover:rotate-0">
            <ShieldCheck className="text-white" size={32} />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2 italic">
            TSV <span className="text-brand-turquoise not-italic">INTEL PRO</span>
          </h1>
          <div className="flex items-center justify-center gap-2">
            <div className="h-px w-8 bg-slate-700"></div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">Forensic Intelligence</p>
            <div className="h-px w-8 bg-slate-700"></div>
          </div>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-brand-turquoise uppercase tracking-widest ml-1 opacity-80">Credenciales de Acceso</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-turquoise transition-colors" size={18} />
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-950/80 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-brand-turquoise focus:ring-4 focus:ring-brand-turquoise/10 transition-all font-medium"
                placeholder="email@corporativo.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-turquoise transition-colors" size={18} />
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-950/80 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-brand-turquoise focus:ring-4 focus:ring-brand-turquoise/10 transition-all font-medium"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-start gap-3"
              >
                <AlertCircle className="text-red-500 shrink-0" size={18} />
                <p className="text-xs text-red-400 font-bold leading-relaxed">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {!supabase && (
            <button 
              type="button"
              onClick={() => {
                localStorage.setItem('tsv_mock_session', 'true');
                window.location.reload();
              }}
              className="w-full bg-white text-slate-950 font-black py-4 rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 border border-white"
            >
              <ShieldCheck size={20} className="text-brand-turquoise" />
              <span>DESBLOQUEAR MODO LOCAL</span>
            </button>
          )}

          {supabase && (
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-brand-turquoise hover:bg-brand-turquoise/90 text-slate-950 font-black py-4 rounded-2xl shadow-2xl shadow-brand-turquoise/30 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <div className="w-5 h-5 border-3 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn size={20} />
                  <span>{isLogin ? "AUTENTICACIÓN ELITE" : "REGISTRAR TERMINAL"}</span>
                  <Sparkles size={16} className="text-white/50 animate-pulse" />
                </>
              )}
            </button>
          )}

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center text-[9px] uppercase tracking-[0.3em] font-black">
              <span className="bg-slate-900/0 backdrop-blur-md px-4 text-slate-500">SSO Gateway</span>
            </div>
          </div>

          <button 
            type="button"
            onClick={async () => {
              setLoading(true);
              const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                  redirectTo: window.location.origin
                }
              });
              if (error) setError(error.message);
              setLoading(false);
            }}
            className="w-full bg-slate-800/40 hover:bg-slate-800/60 text-white font-bold py-4 rounded-2xl border border-white/5 transition-all flex items-center justify-center gap-3 group"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>Google Workspace</span>
          </button>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-white/5">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4">
            {isLogin ? "¿Nuevo en la plataforma?" : "¿Ya tienes una cuenta?"}
          </p>
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-brand-turquoise font-black text-xs hover:text-white transition-colors uppercase tracking-widest underline underline-offset-8"
          >
            {isLogin ? "Solicitar Acceso Partner" : "Acceder al Portal"}
          </button>
        </div>
      </motion.div>
      
      <div className="absolute bottom-8 text-slate-700 text-[9px] font-black uppercase tracking-[0.4em]">
        TSV Elite Intelligence Platform v3.0 — Secured By Supabase
      </div>
    </div>
  );
}
