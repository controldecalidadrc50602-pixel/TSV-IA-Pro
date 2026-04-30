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

          {!supabase && (
            <button 
              type="button"
              onClick={() => {
                localStorage.setItem('tsv_mock_session', 'true');
                window.location.reload();
              }}
              className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-black py-4 rounded-2xl shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700"
            >
              <ShieldCheck size={20} className="text-brand-turquoise" />
              <span>Acceder en Modo Local</span>
            </button>
          )}

          {supabase && (
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
          )}

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
              <span className="bg-slate-950 px-4 text-slate-600">O continuar con</span>
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
            className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl border border-white/10 transition-all flex items-center justify-center gap-3 group"
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
