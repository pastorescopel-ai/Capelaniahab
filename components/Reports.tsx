
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

  useEffect(() => { 
    storageService.pullFromCloud().then(() => loadFilteredData());
  }, [loadFilteredData]);

  // Cálculo de Estudantes Únicos
  const uniqueStudentsTotal = useMemo(() => {
    const names = new Set<string>();
    data.studies.forEach(s => s.patientName && names.add(s.patientName.trim().toLowerCase()));
    data.classes.forEach(c => c.students.forEach(st => st && names.add(st.trim().toLowerCase())));
    return names.size;
  }, [data.studies, data.classes]);

  // Dados para o Gráfico por Capelão
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
      {/* Header Personalizado via Admin */}
      <div className="flex items-center justify-between border-b-4 border-primary pb-6 mb-8">
        <div className="flex items-center gap-6">
          <div className="h-24 w-24 flex items-center justify-center overflow-hidden">
            {config.reportLogo ? (
              <img src={config.reportLogo} className="max-h-full max-w-full object-contain" />
            ) : (
              <div className="w-full h-full bg-primary rounded-2xl flex items-center justify-center text-white font-black text-4xl italic">C</div>
            )}
          </div>
          <div>
            <h1 style={{ fontSize: `${config.reportTitleFontSize}px` || '32px' }} className="font-black uppercase tracking-tighter leading-none">
              {config.reportTitle || 'Relatório de Atividades'}
            </h1>
            <p style={{ fontSize: `${config.reportSubtitleFontSize}px` || '14px' }} className="text-primary font-bold uppercase tracking-widest mt-1">
              {config.reportSubtitle || 'Gestão de Capelania'}
            </p>
          </div>
        </div>
        <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase">Estudantes Únicos</p>
            <p className="text-5xl font-black text-slate-800 leading-none">{uniqueStudentsTotal}</p>
        </div>
      </div>

      <div className="mb-8 flex justify-between items-end border-b border-slate-100 pb-4">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Período de Análise</p>
          <p className="text-sm font-bold text-slate-700">
            {new Date(startDate).toLocaleDateString()} até {new Date(endDate).toLocaleDateString()}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filtro de Equipe</p>
          <p className="text-sm font-bold text-slate-700">
            {selectedChaplain === 'ALL' ? 'Todos os Capelães' : allUsers.find(u => u.id === selectedChaplain)?.name}
          </p>
        </div>
      </div>

      {/* Cards de Totais no PDF */}
      <div className="grid grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Estudos Bíblicos', val: data.studies.length, color: 'bg-blue-50 text-blue-600', emoji: '📖' },
          { label: 'Classes Bíblicas', val: data.classes.length, color: 'bg-purple-50 text-purple-600', emoji: '🎓' },
          { label: 'Pequenos Grupos', val: data.groups.length, color: 'bg-orange-50 text-orange-600', emoji: '🏠' },
          { label: 'Visitas Colaborador', val: data.visits.length, color: 'bg-green-50 text-green-600', emoji: '🤝' }
        ].map((card, i) => (
          <div key={i} className={`p-4 rounded-3xl border border-slate-100 flex flex-col items-center justify-center ${card.color}`}>
            <span className="text-2xl mb-1">{card.emoji}</span>
            <p className="text-[8px] font-black uppercase opacity-60 text-center leading-tight mb-1">{card.label}</p>
            <p className="text-3xl font-black leading-none">{card.val}</p>
          </div>
        ))}
      </div>

      {/* Gráfico de Barras no PDF */}
      <div className="space-y-8">
        <section className="bg-slate-50 p-8 rounded-premium border border-slate-100">
           <h3 className="text-xs font-black uppercase text-slate-500 mb-6 flex items-center gap-2 italic">📊 Produtividade Comparativa por Capelão</h3>
           <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={chaplainPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{fontSize: 10, fontWeight: 700}} axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                    <Tooltip cursor={{fill: '#f1f5f9'}} />
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

      <div className="mt-32 flex justify-around opacity-60">
         <div className="text-center w-60 border-t border-slate-900 pt-2">
            <p className="text-[10px] font-black uppercase text-slate-800 tracking-widest">Coordenação de Capelania</p>
         </div>
         <div className="text-center w-60 border-t border-slate-900 pt-2">
            <p className="text-[10px] font-black uppercase text-slate-800 tracking-widest">Direção Administrativa</p>
         </div>
      </div>
      
      <div className="mt-20 text-center">
        <p className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.3em]">
          Gerado em {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-10 pb-40">
      {/* Filtros e Visão Geral no Painel */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 print:hidden">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight italic">Painel de Relatórios</h2>
          <p className="text-slate-500 font-medium">Totais e desempenho por capelão.</p>
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
             <select value={selectedChaplain} onChange={e => setSelectedChaplain(e.target.value)} className="block px-4 py-2 bg-slate-50 rounded-xl font-bold outline-none min-w-[150px]">
                <option value="ALL">Toda a Equipe</option>
                {allUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
             </select>
           </div>
        </div>
      </div>

      {/* Cards de Resumo no Painel (Visíveis agora) */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 print:hidden">
          <div className="bg-primary p-6 rounded-premium text-white shadow-xl">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Estudantes Únicos</p>
            <p className="text-4xl font-black">{uniqueStudentsTotal}</p>
            <p className="text-[9px] mt-2 italic font-medium">Soma de Estudos + Classes</p>
          </div>
          {[
            { label: 'Estudos Bíblicos', val: data.studies.length, color: 'text-blue-600', emoji: '📖' },
            { label: 'Classes Bíblicas', val: data.classes.length, color: 'text-purple-600', emoji: '🎓' },
            { label: 'Pequenos Grupos', val: data.groups.length, color: 'text-orange-600', emoji: '🏠' },
            { label: 'Apoio Colaborador', val: data.visits.length, color: 'text-green-600', emoji: '🤝' }
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-6 rounded-premium border border-slate-100 shadow-sm hover:shadow-md transition-all">
              <span className="text-xl mb-2 block">{item.emoji}</span>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
              <p className={`text-3xl font-black ${item.color}`}>{item.val}</p>
            </div>
          ))}
      </div>

      {/* Gráfico de Desempenho no Painel */}
      <div className="bg-white p-8 rounded-premium border border-slate-100 shadow-xl print:hidden">
         <h3 className="text-xs font-black uppercase text-slate-400 mb-8 tracking-[0.2em]">📈 Desempenho Comparativo por Capelão</h3>
         <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={chaplainPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 700}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11}} />
                  <Tooltip contentStyle={{borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                  <Legend />
                  <Bar dataKey="Estudos" stackId="a" fill="#3b82f6" />
                  <Bar dataKey="Classes" stackId="a" fill="#a855f7" />
                  <Bar dataKey="Grupos" stackId="a" fill="#f97316" />
                  <Bar dataKey="Visitas" stackId="a" fill="#22c55e" radius={[10, 10, 0, 0]} />
               </BarChart>
            </ResponsiveContainer>
         </div>
      </div>

      <div className="flex justify-center print:hidden">
        <button onClick={() => setShowPreview(true)} className="px-12 py-6 bg-slate-900 text-white rounded-premium font-black text-lg hover:bg-primary transition-all shadow-2xl flex items-center gap-4">
           <span>VISUALIZAR RELATÓRIO PDF</span>
           <span>→</span>
        </button>
      </div>

      {showPreview && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[1000] overflow-y-auto p-4 md:p-12 flex flex-col items-center no-scrollbar">
          <div className="w-full max-w-[21cm] flex items-center justify-between mb-8 sticky top-0 z-[1001] bg-white/10 p-6 rounded-3xl border border-white/20 backdrop-blur-md">
             <button onClick={() => setShowPreview(false)} className="px-6 py-3 bg-white/10 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/20 transition-all">Voltar</button>
             <button onClick={() => window.print()} className="px-10 py-3 bg-primary text-white rounded-xl font-black text-sm shadow-3xl uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">Imprimir / Salvar PDF</button>
          </div>
          
          <div className="print:m-0 print:p-0 scale-90 md:scale-100 origin-top transform-gpu">
            <ReportView />
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
