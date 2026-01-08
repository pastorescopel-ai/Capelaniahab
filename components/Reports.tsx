
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { storageService } from '../services/storageService';
import { User, BiblicalStudy, BiblicalClass, SmallGroup, StaffVisit } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

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

  const uniqueStudentsTotal = useMemo(() => {
    const names = new Set<string>();
    data.studies.forEach(s => s.patientName && names.add(s.patientName.trim().toLowerCase()));
    data.classes.forEach(c => c.students.forEach(st => st && names.add(st.trim().toLowerCase())));
    return names.size;
  }, [data.studies, data.classes]);

  // Dados para Gráfico de Distribuição Global
  const chartData = [
    { name: 'Estudos', value: data.studies.length, color: '#3b82f6' },
    { name: 'Classes', value: data.classes.length, color: '#a855f7' },
    { name: 'Grupos', value: data.groups.length, color: '#f97316' },
    { name: 'Visitas', value: data.visits.length, color: '#22c55e' }
  ].filter(d => d.value > 0);

  // Mapeamento de Atividades Individuais por Capelão
  const chaplainMetrics = useMemo(() => {
    const usersToMonitor = selectedChaplain === 'ALL' 
      ? allUsers 
      : allUsers.filter(u => u.id === selectedChaplain);

    return usersToMonitor.map(u => {
      const uStudies = data.studies.filter(s => s.chaplainId === u.id).length;
      const uClasses = data.classes.filter(c => c.chaplainId === u.id).length;
      const uGroups = data.groups.filter(g => g.chaplainId === u.id).length;
      const uVisits = data.visits.filter(v => v.chaplainId === u.id).length;
      const total = uStudies + uClasses + uGroups + uVisits;

      return { 
        user: u, 
        metrics: [
          { label: 'Estudos', val: uStudies, icon: '📖', color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Classes', val: uClasses, icon: '🎓', color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Grupos', val: uGroups, icon: '🏠', color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Visitas', val: uVisits, icon: '🤝', color: 'text-green-600', bg: 'bg-green-50' }
        ],
        total
      };
    }).filter(item => item.total > 0 || selectedChaplain !== 'ALL');
  }, [allUsers, data, selectedChaplain]);

  const handlePrint = () => {
    const printContent = document.getElementById('report-content');
    const printRoot = document.getElementById('print-root');
    if (printContent && printRoot) {
      printRoot.innerHTML = printContent.innerHTML;
      window.print();
    }
  };

  const ReportTemplate = () => (
    <div id="report-content" className="w-full bg-white flex flex-col items-center">
      <div className="w-[210mm] min-h-[297mm] p-[15mm] bg-white relative">
        {/* CABEÇALHO */}
        <div className="flex items-center justify-between border-b-4 border-primary pb-6 mb-8">
          <div className="flex items-center gap-6">
            <div className="h-24 w-24 flex items-center justify-center">
              {config.reportLogo ? (
                <img src={config.reportLogo} className="max-h-full max-w-full object-contain" />
              ) : (
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white font-black text-3xl">C</div>
              )}
            </div>
            <div>
              <h1 style={{ fontSize: `${config.reportTitleFontSize}px` }} className="font-black uppercase leading-none text-slate-800">
                {config.reportTitle || 'Relatório de Atividades'}
              </h1>
              <p style={{ fontSize: `${config.reportSubtitleFontSize}px` }} className="text-primary font-bold uppercase tracking-widest mt-1">
                {config.reportSubtitle || 'Capelania Hospitalar'}
              </p>
            </div>
          </div>
          <div className="text-right border-l-2 border-slate-100 pl-6">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Alunos Únicos</p>
            <p className="text-5xl font-black text-slate-800 leading-none">{uniqueStudentsTotal}</p>
          </div>
        </div>

        {/* INFO PERIODO */}
        <div className="mb-8 flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase">Período Selecionado</p>
            <p className="text-sm font-bold text-slate-700">{new Date(startDate).toLocaleDateString('pt-BR')} a {new Date(endDate).toLocaleDateString('pt-BR')}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black text-slate-400 uppercase">Filtro de Equipe</p>
            <p className="text-sm font-bold text-slate-700">{selectedChaplain === 'ALL' ? 'Equipe Completa' : allUsers.find(u => u.id === selectedChaplain)?.name}</p>
          </div>
        </div>

        {/* RESUMO GERAL EM CARDS */}
        <div className="grid grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Estudos Bíblicos', val: data.studies.length, bg: 'bg-blue-50', color: 'text-blue-600' },
            { label: 'Classes Bíblicas', val: data.classes.length, bg: 'bg-purple-50', color: 'text-purple-600' },
            { label: 'Pequenos Grupos', val: data.groups.length, bg: 'bg-orange-50', color: 'text-orange-600' },
            { label: 'Visitas Colaborador', val: data.visits.length, bg: 'bg-green-50', color: 'text-green-600' }
          ].map((c, i) => (
            <div key={i} className={`${c.bg} p-5 rounded-3xl border border-slate-100 text-center`}>
              <p className="text-[8px] font-black uppercase text-slate-400 mb-1">{c.label}</p>
              <p className={`text-3xl font-black ${c.color}`}>{c.val}</p>
            </div>
          ))}
        </div>

        {/* GRÁFICO DE DISTRIBUIÇÃO */}
        <div className="bg-white border-2 border-slate-50 rounded-[2rem] p-6 mb-10">
           <p className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest text-center italic">Distribuição Geral de Atividades</p>
           <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {chartData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="middle" align="right" layout="vertical" />
                </PieChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* DESEMPENHO INDIVIDUAL POR CAPELÃO EM CARDS (SOLICITAÇÃO) */}
        <div className="space-y-8">
           <h3 className="text-xs font-black uppercase text-slate-800 border-l-4 border-primary pl-3 mb-6">Desempenho Detalhado por Membro</h3>
           
           {chaplainMetrics.map((item, idx) => (
             <div key={idx} className="bg-slate-50/50 rounded-[2rem] p-6 border border-slate-100 break-inside-avoid mb-6">
                <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-black text-xs uppercase">
                        {item.user.name.substring(0,2)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800">{item.user.name}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{item.user.role}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[8px] font-black text-slate-400 uppercase">Total Geral</p>
                      <p className="text-xl font-black text-primary">{item.total}</p>
                   </div>
                </div>
                
                <div className="grid grid-cols-4 gap-3">
                   {item.metrics.map((m, i) => (
                     <div key={i} className={`${m.bg} p-4 rounded-2xl border border-white flex flex-col items-center justify-center shadow-sm`}>
                        <span className="text-lg mb-1">{m.icon}</span>
                        <p className="text-[7px] font-black uppercase text-slate-400 mb-1">{m.label}</p>
                        <p className={`text-xl font-black ${m.color}`}>{m.val}</p>
                     </div>
                   ))}
                </div>
             </div>
           ))}
        </div>

        {/* RODAPÉ */}
        <div className="mt-20 flex justify-around opacity-60">
           <div className="text-center w-60 border-t border-slate-900 pt-2">
              <p className="text-[9px] font-black uppercase text-slate-800">Coordenação</p>
           </div>
           <div className="text-center w-60 border-t border-slate-900 pt-2">
              <p className="text-[9px] font-black uppercase text-slate-800">Diretoria</p>
           </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-10 pb-40">
      {/* Filtros da Interface - Ocultos na Impressão */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 print:hidden">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight italic">Relatórios Estratégicos</h2>
          <p className="text-slate-500 font-medium">Gestão de indicadores e produtividade individual.</p>
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
                <option value="ALL">Todos os Capelães</option>
                {allUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
             </select>
           </div>
           <button onClick={loadFilteredData} className="p-3 bg-primary text-white rounded-xl shadow-lg hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
           </button>
        </div>
      </div>

      {/* Cards de Resumo no Painel Principal */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 print:hidden">
          <div className="bg-primary p-6 rounded-premium text-white shadow-xl">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Estudantes Alcançados</p>
            <p className="text-5xl font-black">{uniqueStudentsTotal}</p>
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

      {/* Seção de Desempenho na UI */}
      <div className="print:hidden space-y-6">
        <div className="flex items-center gap-3">
           <h3 className="text-lg font-black text-slate-800 italic uppercase tracking-tighter">Desempenho da Equipe por Atividade</h3>
           <div className="h-0.5 flex-1 bg-slate-100"></div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {chaplainMetrics.map((item, idx) => (
             <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-6">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center font-black">
                        {item.user.name.substring(0,1)}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-800 text-lg leading-tight">{item.user.name}</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.user.role}</p>
                      </div>
                   </div>
                   <div className="bg-slate-50 px-4 py-2 rounded-2xl text-center">
                      <p className="text-[8px] font-black text-slate-400 uppercase">Soma Atividades</p>
                      <p className="text-xl font-black text-primary">{item.total}</p>
                   </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                   {item.metrics.map((m, i) => (
                     <div key={i} className={`${m.bg} p-4 rounded-3xl border border-white flex flex-col items-center justify-center text-center shadow-sm`}>
                        <span className="text-xl mb-1">{m.icon}</span>
                        <p className="text-[8px] font-black uppercase text-slate-400 mb-1">{m.label}</p>
                        <p className={`text-2xl font-black ${m.color}`}>{m.val}</p>
                     </div>
                   ))}
                </div>
             </div>
           ))}
        </div>
      </div>

      <div className="flex justify-center print:hidden pt-10">
        <button onClick={() => setShowPreview(true)} className="px-16 py-8 bg-slate-900 text-white rounded-premium font-black text-xl hover:bg-primary transition-all shadow-3xl flex items-center gap-6">
           <span>VISUALIZAR RELATÓRIO PDF</span>
           <span>→</span>
        </button>
      </div>

      {/* MODAL DE PREVIEW / IMPRESSÃO */}
      {showPreview && (
        <div className="fixed inset-0 bg-slate-950/98 backdrop-blur-3xl z-[1000] overflow-y-auto no-scrollbar p-4 md:p-12 flex flex-col items-center">
          <div className="w-full max-w-[21cm] flex items-center justify-between mb-8 sticky top-0 z-[1001] bg-white/10 p-6 rounded-[2rem] border border-white/20 backdrop-blur-xl">
             <button onClick={() => setShowPreview(false)} className="px-8 py-3 bg-white/10 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/20">Voltar</button>
             <button onClick={handlePrint} className="px-12 py-3 bg-primary text-white rounded-xl font-black text-sm shadow-3xl uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                Imprimir / Salvar PDF
             </button>
          </div>
          
          <div className="bg-white shadow-[0_0_80px_rgba(0,0,0,0.4)] origin-top transform scale-[0.85] md:scale-100">
            <ReportTemplate />
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
