import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ShieldAlert, LogIn } from 'lucide-react';

export function Login() {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 text-center max-w-md w-full">
        <div className="w-20 h-20 bg-brand-turquoise/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldAlert size={40} className="text-brand-turquoise" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Acceso Protegido</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8">
          Inicia sesión de forma segura para acceder a la Bóveda de Reportes y guardar en la nube.
        </p>
        <button
          onClick={signInWithGoogle}
          className="w-full py-3 px-4 bg-brand-dark hover:bg-black text-white rounded-xl font-bold flex items-center justify-center gap-3 transition-colors shadow-lg shadow-slate-200 dark:shadow-none"
        >
          <LogIn size={20} />
          Continuar con Google
        </button>
      </div>
    </div>
  );
}
