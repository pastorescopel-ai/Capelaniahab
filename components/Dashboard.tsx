import React, { useEffect, useState, useMemo, useRef } from 'react';
import { storageService } from '../services/storageService';
import { getChaplaincyInsights } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { User, UserRole, CloudConfig } from '../types';

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [insight, setInsight] = useState<string>(() => {
    return localStorage.getItem('cap_cached_insight') || 'Carregando insights ministeriais...';
  });
  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const [config, setConfig] = useState<CloudConfig>(storageService.getConfig());
  const [tempMessage, setTempMessage] = useState(config.generalMessage || '');
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'IDLE' | 'SYNCING' | 'SUCCESS' | 'ERROR'>('IDLE');
  
  const hasAttemptedIA = useRef(false);

  const allStudies = storageService.getStudies();
  const allVisits = storageService.getVisits();
  const allClasses = storageService.getClasses();
  const allGroups = storageService.getGroups();

  const filteredData = useMemo(() => {
    let s = allStudies;
    let v = allVisits;
    let c = allClasses;
    let g = allGroups;

    if (user.role !== UserRole.ADMIN) {
      s = s.filter(i => i.chaplainId === user.id);
      v = v.filter(i => i.chaplainId === user.id);
      c = c.filter(i => i.chaplainId === user.id);
      g = g.filter(i => i.chaplainId === user.id);
    }
    return { s, v, c, g };
  }, [user.id, user.role, allStudies, allVisits, allClasses, allGroups]);

  const uniqueStudentsCount = useMemo(() => {
    const names = new Set<string>();
    filteredData.s.forEach(study => names.add(study.patientName.trim().toLowerCase()));
    filteredData.c.forEach(cls => cls.students.forEach(student => names.add(student.trim().toLowerCase())));
    return names.size;
  }, [filteredData]);

  const totalActivitiesCount = filteredData.s.length + filteredData.v.length + filteredData.c.length + filteredData.g.length;

  useEffect(() => {
    // Sincronização automática na abertura do dashboard
    if (config.databaseURL) {
      setSyncStatus('SYNCING');
      storageService.pullFromCloud().then(ok => {
        setSyncStatus(ok ? 'SUCCESS' : 'ERROR');
        setTimeout(() => setSyncStatus('IDLE'), 3000);
      });
    }

    const CACHE_KEY = 'cap_cached_insight';
    const TIME_KEY = 'cap_insight_timestamp';
    const DATA_HASH_KEY = 'cap_insight_data_hash';
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    
    const now = Date.now();
    const lastTime = parseInt(localStorage.getItem(TIME_KEY) || '0');
    const cachedInsight = localStorage.getItem(CACHE_KEY);
    const lastDataHash = localStorage.getItem(DATA_HASH_KEY);

    if (config.generalMessage) return;

    const currentDataHash = `${totalActivitiesCount}-${uniqueStudentsCount}`;
    const isDataSame = lastDataHash === currentDataHash;
    const isCacheRecent = (now - lastTime < TWENTY_FOUR_HOURS);

    if (hasAttemptedIA.current) return;
    if (cachedInsight && isDataSame && isCacheRecent) {
      setInsight(cachedInsight);
      hasAttemptedIA.current = true;
      return;
    }

    if (!hasAttemptedIA.current) {
      hasAttemptedIA.current = true;
      setIsLoadingInsight(true);
      const summary = `Atividades: ${totalActivitiesCount}, Alunos: ${uniqueStudentsCount}, Estudos: ${filteredData.s.length}, Visitas: ${filteredData.v.length}.`;
      getChaplaincyInsights(summary).then(res => {
        setInsight(res);
        localStorage.setItem(CACHE_KEY, res);
        localStorage.setItem(TIME_KEY, now.toString());
        localStorage.setItem(DATA_HASH_KEY, currentDataHash);
      }).catch(() => {
        setInsight(cachedInsight || "Seu trabalho hoje é o consolo de amanhã.");
      }).finally(() => setIsLoadingInsight(false));
    }
  }, [totalActivitiesCount, uniqueStudentsCount, config.generalMessage, filteredData, config.databaseURL]);

  const handleSaveMessage = () => {
    const newConfig = { ...config, generalMessage: tempMessage };
    storageService.saveConfig(newConfig);
    setConfig(newConfig);
    setIsEditingMessage(false);
  };

  const handleClearMessage = () => {
    const newConfig = { ...config, generalMessage: '' };
    storageService.saveConfig(newConfig);
    setConfig(newConfig);
    setTempMessage('');
    setIsEditingMessage(false);
    localStorage.removeItem('cap_cached_insight');
    hasAttemptedIA.current = false;
  };

  const stats = [
    { label: 'Impacto Total', value: totalActivitiesCount, emoji: '📊', color: 'bg-primary/10 text-primary' },
    { label: 'Alunos Únicos', value: uniqueStudentsCount, emoji: '👤', color: 'bg-amber-100 text-amber-600' },
    { label: 'Ensino Bíblico', value: filteredData.s.length + filteredData.c.length, emoji: '📖', color: 'bg-blue-50 text-blue-600' },
    { label: 'Apoio Equipe', value: filteredData.v.length, emoji: '🤝', color: 'bg-green-50 text-green-600' },
  ];

  const chartData = [
    { name: 'Estudos', total: filteredData.s.length },
    { name: 'Visitas', total: filteredData.v.length },
    { name: 'Classes', total: filteredData.c.length },
    { name: 'PGs', total: filteredData.g.length },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full border-4 border-white shadow-xl overflow-hidden bg-slate-200 flex items-center justify-center shrink-0">
            {user.photoUrl ? (
              <img src={user.photoUrl} alt="Perfil" className="w-full h-full object-cover" />
            ) : ( <span className="text-3xl">👤</span> )}
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight italic">Shalom, {user.name}!</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full ${syncStatus === 'SYNCING' ? 'bg-amber-400 animate-pulse' : syncStatus === 'SUCCESS' ? 'bg-success' : syncStatus === 'ERROR' ? 'bg-danger' : 'bg-slate-300'}`}></span>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {syncStatus === 'SYNCING' ? 'Sincronizando Nuvem...' : syncStatus === 'SUCCESS' ? 'Dados Online Atualizados' : syncStatus === 'ERROR' ? 'Erro na Conexão Cloud' : 'Sistema Pronto'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-premium border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-lg group">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-transform group-hover:scale-110 ${stat.color}`}>
              {stat.emoji}
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-black text-slate-800 tracking-tighter">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-premium border border-slate-100 shadow-xl">
          <h3 className="text-lg font-black text-slate-800 mb-8 uppercase tracking-widest text-[11px] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            Produtividade Ministerial
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 600}} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }} />
                <Bar dataKey="total" fill="#005a9c" radius={[12, 12, 0, 0]} barSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gradient-to-br from-primary to-accent p-10 rounded-premium text-white shadow-2xl flex flex-col justify-between relative overflow-hidden group min-h-[300px]">
          <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            {user.role === UserRole.ADMIN && !isEditingMessage && (
              <button 
                onClick={() => setIsEditingMessage(true)}
                className="w-12 h-12 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center backdrop-blur-md transition-all border border-white/20"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            )}
          </div>

          <div className="flex-1 flex flex-col relative z-0">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">{config.generalMessage ? '📢' : '💡'}</span>
              <h3 className="text-xl font-black italic tracking-tight">
                {config.generalMessage ? 'Mensagem Direção' : 'IA Strategist'}
              </h3>
            </div>

            {isEditingMessage ? (
              <div className="flex-1 flex flex-col space-y-4 animate-in slide-in-from-right-4 duration-300">
                <textarea 
                  className="flex-1 w-full p-5 bg-white/10 border border-white/20 rounded-[2rem] text-white placeholder-white/40 outline-none focus:ring-4 focus:ring-white/10 resize-none text-sm font-semibold"
                  placeholder="Inspire sua equipe hoje..."
                  value={tempMessage}
                  onChange={(e) => setTempMessage(e.target.value)}
                />
                <div className="flex gap-3">
                  <button onClick={handleSaveMessage} className="flex-1 py-4 bg-white text-primary rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all">Publicar</button>
                  <button onClick={handleClearMessage} className="px-6 py-4 bg-white/10 text-white rounded-2xl font-bold text-xs hover:bg-danger transition-all">Remover</button>
                </div>
              </div>
            ) : (
              <div className="relative">
                {isLoadingInsight && (
                  <div className="absolute inset-0 flex items-center justify-center bg-transparent z-10">
                    <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  </div>
                )}
                <p className={`text-white/90 italic leading-relaxed text-base font-medium animate-in fade-in zoom-in duration-500 ${isLoadingInsight ? 'opacity-20 blur-sm' : ''}`}>
                  "{config.generalMessage || insight}"
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 pt-8 border-t border-white/20 flex items-center justify-between">
            <p className="text-[9px] font-black tracking-[0.3em] opacity-50 uppercase">
              {config.generalMessage ? `Admin Broadcast` : `Gemini AI Engine`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;