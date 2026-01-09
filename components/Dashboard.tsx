
import React, { useEffect, useState, useMemo } from 'react';
import { storageService } from '../services/storageService';
import { getChaplaincyInsights } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { User, UserRole, CloudConfig, StaffVisit } from '../types';

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [config, setConfig] = useState<CloudConfig>(storageService.getConfig());
  const [insight, setInsight] = useState<string>(() => {
    return localStorage.getItem('cap_cached_insight') || 'Carregando insights ministeriais...';
  });
  
  const [isEditingGreeting, setIsEditingGreeting] = useState(false);
  const [isEditingInsight, setIsEditingInsight] = useState(false);
  const [tempGreeting, setTempGreeting] = useState(config.dashboardGreeting || 'Shalom');
  const [tempInsight, setTempInsight] = useState(config.generalMessage || '');
  
  const [syncStatus, setSyncStatus] = useState<'IDLE' | 'SYNCING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [pendingVisits, setPendingVisits] = useState<StaffVisit[]>([]);
  
  const allStudies = storageService.getStudies();
  const allVisits = storageService.getVisits();
  const allClasses = storageService.getClasses();
  const allGroups = storageService.getGroups();

  const filteredData = useMemo(() => {
    const s = allStudies.filter(i => i.chaplainId === user.id);
    const v = allVisits.filter(i => i.chaplainId === user.id);
    const c = allClasses.filter(i => i.chaplainId === user.id);
    const g = allGroups.filter(i => i.chaplainId === user.id);
    
    return { s, v, c, g };
  }, [user.id, allStudies, allVisits, allClasses, allGroups]);

  useEffect(() => {
    const visitsToReturn = filteredData.v.filter(v => v.needsFollowUp);
    setPendingVisits(visitsToReturn);
  }, [filteredData.v]);

  const uniqueStudentsCount = useMemo(() => {
    const names = new Set<string>();
    filteredData.s.forEach(study => study.patientName && names.add(study.patientName.trim().toLowerCase()));
    filteredData.c.forEach(cls => cls.students.forEach(st => st && names.add(st.trim().toLowerCase())));
    return names.size;
  }, [filteredData]);

  const uniqueClassesCount = useMemo(() => {
    const classKeys = new Set<string>();
    filteredData.c.forEach(c => {
      const key = `${c.sector}-${[...c.students].sort().join(',')}`.toLowerCase();
      classKeys.add(key);
    });
    return classKeys.size;
  }, [filteredData.c]);

  const totalActivitiesCount = filteredData.s.length + filteredData.v.length + filteredData.c.length + filteredData.g.length;

  // Função de sincronização reforçada
  const refreshCloudData = async () => {
    setSyncStatus('SYNCING');
    const ok = await storageService.pullFromCloud();
    if (ok) {
      const newConfig = storageService.getConfig();
      // Força a atualização do estado local com os dados globais da nuvem
      setConfig(newConfig);
      setTempGreeting(newConfig.dashboardGreeting || 'Shalom');
      setTempInsight(newConfig.generalMessage || '');
      setSyncStatus('SUCCESS');
    } else {
      setSyncStatus('ERROR');
    }
    // Mantém o status visual por um tempo antes de voltar ao IDLE
    setTimeout(() => setSyncStatus('IDLE'), 3000);
  };

  useEffect(() => {
    // Sincroniza ao montar o componente para pegar as mensagens globais mais recentes
    refreshCloudData();

    if (!config.generalMessage && !localStorage.getItem('cap_cached_insight')) {
      getChaplaincyInsights(`Atividades Individuais: ${totalActivitiesCount}, Alunos Individuais: ${uniqueStudentsCount}`).then(res => {
        setInsight(res);
        localStorage.setItem('cap_cached_insight', res);
      });
    }
  }, [totalActivitiesCount, uniqueStudentsCount]);

  const handleSaveGreeting = async () => {
    setSyncStatus('SYNCING');
    const currentConfig = storageService.getConfig();
    const newConfig = { ...currentConfig, dashboardGreeting: tempGreeting };
    await storageService.saveConfig(newConfig);
    setConfig(newConfig);
    setIsEditingGreeting(false);
    setSyncStatus('SUCCESS');
    setTimeout(() => setSyncStatus('IDLE'), 2000);
  };

  const handleSaveInsight = async () => {
    setSyncStatus('SYNCING');
    const currentConfig = storageService.getConfig();
    const newConfig = { ...currentConfig, generalMessage: tempInsight };
    await storageService.saveConfig(newConfig);
    setConfig(newConfig);
    setIsEditingInsight(false);
    setSyncStatus('SUCCESS');
    setTimeout(() => setSyncStatus('IDLE'), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full border-4 border-white shadow-xl overflow-hidden bg-slate-200 flex items-center justify-center shrink-0">
            {user.photoUrl ? <img src={user.photoUrl} alt="Perfil" className="w-full h-full object-cover" /> : <span className="text-3xl">👤</span>}
          </div>
          <div>
            <div className="flex items-center gap-2">
              {isEditingGreeting && user.role === UserRole.ADMIN ? (
                <div className="flex items-center gap-2 animate-in slide-in-from-left-2">
                  <input 
                    className="text-2xl font-black bg-white border-2 border-primary rounded-xl px-3 py-1 outline-none text-slate-800 shadow-inner" 
                    value={tempGreeting} 
                    onChange={e => setTempGreeting(e.target.value)}
                    autoFocus
                  />
                  <button onClick={handleSaveGreeting} className="bg-success text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg hover:bg-green-600 transition-colors">SALVAR ONLINE</button>
                  <button onClick={() => setIsEditingGreeting(false)} className="text-slate-400 text-xs font-bold px-2">Cancelar</button>
                </div>
              ) : (
                <div className="flex items-center gap-3 group">
                  <h2 className="text-3xl font-black text-slate-800 tracking-tight italic">
                    {config.dashboardGreeting || 'Shalom'}, {user.name.split(' ')[0]}!
                  </h2>
                  {user.role === UserRole.ADMIN && (
                    <button 
                      onClick={() => setIsEditingGreeting(true)} 
                      className="p-2 bg-primary text-white rounded-xl shadow-lg hover:scale-110 active:scale-95 transition-all flex items-center justify-center"
                      title="Alterar Saudação para Todos"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cargo: {user.role}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-sm border border-slate-100">
          <span className={`w-3 h-3 rounded-full ${
            syncStatus === 'ERROR' 
              ? 'bg-danger' 
              : syncStatus === 'SYNCING' 
                ? 'bg-amber-400 animate-spin' 
                : 'bg-success animate-pulse'
          }`}></span>
          <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
            {syncStatus === 'SYNCING' ? 'Sincronizando...' : 'Servidor Online'}
          </span>
        </div>
      </div>

      {pendingVisits.length > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-2xl shadow-sm">
          <div className="flex items-start gap-4">
            <span className="text-2xl">⚠️</span>
            <div>
              <h4 className="font-black text-amber-800 uppercase tracking-tight">Seus Retornos Pastorais Pendentes</h4>
              <p className="text-sm text-amber-700 italic">Você possui {pendingVisits.length} atendimentos marcados para retorno individual. Confira no módulo Colaboradores.</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Meu Impacto', value: totalActivitiesCount, emoji: '📊', color: 'bg-primary/10 text-primary' },
          { label: 'Meus Alunos', value: uniqueStudentsCount, emoji: '👤', color: 'bg-amber-100 text-amber-600' },
          { label: 'Minhas Classes', value: uniqueClassesCount, emoji: '🎓', color: 'bg-purple-100 text-purple-600' },
          { label: 'Meus Estudos', value: filteredData.s.length, emoji: '📖', color: 'bg-blue-50 text-blue-600' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-premium border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-lg transition-all">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${stat.color}`}>{stat.emoji}</div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-black text-slate-800 tracking-tighter">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-premium border border-slate-100 shadow-xl">
           <h3 className="text-sm font-black uppercase mb-6 text-slate-400">Minha Produtividade por Área</h3>
           <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={[
                   { name: 'Estudos', total: filteredData.s.length },
                   { name: 'Visitas', total: filteredData.v.length },
                   { name: 'Classes', total: filteredData.c.length },
                   { name: 'PGs', total: filteredData.g.length },
                 ]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                    <Tooltip contentStyle={{borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                    <Bar dataKey="total" fill="#005a9c" radius={[8, 8, 0, 0]} />
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-primary p-10 rounded-premium text-white shadow-2xl flex flex-col justify-between relative overflow-hidden group min-h-[320px]">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💡</span>
                  <h3 className="text-lg font-black italic tracking-tight uppercase">Mural de Insights</h3>
                </div>
                {user.role === UserRole.ADMIN && !isEditingInsight && (
                  <button 
                    onClick={() => setIsEditingInsight(true)} 
                    className="p-3 bg-white text-primary rounded-xl shadow-xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center"
                    title="Editar Mural Global"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                )}
              </div>
              
              {isEditingInsight ? (
                <div className="space-y-4 animate-in zoom-in-95 duration-200">
                  <textarea 
                    className="w-full h-32 bg-white/10 border-2 border-white/30 rounded-xl p-4 text-sm outline-none font-bold text-white placeholder-white/40 focus:border-white/60 transition-all"
                    value={tempInsight}
                    onChange={e => setTempInsight(e.target.value)}
                    placeholder="Escreva a mensagem ministerial que todos verão..."
                  />
                  <div className="flex gap-2">
                    <button onClick={handleSaveInsight} className="flex-1 py-3 bg-white text-primary rounded-xl font-black text-xs uppercase shadow-xl hover:bg-slate-100 transition-colors">ATUALIZAR MURAL</button>
                    <button onClick={() => setIsEditingInsight(false)} className="px-4 py-3 bg-white/20 rounded-xl font-black text-xs uppercase hover:bg-white/30 transition-colors">Sair</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-white text-xl font-medium leading-relaxed italic border-l-4 border-white/20 pl-4 py-2">
                    "{config.generalMessage || insight}"
                  </p>
                </div>
              )}
            </div>
            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between relative z-10">
              <span className="text-[9px] font-black uppercase opacity-60 tracking-widest">
                {config.generalMessage ? 'Mensagem da Direção' : 'Insight da Inteligência Artificial'}
              </span>
              <button onClick={refreshCloudData} className="p-1 hover:rotate-180 transition-transform duration-700">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                 </svg>
              </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
