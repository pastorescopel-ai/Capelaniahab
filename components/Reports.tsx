
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { storageService } from '../services/storageService';
import { User, BiblicalStudy, BiblicalClass, SmallGroup, StaffVisit } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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
        const dateInRange = itemDate >= start && itemDate <= end;
        const chaplainMatches = selectedChaplain === 'ALL' || item.chaplainId === selectedChaplain;
        return dateInRange && chaplainMatches;
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
  }, [data.studies, data.classes]);

  const chaplainPerformanceData = useMemo(() => {
    return allUsers.map(u => {
      const uStudies = data.studies.filter(s => s.chaplainId === u.id).length;
      const uClasses = data.classes.filter(c => c.chaplainId === u.id).length;
      const uGroups = data.groups.filter(g => g.chaplainId === u.id).length;
      const uVisits = data.visits.filter(v => v.chaplainId === u.id).length;
      
      return {
        name: u.name.split(' ')[0],
        Estudos: uStudies,
        Classes: uClasses,
        Grupos: uGroups,
        Visitas: uVisits,
        Total: uStudies + uClasses + uGroups + uVisits
      };
    }).filter(d => d.Total > 0);
  }, [allUsers, data]);

  const ReportView = () => (
    <div id="printable-report" className="bg-white p-[15mm] text-slate-900 shadow-2xl mx-auto border border-slate-200" style={{ width: '210mm', minHeight: '297mm' }}>
      {/* Header do Relatório */}
      <div className="flex items-center justify-between border-b-4 border-primary pb-6 mb-8">
        <div className="flex items-center gap-6">
          <div className="h-24 w-24 flex items-center justify-center">
            {config.reportLogo ? (
              <img src={config.reportLogo} className="max-h-full max-w-full object-contain" />
            ) : (
              <div className="w-full h-full bg-primary rounded-2xl flex items-center justify-center text-white font-black text-4xl italic">C</div>
            )}
          </div>
          <div>
            <h1 style={{ fontSize: `${config.reportTitleFontSize}px` }} className="font-black uppercase tracking-tighter leading-none">{config.reportTitle}</h1>
            <p style={{ fontSize: `${config.reportSubtitleFontSize}px` }} className="text-primary font-bold uppercase tracking-widest mt-1">{config.reportSubtitle}</p>
          </div>
        </div>
        <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase">Estudantes Únicos</p>
            <p className="text-5xl font-black text-slate-800 leading-none">{uniqueStudentsTotal}</p>
        </div>
      </div>

      <div className="mb-8 flex justify-between items-end">
        <p className="text-[10px] font-black text-slate-400 uppercase">
            Período: {new Date(startDate).toLocaleDateString()} a {new Date(endDate).toLocaleDateString()}<br/>
            Filtro: {selectedChaplain === 'ALL' ? 'Equipe Completa' : allUsers.find(u => u.id === selectedChaplain)?.name}
        </p>
        <p className="text-[10px] font-black text-slate-300 uppercase italic">Emitido em {new Date().toLocaleString()}</p>
      </div>

      {/* Cards de Totais */}
      <div className="grid grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Estudos Bíblicos', val: data.studies.length, color: 'bg-blue-50 text-blue-600', emoji: '📖' },
          { label: 'Classes Bíblicas', val: data.classes.length, color: 'bg-purple-50 text-purple-600', emoji: '🎓' },
          { label: 'Pequenos Grupos', val: data.groups.length, color: 'bg-orange-50 text-orange-600', emoji: '🏠' },
          { label: 'Apoio Colaborador', val: data.visits.length, color: 'bg-green-50 text-green-600', emoji: '🤝' }
        ].map((card, i) => (
          <div key={i} className={`p-4 rounded-3xl border border-slate-100 flex flex-col items-center ${card.color}`}>
            <span className="text-2xl mb-1">{card.emoji}</span>
            <p className="text-[8px] font-black uppercase opacity-60 text-center">{card.label}</p>
            <p className="text-3xl font-black">{card.val}</p>
          </div>
        ))}
      </div>

      {/* Gráfico no Relatório */}
      <div className="space-y-10">
        <section className="bg-slate-50 p-8 rounded-premium border border-slate-100">
           <h3 className="text-xs font-black uppercase text-slate-500 mb-6 flex items-center gap-2">📊 Desempenho por Capelão</h3>
           <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={chaplainPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{fontSize: 10, fontWeight: 700}} axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                    <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '12px', border: 'none'}} />
                    <Legend wrapperStyle={{paddingTop: '20px', fontSize: '10px', fontWeight: 'bold'}} />
                    <Bar dataKey="Estudos" stackId="a" fill="#3b82f6" />
                    <Bar dataKey="Classes" stackId="a" fill="#a855f7" />
                    <Bar dataKey="Grupos" stackId="a" fill="#f97316" />
                    <Bar dataKey="Visitas" stackId="a" fill="#22c55e" radius={[4, 4, 0, 0]} />
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </section>
      </div>

      {/* Assinaturas */}
      <div className="mt-32 flex justify-around opacity-60">
         <div className="text-center w-60 border-t border-slate-900 pt-2">
            <p className="text-[10px] font-black uppercase text-slate-800">Coordenação de Capelania</p>
         </div>
         <div className="text-center w-60 border-t border-slate-900 pt-2">
            <p className="text-[10px] font-black uppercase text-slate-800">Direção Administrativa</p>
         </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-10 pb-40">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 print:hidden">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight italic">Relatórios Estatísticos</h2>
          <p className="text-slate-500 font-medium">Análise de impacto ministerial por período.</p>
        </div>
        
        <div className="flex flex-wrap items-end gap-4 bg-white p-6 rounded-premium border border-slate-100 shadow-xl">
           <div className="space-y-1">
             <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Início</label>
             <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="block px-4 py-2 bg-slate-50 rounded-xl font-bold outline-none" />
           </div>
           <div className="space-y-1">
             <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Fim</label>
             <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="block px-4 py-2 bg-slate-50 rounded-xl font-bold outline-none" />
           </div>
           <div className="space-y-1">
             <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Equipe</label>
             <select value={selectedChaplain} onChange={e => setSelectedChaplain(e.target.value)} className="block px-4 py-2 bg-slate-50 rounded-xl font-bold outline-none">
                <option value="ALL">Toda a Equipe</option>
                {allUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
             </select>
           </div>
        </div>
      </div>

      <div className="flex justify-center print:hidden">
        <button onClick={() => setShowPreview(true)} className="px-20 py-8 bg-slate-900 text-white rounded-premium font-black text-xl hover:bg-primary transition-all shadow-2xl flex items-center gap-4">
           <span>GERAR VISUALIZAÇÃO DO RELATÓRIO</span>
           <span>→</span>
        </button>
      </div>

      {showPreview && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[1000] overflow-y-auto p-4 md:p-12 flex flex-col items-center no-scrollbar">
          <div className="w-full max-w-[21cm] flex items-center justify-between mb-8 sticky top-0 z-[1001] bg-white/10 p-6 rounded-3xl border border-white/20">
             <button onClick={() => setShowPreview(false)} className="px-8 py-4 bg-white/20 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/30 transition-all">Voltar</button>
             <button onClick={() => window.print()} className="px-14 py-4 bg-primary text-white rounded-xl font-black text-sm shadow-3xl uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">Imprimir / Salvar PDF 📄</button>
          </div>
          
          <div className="print:m-0 print:p-0 scale-90 md:scale-100 origin-top">
            <ReportView />
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
