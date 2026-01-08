
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  
  const config = storageService.getConfig();

  useEffect(() => {
    const autoSync = async () => {
      setIsSyncing(true);
      await storageService.pullFromCloud();
      setIsSyncing(false);
    };
    autoSync();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSyncing(true);
    await storageService.pullFromCloud();
    const user = storageService.login(email, password);
    setIsSyncing(false);

    if (user) {
      onLogin(user);
    } else {
      setError('E-mail ou senha incorretos. Verifique sua conexão.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 relative">
      <div className="w-full max-w-md bg-white rounded-premium shadow-2xl shadow-primary/10 p-10 space-y-8 animate-in fade-in zoom-in duration-500 relative z-10">
        <div className="text-center">
          <div className="w-24 h-24 bg-white border border-slate-100 rounded-3xl flex items-center justify-center text-white font-bold text-4xl mx-auto mb-6 shadow-xl overflow-hidden relative">
            {config.appLogo ? (
              <img src={config.appLogo} alt="Logo" className="w-full h-full object-contain p-2" />
            ) : (
              <div className="bg-primary w-full h-full flex items-center justify-center italic">C</div>
            )}
            {isSyncing && (
              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic text-center">CAPELANIA HAB</h1>
          <p className="text-slate-500 mt-2 font-bold uppercase text-[10px] tracking-[0.2em] opacity-60 italic text-center">Acesso ao Sistema</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">E-mail</label>
              <input
                type="email"
                required
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Senha</label>
              <input
                type="password"
                required
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold"
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
              />
              {error && <p className="text-danger text-[10px] mt-2 ml-1 font-black uppercase tracking-tighter">{error}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSyncing}
            className="w-full py-5 bg-primary text-white rounded-premium font-black text-xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            {isSyncing ? 'Conectando...' : 'Entrar'}
          </button>
          
          <div className="flex items-center justify-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-400 animate-pulse' : 'bg-success'}`}></span>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Sincronização Cloud Ativa</span>
          </div>
        </form>
      </div>

      <div className="absolute top-10 right-10 flex flex-col items-end opacity-10 pointer-events-none">
          <p className="text-6xl font-black italic text-slate-200 uppercase leading-none">Gestão</p>
          <p className="text-6xl font-black italic text-slate-200 uppercase leading-none">Capelania</p>
      </div>
    </div>
  );
};

export default Login;
