
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { storageService } from '../services/storageService';
import { User, BiblicalStudy, BiblicalClass, SmallGroup, StaffVisit } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ReportsProps {
  user: User;
}

const Reports: React.FC<ReportsProps> = ({ user }) => {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
  });
  
  const [selectedChaplain, setSelectedChaplain] = useState<string>('ALL');
  const [showPreview, setShowPreview] = useState<boolean>(false);

  const [data, setData] = useState({
    studies: [] as BiblicalStudy[],
    classes: [] as BiblicalClass[],
    groups: [] as SmallGroup[],
    visits: [] as StaffVisit[]
  });

  const config = storageService.getConfig();
  const allUsers = storageService.getUsers();

  const loadFilteredData = useCallback(() => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime() + 86399999;
    
    const filterFn = (items: any[]) => items.filter(item => {
        const itemDate = new Date(item.date || item.createdAt).getTime();
        return (itemDate >= start && itemDate <= end) && (selectedChaplain === 'ALL' || item.chaplainId === selectedChaplain);
    });

    setData({
      studies: filterFn(storageService.getStudies()),
      classes: filterFn(storageService.getClasses()),
      groups: filterFn(storageService.getGroups()),
      visits: filterFn(storageService.getVisits())
    });
  }, [startDate, endDate, selectedChaplain]);

  useEffect(() => { loadFilteredData(); }, [loadFilteredData]);

  const uniqueStudentsTotal = useMemo(() => {
    const names = new Set<string>();
    data.studies.forEach(s => s.patientName && names.add(s.patientName.trim().toLowerCase()));
    data.classes.forEach(c => c.students.forEach(st => st && names.add(st.trim().toLowerCase())));
    return names.size;
  }, [data]);

  // Gráficos Individuais por Capelão
  const chartDataStudies = useMemo(() => {
    return allUsers.map(u => ({
      name: u.name.split(' ')[0],
      total: data.studies.filter(s => s.chaplainId === u.id).length
    })).filter(d => d.total >= 0); // Mostra até quem tem 0 para manter o card preenchido
  }, [allUsers, data.studies]);

  const chartDataClasses = useMemo(() => {
    return allUsers.map(u => ({
      name: u.name.split(' ')[0],
      total: data.classes.filter(c => c.chaplainId === u.id).length
    })).filter(d => d.total >= 0);
  }, [allUsers, data.classes]);

  const ReportContent = () => (
    <div className="bg-white p-10 text-slate-900 border-[10px] border-slate-50 min-h-screen">
      <div className="flex items-center justify-between border-b-4 border-primary pb-6 mb-8">
        <div className="flex items-center gap-6">
          {config.reportLogo ? <img src={config.reportLogo} className="h-20 w-auto object-contain" /> : <div className="w-16 h-16 bg-primary text-white font-black flex items-center justify-center rounded-2xl text-2xl italic">C</div>}
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900">Relatório de Atividades</h1>
            <p className="text-primary font-bold uppercase tracking-widest text-xs">Gestão de Capelania e Ensino Bíblico</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pessoas Únicas Alcançadas</p>
          <p className="text-4xl font-black text-slate-900">{uniqueStudentsTotal}</p>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4 mb-10">
        {[
          { label: 'Total Atividades', val: data.studies.length + data.classes.length + data.groups.length + data.visits.length, color: 'text-slate-900' },
          { label: 'Estudos Bíblicos', val: data.studies.length, color: 'text-blue-600' },
          { label: 'Classes Bíblicas', val: data.classes.length, color: 'text-purple-600' },
          { label: 'Impacto Único', val: uniqueStudentsTotal, color: 'text-amber-600' },
          { label: 'Visitas Colab.', val: data.visits.length, color: 'text-green-600' }
        ].map((kpi, i) => (
          <div key={i} className="p-4 bg-slate-50 rounded-2xl text-center border border-slate-100">
            <p className="text-[8px] font-black text-slate-400 uppercase mb-1">{kpi.label}</p>
            <p className={`text-2xl font-black ${kpi.color}`}>{kpi.val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
         <section className="space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
            <h3 className="text-xs font-black uppercase border-b border-slate-200 pb-2 flex items-center gap-2">📖 Estudos por Capelão</h3>
            <div className="h-48">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartDataStudies}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                     <XAxis dataKey="name" tick={{fontSize: 9, fontWeight: 700}} axisLine={false} tickLine={false} />
                     <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9}} />
                     <Tooltip contentStyle={{borderRadius: '10px', border: 'none'}} />
                     <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </section>
         <section className="space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
            <h3 className="text-xs font-black uppercase border-b border-slate-200 pb-2 flex items-center gap-2">🎓 Classes por Capelão</h3>
            <div className="h-48">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartDataClasses}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                     <XAxis dataKey="name" tick={{fontSize: 9, fontWeight: 700}} axisLine={false} tickLine={false} />
                     <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9}} />
                     <Tooltip contentStyle={{borderRadius: '10px', border: 'none'}} />
                     <Bar dataKey="total" fill="#a855f7" radius={[4, 4, 0, 0]} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </section>
      </div>

      <div className="mt-20 flex justify-around border-t border-slate-100 pt-10">
         <div className="text-center w-60 border-t border-slate-900 pt-2"><p className="text-[10px] font-black uppercase tracking-widest">Coordenação de Capelania</p></div>
         <div className="text-center w-60 border-t border-slate-900 pt-2"><p className="text-[10px] font-black uppercase tracking-widest">Direção Executiva</p></div>
      </div>
    </div>
  );

  return (
    <div className="space-y-10 pb-40">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 print:hidden">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight italic">Relatórios Consolidados</h2>
          <p className="text-slate-500 font-medium italic">Análise técnica de produtividade e alcance ministerial.</p>
        </div>
        <div className="flex flex-wrap items-end gap-4 bg-white p-6 rounded-premium border border-slate-100 shadow-xl">
           <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="px-4 py-2 bg-slate-50 border-none rounded-xl font-bold text-slate-600 outline-none" />
           <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="px-4 py-2 bg-slate-50 border-none rounded-xl font-bold text-slate-600 outline-none" />
           <select value={selectedChaplain} onChange={e => setSelectedChaplain(e.target.value)} className="px-4 py-2 bg-slate-50 border-none rounded-xl font-bold text-slate-600 outline-none">
              <option value="ALL">Toda a Equipe</option>
              {allUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
           </select>
        </div>
      </div>

      <div className="flex justify-center print:hidden">
        <button onClick={() => setShowPreview(true)} className="px-20 py-6 bg-slate-900 text-white rounded-premium font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-2xl">
           VISUALIZAR PARA IMPRESSÃO 📄
        </button>
      </div>

      {showPreview && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[1000] overflow-y-auto p-4 md:p-12 flex flex-col items-center">
          <div className="w-full max-w-[21cm] flex items-center justify-between mb-8 bg-white/10 p-6 rounded-3xl border border-white/10 shadow-3xl">
             <button onClick={() => setShowPreview(false)} className="px-8 py-4 bg-white/10 text-white rounded-xl font-black text-xs uppercase tracking-widest">Fechar</button>
             <button onClick={() => window.print()} className="px-14 py-4 bg-primary text-white rounded-xl font-black text-sm shadow-3xl uppercase tracking-widest">Gerar PDF / Imprimir 📄</button>
          </div>
          <div className="bg-white shadow-2xl scale-90 md:scale-100 origin-top overflow-visible">
            <ReportContent />
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
