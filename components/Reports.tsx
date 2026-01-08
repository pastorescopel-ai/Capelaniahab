
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { storageService } from '../services/storageService';
import { User, BiblicalStudy, BiblicalClass, SmallGroup, StaffVisit } from '../types';
import { Icons } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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
  
  const [reportTitle, setReportTitle] = useState('Relatório de Atividades');
  const [reportSubtitle, setReportSubtitle] = useState('Gestão de Capelania e Ensino Bíblico');
  const [titleFontSize, setTitleFontSize] = useState(32);
  const [reportFontSize, setReportFontSize] = useState(12);
  
  const [selectedChaplain, setSelectedChaplain] = useState<string>('ALL');
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

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

    const filterFn = (items: any[]) => {
      return items.filter(item => {
        const itemDate = new Date(item.date || item.createdAt).getTime();
        const matchesDate = itemDate >= start && itemDate <= end;
        const matchesChaplain = selectedChaplain === 'ALL' || item.chaplainId === selectedChaplain;
        return matchesDate && matchesChaplain;
      });
    };

    setData({
      studies: filterFn(storageService.getStudies()),
      classes: filterFn(storageService.getClasses()),
      groups: filterFn(storageService.getGroups()),
      visits: filterFn(storageService.getVisits())
    });
  }, [startDate, endDate, selectedChaplain]);

  useEffect(() => {
    loadFilteredData();
  }, [loadFilteredData]);

  const uniqueStudentsTotal = useMemo(() => {
    const studentNamesSet = new Set<string>();
    data.studies.forEach(study => {
      const name = study.patientName.trim().toLowerCase();
      if (name) studentNamesSet.add(name);
    });
    data.classes.forEach(cls => {
      cls.students.forEach(student => {
        const name = student.trim().toLowerCase();
        if (name) studentNamesSet.add(name);
      });
    });
    return studentNamesSet.size;
  }, [data]);

  const totalActionRecords = data.studies.length + data.classes.length + data.groups.length + data.visits.length;

  const getRanking = (moduleData: any[]) => {
    const chaplains = allUsers.filter(u => selectedChaplain === 'ALL' || u.id === selectedChaplain);
    return chaplains.map(u => ({
      name: u.name.split(' ')[0],
      total: moduleData.filter(d => d.chaplainId === u.id).length
    })).filter(d => d.total > 0).sort((a, b) => b.total - a.total);
  };

  const rankings = {
    studies: getRanking(data.studies),
    classes: getRanking(data.classes),
    groups: getRanking(data.groups),
    visits: getRanking(data.visits)
  };

  const handlePrint = () => {
    if (isPrinting) return;
    setIsPrinting(true);
    
    // Aumentamos o delay para 1000ms para garantir que o navegador
    // tenha tempo de renderizar os SVGs dos gráficos no #print-portal
    // que está visualmente oculto (opacity: 0.01) mas presente no DOM.
    setTimeout(() => {
      window.print();
      // Pequeno delay para resetar o estado após o comando de impressão
      setTimeout(() => setIsPrinting(false), 500);
    }, 1000);
  };

  const ReportContent = ({ isPrint = false }: { isPrint?: boolean }) => (
    <div 
      className={`bg-white text-slate-900 ${isPrint ? 'printable-report' : ''}`} 
      style={{ fontSize: `${reportFontSize}px` }}
    >
      <div className="flex items-center justify-between border-b-[4px] border-primary pb-6 mb-8">
        <div className="flex items-center gap-6">
          {config.reportLogo ? (
            <img 
              src={config.reportLogo} 
              // Aumentamos a altura fixa para garantir boa resolução na impressão
              className="h-24 w-auto object-contain" 
              alt="Logo" 
              style={{ maxHeight: '96px', width: 'auto' }}
            />
          ) : (
             <div className="w-20 h-20 bg-primary text-white font-black flex items-center justify-center rounded-2xl text-3xl italic">C</div>
          )}
          <div>
            <h1 style={{ fontSize: `${titleFontSize}px` }} className="font-black tracking-tighter uppercase leading-none text-slate-900">{reportTitle}</h1>
            <p className="text-primary font-bold uppercase tracking-widest text-sm mt-1">{reportSubtitle}</p>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">
              {new Date(startDate).toLocaleDateString()} — {new Date(endDate).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="text-right border-r-4 border-primary pr-6 py-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Impacto Único</p>
          <p className="text-4xl font-black text-slate-900 leading-none">{uniqueStudentsTotal}</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Registros', val: totalActionRecords, color: '#0f172a' },
          { label: 'Estudos Bíblicos', val: data.studies.length, color: '#3b82f6' },
          { label: 'Classes Bíblicas', val: data.classes.length, color: '#a855f7' },
          { label: 'Visitas Colab.', val: data.visits.length, color: '#22c55e' }
        ].map((kpi, i) => (
          <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</p>
            <p className="text-2xl font-black" style={{ color: kpi.color }}>{kpi.val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Gráfico Ranking Estudos */}
        <section className="page-break-avoid space-y-3">
          <h3 className="text-sm font-black uppercase tracking-tight flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="w-6 h-6 bg-blue-500 text-white rounded flex items-center justify-center text-[10px]">📖</span>
            Ranking Estudos Bíblicos
          </h3>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rankings.studies}>
                <XAxis dataKey="name" tick={{fontSize: 8, fontWeight: 700}} axisLine={false} tickLine={false} />
                <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <table className="w-full text-[9px] border-collapse bg-slate-50/30 rounded-lg overflow-hidden">
            <thead className="bg-slate-100/50">
              <tr className="text-left font-black text-slate-500 uppercase"><th className="p-2">Capelão</th><th className="p-2 text-right">Qtd</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rankings.studies.map((r, i) => (
                <tr key={i}><td className="p-2 font-bold">{r.name}</td><td className="p-2 text-right font-black text-blue-600">{r.total}</td></tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Gráfico Ranking Classes */}
        <section className="page-break-avoid space-y-3">
          <h3 className="text-sm font-black uppercase tracking-tight flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="w-6 h-6 bg-purple-500 text-white rounded flex items-center justify-center text-[10px]">🎓</span>
            Ranking Classes Bíblicas
          </h3>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rankings.classes}>
                <XAxis dataKey="name" tick={{fontSize: 8, fontWeight: 700}} axisLine={false} tickLine={false} />
                <Bar dataKey="total" fill="#a855f7" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <table className="w-full text-[9px] border-collapse bg-slate-50/30 rounded-lg overflow-hidden">
            <thead className="bg-slate-100/50">
              <tr className="text-left font-black text-slate-500 uppercase"><th className="p-2">Capelão</th><th className="p-2 text-right">Qtd</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rankings.classes.map((r, i) => (
                <tr key={i}><td className="p-2 font-bold">{r.name}</td><td className="p-2 text-right font-black text-purple-600">{r.total}</td></tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Gráfico Ranking Pequenos Grupos */}
        <section className="page-break-avoid space-y-3">
          <h3 className="text-sm font-black uppercase tracking-tight flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="w-6 h-6 bg-orange-500 text-white rounded flex items-center justify-center text-[10px]">🏠</span>
            Ranking Pequenos Grupos
          </h3>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rankings.groups}>
                <XAxis dataKey="name" tick={{fontSize: 8, fontWeight: 700}} axisLine={false} tickLine={false} />
                <Bar dataKey="total" fill="#f97316" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <table className="w-full text-[9px] border-collapse bg-slate-50/30 rounded-lg overflow-hidden">
            <thead className="bg-slate-100/50">
              <tr className="text-left font-black text-slate-500 uppercase"><th className="p-2">Capelão</th><th className="p-2 text-right">Qtd</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rankings.groups.map((r, i) => (
                <tr key={i}><td className="p-2 font-bold">{r.name}</td><td className="p-2 text-right font-black text-orange-600">{r.total}</td></tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Gráfico Ranking Visitas Colab */}
        <section className="page-break-avoid space-y-3">
          <h3 className="text-sm font-black uppercase tracking-tight flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="w-6 h-6 bg-green-500 text-white rounded flex items-center justify-center text-[10px]">🤝</span>
            Ranking Visitas Colab.
          </h3>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rankings.visits}>
                <XAxis dataKey="name" tick={{fontSize: 8, fontWeight: 700}} axisLine={false} tickLine={false} />
                <Bar dataKey="total" fill="#22c55e" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <table className="w-full text-[9px] border-collapse bg-slate-50/30 rounded-lg overflow-hidden">
            <thead className="bg-slate-100/50">
              <tr className="text-left font-black text-slate-500 uppercase"><th className="p-2">Capelão</th><th className="p-2 text-right">Qtd</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rankings.visits.map((r, i) => (
                <tr key={i}><td className="p-2 font-bold">{r.name}</td><td className="p-2 text-right font-black text-green-600">{r.total}</td></tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <div className="mt-20 flex justify-around px-10 page-break-avoid">
        <div className="text-center w-60 border-t border-slate-400 pt-2">
          <p className="text-[9px] font-black uppercase text-slate-900 tracking-widest">Coordenação Espiritual</p>
        </div>
        <div className="text-center w-60 border-t border-slate-400 pt-2">
          <p className="text-[9px] font-black uppercase text-slate-900 tracking-widest">Direção Hospitalar</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-10 pb-40 animate-in fade-in duration-500">
      {/* Filtros Mobile & Desktop */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 print:hidden">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight italic">Relatórios Avançados</h2>
          <p className="text-slate-500 font-medium italic">Consolide dados mensais com inteligência e precisão.</p>
        </div>
        
        <div className="flex flex-wrap items-end gap-4 bg-white p-6 rounded-premium border border-slate-100 shadow-xl">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">De:</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="px-4 py-2 bg-slate-50 border-none rounded-xl font-bold text-slate-600 outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Até:</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="px-4 py-2 bg-slate-50 border-none rounded-xl font-bold text-slate-600 outline-none" />
          </div>
          <div className="space-y-1 min-w-[200px]">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Equipe:</label>
            <select value={selectedChaplain} onChange={e => setSelectedChaplain(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl font-bold text-slate-600 outline-none">
              <option value="ALL">Corpo Ministerial Completo</option>
              {allUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Gráficos na Tela */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 print:hidden">
        {[
          { key: 'studies', label: 'Estudos', color: '#3b82f6', icon: '📖' },
          { key: 'classes', label: 'Classes', color: '#a855f7', icon: '🎓' },
          { key: 'groups', label: 'PGs', color: '#f97316', icon: '🏠' },
          { key: 'visits', label: 'Visitas', color: '#22c55e', icon: '🤝' }
        ].map(module => (
          <div key={module.key} className="bg-white p-6 rounded-premium border border-slate-100 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ranking {module.label}</h3>
              <span className="text-xl">{module.icon}</span>
            </div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rankings[module.key as keyof typeof rankings]}>
                  <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                    <Cell fill={module.color} />
                  </Bar>
                  <XAxis dataKey="name" tick={{fontSize: 9, fontWeight: 700}} axisLine={false} tickLine={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-10 rounded-premium border border-slate-100 shadow-xl print:hidden flex flex-col md:flex-row items-center justify-between gap-6">
         <div>
           <h3 className="text-xl font-black text-slate-800">Impacto Estudantil Consolidado</h3>
           <p className="text-slate-500 font-medium italic">Contagem única de alunos presentes em Estudos e Classes bíblicas.</p>
         </div>
         <div className="text-center bg-primary/5 px-10 py-6 rounded-3xl border border-primary/10">
            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Total Estudantes Únicos</p>
            <p className="text-5xl font-black text-primary leading-none">{uniqueStudentsTotal}</p>
         </div>
      </div>

      {/* Painel de Ajuste do PDF */}
      <div className="bg-slate-900 p-10 rounded-premium text-white shadow-2xl print:hidden space-y-10">
        <h3 className="text-xl font-black italic flex items-center gap-3">🎨 Ajustes Finais do PDF</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Título do Relatório</label>
              <input type="text" className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none font-bold" value={reportTitle} onChange={e => setReportTitle(e.target.value)} />
            </div>
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Subtítulo</label>
              <input type="text" className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none font-bold" value={reportSubtitle} onChange={e => setReportSubtitle(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col justify-center items-center gap-4">
             <button 
              onClick={() => setShowPreview(true)} 
              className="w-full py-6 bg-primary text-white rounded-3xl font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-3xl flex items-center justify-center gap-4"
             >
               VISUALIZAR A4 📄
             </button>
          </div>
        </div>
      </div>

      {/* Modal de Preview e Botão de Impressão */}
      {showPreview && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[1000] overflow-y-auto p-4 md:p-12 flex flex-col items-center modal-overlay">
          <div className="w-full max-w-[21cm] flex items-center justify-between mb-8 print:hidden bg-white/10 p-6 rounded-[2.5rem] border border-white/10 shadow-3xl">
            <div className="text-white">
              <h3 className="text-2xl font-black tracking-tighter italic">Preview de Exportação</h3>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setShowPreview(false)} className="px-8 py-4 bg-white/10 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/20 transition-all">Fechar</button>
              <button 
                onClick={handlePrint} 
                disabled={isPrinting}
                className={`px-14 py-4 ${isPrinting ? 'bg-slate-600 cursor-not-allowed' : 'bg-primary hover:scale-105 active:scale-95'} text-white rounded-xl font-black text-sm shadow-3xl transition-all flex items-center gap-4 uppercase tracking-widest`}
              >
                {isPrinting ? 'PROCESSANDO PDF...' : 'GERAR PDF AGORA 📄'}
              </button>
            </div>
          </div>
          <div className="report-paper-preview print:hidden shadow-2xl scale-95 md:scale-100 transition-transform">
            <ReportContent />
          </div>
        </div>
      )}

      {/* 
         PORTAL DE IMPRESSÃO 
         Renderiza o conteúdo quando o preview é aberto. 
         Devido ao CSS em index.html, ele fica fixo e invisível (mas presente no DOM) na tela
         para cálculos de gráficos, e se torna o ÚNICO elemento visível na impressão.
      */}
      {showPreview && createPortal(
        <div id="print-wrapper">
           <ReportContent isPrint={true} />
        </div>,
        document.getElementById('print-portal')!
      )}
    </div>
  );
};

export default Reports;
