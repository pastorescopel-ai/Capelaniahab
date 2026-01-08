
import React, { useState } from 'react';
import { storageService } from '../services/storageService';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const config = storageService.getConfig();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = storageService.login(email, password);
    if (user) {
      onLogin(user);
    } else {
      setError('Credenciais inválidas. Verifique e-mail e senha.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md bg-white rounded-premium shadow-2xl shadow-primary/10 p-10 space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center">
          <div className="w-24 h-24 bg-white border border-slate-100 rounded-3xl flex items-center justify-center text-white font-bold text-4xl mx-auto mb-6 shadow-xl overflow-hidden">
            {config.appLogo ? (
              <img src={config.appLogo} alt="Logo" className="w-full h-full object-contain p-2" />
            ) : (
              <div className="bg-primary w-full h-full flex items-center justify-center">C</div>
            )}
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Capelania Pro</h1>
          <p className="text-slate-500 mt-2 font-medium">Gestão Hospitalar & Atendimento</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">
                E-mail
              </label>
              <input
                type="email"
                required
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-premium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium"
                placeholder="exemplo@gmail.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">
                Senha
              </label>
              <input
                type="password"
                required
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-premium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
              />
              {error && <p className="text-danger text-xs mt-2 ml-1 font-bold">{error}</p>}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-5 bg-primary text-white rounded-premium font-black text-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Entrar no Sistema
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
