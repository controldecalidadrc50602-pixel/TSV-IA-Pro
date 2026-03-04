import React, { useState } from 'react';
import { User, Lock, ArrowRight } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulated login
    if (email && password) {
      onLogin();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div className="w-16 h-16 bg-brand-turquoise/20 rounded-2xl flex items-center justify-center mb-6 text-brand-turquoise">
        <Lock size={32} />
      </div>
      <h2 className="text-2xl font-bold text-brand-dark mb-2">Bienvenido</h2>
      <p className="text-slate-500 mb-8 text-sm">Accede a TSV Intelligence Pro</p>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="email"
            placeholder="Usuario / Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-turquoise focus:ring-2 focus:ring-brand-turquoise/20 transition-all text-sm"
            required
          />
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-turquoise focus:ring-2 focus:ring-brand-turquoise/20 transition-all text-sm"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-brand-turquoise hover:brightness-95 text-brand-dark font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-4 shadow-lg shadow-brand-turquoise/20"
        >
          <span>Iniciar Sesión</span>
          <ArrowRight size={18} />
        </button>
      </form>
      
      <p className="mt-8 text-xs text-slate-400">
        Versión Demo Empresarial v1.0
      </p>
    </div>
  );
}
