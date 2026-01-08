
import React, { useEffect, useState, useMemo, useRef } from 'react';
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

  const totalActivitiesCount = filteredData.s.length + filteredData.v.length + filteredData.c.length + filteredData.g.length;

  useEffect(() => {
    setSyncStatus('SYNCING');
    storageService.pullFromCloud().then(ok => {
      setSyncStatus(ok ? 'SUCCESS' : 'ERROR');
      const newConfig = storageService.getConfig();
      setConfig(newConfig);
      setTempGreeting(newConfig.dashboardGreeting || 'Shalom');
      setTempInsight(newConfig.generalMessage || '');
      setTimeout(() => setSyncStatus('IDLE'), 3000);
    });

    if (!config.generalMessage && !localStorage.getItem('cap_cached_insight')) {
      getChaplaincyInsights(`Atividades: ${totalActivitiesCount}, Alunos: ${uniqueStudentsCount}`).then(res => {
        setInsight(res);
        localStorage.setItem('cap_cached_insight', res);
      });
    }
  }, []);

  const handleSaveGreeting = async () => {
    const newConfig = { ...config, dashboardGreeting: tempGreeting };
    await storageService.saveConfig(newConfig);
    setConfig(newConfig);
    setIsEditingGreeting(false);
  };

  const handleSaveInsight = async () => {
    const newConfig = { ...config, generalMessage: tempInsight };
    await storageService.saveConfig(newConfig);
    setConfig(newConfig);
    setIsEditingInsight(false);
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
                <div className="flex items-center gap-2">
                  <input 
                    className="text-3xl font-black bg-white border rounded-xl px-2 outline-none text-slate-800" 
                    value={tempGreeting} 
                    onChange={e => setTempGreeting(e.target.value)}
                  />
                  <button onClick={handleSaveGreeting} className="bg-success text-white p-2 rounded-lg text-xs">OK</button>
                </div>
              ) : (
                <h2 className="text-3xl font-black text-slate-800 tracking-tight italic flex items-center gap-3">
                  {config.dashboardGreeting || 'Shalom'}, {user.name.split(' ')[0]}!
                  {user.role === UserRole.ADMIN && <button onClick={() => setIsEditingGreeting(true)} className="text-slate-300 hover:text-primary text-sm opacity-0 group-hover:opacity-100 transition-opacity">edit</button>}
                </h2>
              )}
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cargo: {user.role}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-sm border border-slate-100">
          <span className={`w-3 h-3 rounded-full ${syncStatus === 'SUCCESS' ? 'bg-success animate-pulse' : syncStatus === 'SYNCING' ? 'bg-amber-400 animate-spin' : 'bg-slate-300'}`}></span>
          <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
            {syncStatus === 'SYNCING' ? 'Sincronizando...' : 'Sistema Online'}
          </span>
        </div>
      </div>

      {pendingVisits.length > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-2xl shadow-sm">
          <div className="flex items-start gap-4">
            <span className="text-2xl">⚠️</span>
            <div>
              <h4 className="font-black text-amber-800 uppercase tracking-tight">Retornos Pastorais Pendentes</h4>
              <p className="text-sm text-amber-700 italic">Você marcou {pendingVisits.length} atendimentos para retorno. Confira no módulo Colaboradores.</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Impacto Total', value: totalActivitiesCount, emoji: '📊', color: 'bg-primary/10 text-primary' },
          { label: 'Indivíduos Únicos', value: uniqueStudentsCount, emoji: '👤', color: 'bg-amber-100 text-amber-600' },
          { label: 'Classes Bíblicas', value: filteredData.c.length, emoji: '🎓', color: 'bg-purple-100 text-purple-600' },
          { label: 'Estudos Bíblicos', value: filteredData.s.length, emoji: '📖', color: 'bg-blue-50 text-blue-600' },
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
           <h3 className="text-sm font-black uppercase mb-6">Volume de Atividades por Área</h3>
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

        <div className="bg-primary p-10 rounded-premium text-white shadow-2xl flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💡</span>
                  <h3 className="text-lg font-black italic tracking-tight uppercase">Insight do Dia</h3>
                </div>
                {user.role === UserRole.ADMIN && !isEditingInsight && <button onClick={() => setIsEditingInsight(true)} className="text-[10px] font-black uppercase opacity-50 hover:opacity-100 transition-opacity">Editar</button>}
              </div>
              
              {isEditingInsight ? (
                <div className="space-y-4">
                  <textarea 
                    className="w-full h-32 bg-white/10 border border-white/20 rounded-xl p-3 text-sm outline-none font-medium"
                    value={tempInsight}
                    onChange={e => setTempInsight(e.target.value)}
                    placeholder="Escreva a mensagem ministerial global..."
                  />
                  <div className="flex gap-2">
                    <button onClick={handleSaveInsight} className="flex-1 py-2 bg-white text-primary rounded-xl font-black text-xs uppercase">Salvar para Todos</button>
                    <button onClick={() => setIsEditingInsight(false)} className="px-4 py-2 bg-white/10 rounded-xl font-black text-xs uppercase">Cancelar</button>
                  </div>
                </div>
              ) : (
                <p className="text-white/90 italic leading-relaxed font-medium">
                  "{config.generalMessage || insight}"
                </p>
              )}
            </div>
            <div className="mt-8 pt-6 border-t border-white/10 text-[9px] font-black uppercase opacity-50 tracking-widest relative z-10">
              {config.generalMessage ? 'Mensagem da Direção' : 'Analista de Dados Gemini IA'}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
