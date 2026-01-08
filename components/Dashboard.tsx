import React, { useEffect, useState, useMemo, useRef } from 'react';
import { storageService } from '../services/storageService';
import { getChaplaincyInsights } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { User, UserRole, CloudConfig, StaffVisit } from '../types';

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [insight, setInsight] = useState<string>(() => {
    return localStorage.getItem('cap_cached_insight') || 'Carregando insights ministeriais...';
  });
  const [config, setConfig] = useState<CloudConfig>(storageService.getConfig());
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'IDLE' | 'SYNCING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [pendingVisits, setPendingVisits] = useState<StaffVisit[]>([]);
  
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

  useEffect(() => {
    const visitsToReturn = filteredData.v.filter(v => v.needsFollowUp);
    setPendingVisits(visitsToReturn);
  }, [filteredData.v]);

  const uniqueStudentsCount = useMemo(() => {
    const names = new Set<string>();
    filteredData.s.forEach(study => {
      if (study.patientName) names.add(study.patientName.trim().toLowerCase());
    });
    filteredData.c.forEach(cls => {
      cls.students.forEach(student => {
        if (student) names.add(student.trim().toLowerCase());
      });
    });
    return names.size;
  }, [filteredData]);

  const totalActivitiesCount = filteredData.s.length + filteredData.v.length + filteredData.c.length + filteredData.g.length;

  useEffect(() => {
    if (config.databaseURL) {
      setSyncStatus('SYNCING');
      storageService.pullFromCloud().then(ok => {
        setSyncStatus(ok ? 'SUCCESS' : 'ERROR');
        setTimeout(() => setSyncStatus('IDLE'), 3000);
      });
    }

    if (hasAttemptedIA.current || config.generalMessage) return;
    hasAttemptedIA.current = true;
    setIsLoadingInsight(true);
    getChaplaincyInsights(`Atividades: ${totalActivitiesCount}, Alunos Únicos: ${uniqueStudentsCount}`).then(res => {
      setInsight(res);
      localStorage.setItem('cap_cached_insight', res);
    }).finally(() => setIsLoadingInsight(false));
  }, [totalActivitiesCount, uniqueStudentsCount, config.generalMessage, config.databaseURL]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-6">
        <div className="w-20 h-20 rounded-full border-4 border-white shadow-xl overflow-hidden bg-slate-200 flex items-center justify-center shrink-0">
          {user.photoUrl ? <img src={user.photoUrl} alt="Perfil" className="w-full h-full object-cover" /> : <span className="text-3xl">👤</span>}
        </div>
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight italic">Shalom, {user.name}!</h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cargo: {user.role === UserRole.ADMIN ? 'Administrador' : user.role === UserRole.CHAPLAIN ? 'Capelão' : 'Assistente'}</p>
        </div>
      </div>

      {pendingVisits.length > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-2xl shadow-sm animate-in slide-in-from-top duration-700">
          <div className="flex items-start gap-4">
            <span className="text-2xl">⚠️</span>
            <div>
              <h4 className="font-black text-amber-800 uppercase tracking-tight">Pendências de Retorno Pastorais</h4>
              <p className="text-sm text-amber-700 italic">Existem {pendingVisits.length} colaboradores que necessitam de acompanhamento ou retorno pastoral conforme seus registros.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {pendingVisits.slice(0, 5).map(v => (
                  <span key={v.id} className="px-3 py-1 bg-amber-200/50 rounded-full text-[10px] font-bold text-amber-900 shadow-sm border border-amber-300/20">{v.staffName}</span>
                ))}
                {pendingVisits.length > 5 && <span className="text-[10px] text-amber-600 font-black italic">e mais {pendingVisits.length - 5}...</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Impacto Total', value: totalActivitiesCount, emoji: '📊', color: 'bg-primary/10 text-primary' },
          { label: 'Indivíduos Únicos', value: uniqueStudentsCount, emoji: '👤', color: 'bg-amber-100 text-amber-600' },
          { label: 'Classes Bíblicas', value: filteredData.c.length, emoji: '🎓', color: 'bg-purple-100 text-purple-600' },
          { label: 'Ensino Bíblico', value: filteredData.s.length + filteredData.c.length, emoji: '📖', color: 'bg-blue-50 text-blue-600' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-premium border border-slate-100 shadow-sm flex items-center gap-4 group hover:shadow-lg transition-all hover:scale-[1.03]">
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
           <h3 className="text-sm font-black uppercase mb-6 flex items-center gap-2">Produtividade Ministerial por Módulo</h3>
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
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                    <Bar dataKey="total" fill="#005a9c" radius={[8, 8, 0, 0]} />
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-primary p-10 rounded-premium text-white shadow-2xl flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl animate-pulse">💡</span>
                <h3 className="text-lg font-black italic tracking-tight">Insight Ministerial (IA)</h3>
              </div>
              <p className="text-white/90 italic leading-relaxed font-medium">
                "{config.generalMessage || insight}"
              </p>
            </div>
            <div className="mt-8 pt-6 border-t border-white/10 text-[9px] font-black uppercase opacity-50 tracking-widest relative z-10">Analista de Dados Gemini v3.1</div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;