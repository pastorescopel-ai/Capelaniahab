
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

  // Cálculo de Estudantes Únicos (Nomes sem duplicatas entre Estudos e Classes)
  const uniqueStudentsTotal = useMemo(() => {
    const names = new Set<string>();
    data.studies.forEach(s => s.patientName && names.add(s.patientName.trim().toLowerCase()));
    data.classes.forEach(c => c.students.forEach(st => st && names.add(st.trim().toLowerCase())));
    return names.size;
  }, [data.studies, data.classes]);

  // Lógica do Gráfico de Desempenho por Capelão
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
    <div id="printable-report" className="bg-white p-[15mm] text-slate-900 shadow-none mx-auto border-none" style={{ width: '210mm', minHeight: '297mm', position: 'relative', overflow: 'hidden' }}>
      {/* Cabeçalho Profissional - Estilo A4 */}
      <div className="flex items-center justify-between border-b-4 border-primary pb-6 mb-8">
        <div className="flex items-center gap-6">
          <div className="h-28 w-28 flex items-center justify-center overflow-hidden">
            {config.reportLogo ? (
              <img src={config.reportLogo} className="max-h-full max-w-full object-contain" />
            ) : (
              <div className="w-full h-full bg-primary rounded-2xl flex items-center justify-center text-white font-black text-5xl italic">C</div>
            )}
          </div>
          <div className="flex-1">
            <h1 style={{ fontSize: `${config.reportTitleFontSize}px` }} className="font-black uppercase tracking-tighter leading-tight text-slate-800">
              {config.reportTitle || 'Relatório de Atividades'}
            </h1>
            <p style={{ fontSize: `${config.reportSubtitleFontSize}px` }} className="text-primary font-bold uppercase tracking-widest mt-1">
              {config.reportSubtitle || 'Gestão de Capelania'}
            </p>
          </div>
        </div>
        <div className="text-right border-l-2 border-slate-100 pl-6">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Estudantes Alcançados</p>
            <p className="text-6xl font-black text-slate-800 leading-none">{uniqueStudentsTotal}</p>
        </div>
      </div>

      <div className="mb-10 flex justify-between items-center bg-slate-50 p-6 rounded-3xl border border-slate-100">
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Período de Atuação</p>
          <p className="text-base font-bold text-slate-700">
            {new Date(startDate).toLocaleDateString('pt-BR')} — {new Date(endDate).toLocaleDateString('pt-BR')}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Filtro de Membro</p>
          <p className="text-base font-bold text-slate-700">
            {selectedChaplain === 'ALL' ? 'Equipe Completa' : allUsers.find(u => u.id === selectedChaplain)?.name}
          </p>
        </div>
      </div>

      {/* Cards Consolidados - Dispostos em Grid para não quebrar alinhamento */}
      <div className="grid grid-cols-4 gap-4 mb-12">
        {[
          { label: 'Estudos Bíblicos', val: data.studies.length, color: 'bg-blue-50 text-blue-600', icon: '📖' },
          { label: 'Classes Bíblicas', val: data.classes.length, color: 'bg-purple-50 text-purple-600', icon: '🎓' },
          { label: 'Pequenos Grupos', val: data.groups.length, color: 'bg-orange-50 text-orange-600', icon: '🏠' },
          { label: 'Apoio Colaborador', val: data.visits.length, color: 'bg-green-50 text-green-600', icon: '🤝' }
        ].map((card, i) => (
          <div key={i} className={`p-6 rounded-3xl border border-slate-100 flex flex-col items-center justify-center text-center ${card.color}`}>
            <span className="text-3xl mb-2">{card.icon}</span>
            <p className="text-[8px] font-black uppercase opacity-60 leading-tight mb-2 tracking-widest">{card.label}</p>
            <p className="text-4xl font-black leading-none">{card.val}</p>
          </div>
        ))}
      </div>

      {/* Seção de Gráfico com Borda Premium */}
      <div className="space-y-8">
        <section className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm relative">
           <div className="flex items-center gap-3 mb-8">
             <span className="text-2xl">📊</span>
             <h3 className="text-xs font-black uppercase text-slate-500 tracking-[0.2em] italic">Produtividade Comparativa por Capelão</h3>
           </div>
           <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={chaplainPerformanceData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{fontSize: 10, fontWeight: 800, fill: '#64748b'}} axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                    <Tooltip 
                      cursor={{fill: '#f8fafc'}} 
                      contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'}} 
                    />
                    <Legend wrapperStyle={{paddingTop: '30px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em'}} />
                    <Bar dataKey="Estudos" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Classes" stackId="a" fill="#a855f7" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Grupos" stackId="a" fill="#f97316" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Visitas" stackId="a" fill="#22c55e" radius={[4, 4, 0, 0]} />
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </section>
      </div>

      {/* Assinaturas no Rodapé com Distanciamento Fixo */}
      <div className="absolute bottom-[40mm] left-[15mm] right-[15mm] flex justify-between items-end px-10">
         <div className="text-center w-[65mm] border-t-2 border-slate-800 pt-4">
            <p className="text-[10px] font-black uppercase text-slate-800 tracking-[0.2em]">Coordenação de Capelania</p>
         </div>
         <div className="text-center w-[65mm] border-t-2 border-slate-800 pt-4">
            <p className="text-[10px] font-black uppercase text-slate-800 tracking-[0.2em]">Direção Administrativa</p>
         </div>
      </div>
      
      <div className="absolute bottom-[15mm] left-0 right-0 text-center">
        <p className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.4em]">
          Gerado pelo Sistema CAPELANIA HAB em {new Date().toLocaleString('pt-BR')}
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-10 pb-40">
      {/* Filtros da Interface - Ocultos na Impressão */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 print:hidden">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight italic">Painel de Relatórios</h2>
          <p className="text-slate-500 font-medium">Consolidação estatística e análise de desempenho.</p>
        </div>
        
        <div className="flex flex-wrap items-end gap-4 bg-white p-6 rounded-premium border border-slate-100 shadow-xl">
           <div className="space-y-1">
             <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Data Inicial</label>
             <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="block px-4 py-2 bg-slate-50 rounded-xl font-bold outline-none border-none focus:ring-2 focus:ring-primary/20" />
           </div>
           <div className="space-y-1">
             <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Data Final</label>
             <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="block px-4 py-2 bg-slate-50 rounded-xl font-bold outline-none border-none focus:ring-2 focus:ring-primary/20" />
           </div>
           <div className="space-y-1">
             <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Equipe</label>
             <select value={selectedChaplain} onChange={e => setSelectedChaplain(e.target.value)} className="block px-4 py-2 bg-slate-50 rounded-xl font-bold outline-none border-none min-w-[150px]">
                <option value="ALL">Todos Capelães</option>
                {allUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
             </select>
           </div>
           <button onClick={() => loadFilteredData()} className="p-2.5 bg-primary text-white rounded-xl shadow-lg hover:rotate-12 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
           </button>
        </div>
      </div>

      {/* Cards de Visão Rápida na Interface */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 print:hidden">
          <div className="bg-primary p-6 rounded-premium text-white shadow-xl flex flex-col justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Alunos Únicos (Mês)</p>
            <p className="text-5xl font-black">{uniqueStudentsTotal}</p>
            <p className="text-[10px] mt-2 italic font-medium opacity-80">Soma de Estudos + Classes</p>
          </div>
          {[
            { label: 'Estudos Bíblicos', val: data.studies.length, color: 'text-blue-600', icon: '📖' },
            { label: 'Classes Bíblicas', val: data.classes.length, color: 'text-purple-600', icon: '🎓' },
            { label: 'Pequenos Grupos', val: data.groups.length, color: 'text-orange-600', icon: '🏠' },
            { label: 'Apoio Colaborador', val: data.visits.length, color: 'text-green-600', icon: '🤝' }
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-6 rounded-premium border border-slate-100 shadow-sm hover:shadow-md transition-all">
              <span className="text-xl mb-2 block">{item.icon}</span>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
              <p className={`text-3xl font-black ${item.color}`}>{item.val}</p>
            </div>
          ))}
      </div>

      {/* Gráfico de Desempenho no Painel Principal */}
      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl print:hidden">
         <h3 className="text-[10px] font-black uppercase text-slate-400 mb-10 tracking-[0.3em] flex items-center gap-2 italic">
           <span className="w-10 h-0.5 bg-primary"></span>📈 Desempenho Comparativo da Equipe
         </h3>
         <div className="h-[450px] w-full">
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={chaplainPerformanceData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 900, fill: '#1e293b'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '1.5rem', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.2)'}} 
                    cursor={{fill: '#f8fafc'}}
                  />
                  <Legend verticalAlign="top" height={60} />
                  <Bar dataKey="Estudos" stackId="a" fill="#3b82f6" radius={[12, 12, 0, 0]} />
                  <Bar dataKey="Classes" stackId="a" fill="#a855f7" radius={[12, 12, 0, 0]} />
                  <Bar dataKey="Grupos" stackId="a" fill="#f97316" radius={[12, 12, 0, 0]} />
                  <Bar dataKey="Visitas" stackId="a" fill="#22c55e" radius={[12, 12, 0, 0]} />
               </BarChart>
            </ResponsiveContainer>
         </div>
      </div>

      {/* Botão de Geração de Relatório PDF */}
      <div className="flex justify-center print:hidden pt-10">
        <button 
          onClick={() => { setShowPreview(true); window.scrollTo({top: 0, behavior: 'smooth'}); }} 
          className="group px-16 py-8 bg-slate-900 text-white rounded-premium font-black text-xl hover:bg-primary transition-all shadow-3xl flex items-center gap-6"
        >
           <span>VISUALIZAR RELATÓRIO OFICIAL</span>
           <span className="group-hover:translate-x-3 transition-transform">→</span>
        </button>
      </div>

      {/* Overlay do Preview A4 Fiel */}
      {showPreview && (
        <div className="fixed inset-0 bg-slate-950/98 backdrop-blur-3xl z-[1000] overflow-y-auto no-scrollbar p-4 md:p-12 flex flex-col items-center">
          <div className="w-full max-w-[21cm] flex items-center justify-between mb-10 sticky top-0 z-[1001] bg-white/5 p-6 rounded-[2rem] border border-white/10 backdrop-blur-xl shadow-2xl">
             <button 
              onClick={() => setShowPreview(false)} 
              className="px-8 py-3 bg-white/10 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/20 transition-all"
             >
              Voltar ao Painel
             </button>
             <button 
              onClick={() => window.print()} 
              className="px-12 py-3 bg-primary text-white rounded-xl font-black text-sm shadow-3xl uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
             >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Imprimir / Gerar PDF
             </button>
          </div>
          
          {/* O Relatório Real em formato A4 */}
          <div className="print:m-0 print:p-0 bg-white shadow-[0_0_80px_rgba(0,0,0,0.5)] transform-gpu scale-[0.85] md:scale-100 origin-top">
            <ReportView />
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
