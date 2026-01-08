
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
    // Adiciona 23:59:59 ao final do dia final
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

  // Lógica de Alunos Únicos (Soma nomes de estudos e classes sem repetir)
  const uniqueStudentsTotal = useMemo(() => {
    const names = new Set<string>();
    
    // Nomes dos estudos bíblicos
    data.studies.forEach(s => {
        if (s.patientName) names.add(s.patientName.trim().toLowerCase());
    });
    
    // Nomes das classes bíblicas
    data.classes.forEach(c => {
        c.students.forEach(st => {
            if (st) names.add(st.trim().toLowerCase());
        });
    });
    
    return names.size;
  }, [data.studies, data.classes]);

  // Dados para o Gráfico de Barras por Capelão
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

  const ReportContent = () => (
    <div id="printable-report" className="bg-white p-10 text-slate-900 border-[10px] border-slate-50 min-h-screen">
      {/* Cabeçalho Customizado */}
      <div className="flex items-center justify-between border-b-4 border-primary pb-6 mb-8">
        <div className="flex items-center gap-8">
          <div className="h-24 w-24 flex items-center justify-center overflow-hidden">
            {config.reportLogo ? (
              <img src={config.reportLogo} alt="Logo" className="max-h-full max-w-full object-contain" />
            ) : (
              <div className="w-full h-full bg-primary text-white font-black flex items-center justify-center rounded-2xl text-4xl italic shadow-lg">C</div>
            )}
          </div>
          <div>
            <h1 
              style={{ fontSize: `${config.reportTitleFontSize}px` }} 
              className="font-black uppercase tracking-tighter text-slate-900 leading-none"
            >
              {config.reportTitle}
            </h1>
            <p 
              style={{ fontSize: `${config.reportSubtitleFontSize}px` }} 
              className="text-primary font-bold uppercase tracking-widest mt-1"
            >
              {config.reportSubtitle}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estudantes Únicos (Soma Total)</p>
          <p className="text-5xl font-black text-slate-900 leading-none">{uniqueStudentsTotal}</p>
        </div>
      </div>

      <p className="text-[10px] font-black text-slate-300 uppercase mb-8">
        Período: {new Date(startDate).toLocaleDateString()} a {new Date(endDate).toLocaleDateString()} • 
        Filtro: {selectedChaplain === 'ALL' ? 'Toda a Equipe' : allUsers.find(u => u.id === selectedChaplain)?.name}
      </p>

      {/* Cards de Totais */}
      <div className="grid grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Estudos Bíblicos', val: data.studies.length, color: 'text-blue-600', emoji: '📖' },
          { label: 'Classes Bíblicas', val: data.classes.length, color: 'text-purple-600', emoji: '🎓' },
          { label: 'Pequenos Grupos', val: data.groups.length, color: 'text-orange-600', emoji: '🏠' },
          { label: 'Apoio Colaborador', val: data.visits.length, color: 'text-green-600', emoji: '🤝' }
        ].map((card, i) => (
          <div key={i} className="p-5 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col items-center text-center">
            <span className="text-2xl mb-1">{card.emoji}</span>
            <p className="text-[8px] font-black text-slate-400 uppercase mb-1">{card.label}</p>
            <p className={`text-3xl font-black ${card.color}`}>{card.val}</p>
          </div>
        ))}
      </div>

      {/* Gráfico de Barras */}
      <div className="space-y-10">
         <section className="space-y-4 bg-slate-50 p-8 rounded-premium border border-slate-100">
            <h3 className="text-sm font-black uppercase border-b border-slate-200 pb-4 flex items-center gap-2 text-slate-500">
              📊 Desempenho Comparativo da Equipe
            </h3>
            <div className="h-80 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chaplainPerformanceData}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                     <XAxis dataKey="name" tick={{fontSize: 10, fontWeight: 700}} axisLine={false} tickLine={false} />
                     <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                     <Tooltip 
                       contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                       cursor={{fill: '#f8fafc'}}
                     />
                     <Legend wrapperStyle={{fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '20px'}} />
                     <Bar dataKey="Estudos" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                     <Bar dataKey="Classes" stackId="a" fill="#a855f7" radius={[0, 0, 0, 0]} />
                     <Bar dataKey="Grupos" stackId="a" fill="#f97316" radius={[0, 0, 0, 0]} />
                     <Bar dataKey="Visitas" stackId="a" fill="#22c55e" radius={[6, 6, 0, 0]} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </section>
      </div>

      <div className="mt-20 flex justify-around border-t border-slate-200 pt-10 opacity-60">
         <div className="text-center w-64 border-t border-slate-900 pt-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-800">Coordenação de Capelania</p>
         </div>
         <div className="text-center w-64 border-t border-slate-900 pt-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-800">Direção Geral</p>
         </div>
      </div>
      
      <p className="text-center text-[8px] font-bold text-slate-300 mt-20 uppercase tracking-widest">
        Gerado pelo Sistema de Gestão de Capelania em {new Date().toLocaleString()}
      </p>
    </div>
  );

  return (
    <div className="space-y-10 pb-40">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 print:hidden">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight italic">Relatórios Dinâmicos</h2>
          <p className="text-slate-500 font-medium italic">Selecione o período e o membro para análise.</p>
        </div>
        
        <div className="flex flex-wrap items-end gap-4 bg-white p-6 rounded-premium border border-slate-100 shadow-xl">
           <div className="space-y-1">
             <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Início</label>
             <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="block px-4 py-2 bg-slate-50 border-none rounded-xl font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary/20" />
           </div>
           <div className="space-y-1">
             <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Fim</label>
             <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="block px-4 py-2 bg-slate-50 border-none rounded-xl font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary/20" />
           </div>
           <div className="space-y-1">
             <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Capelão</label>
             <select value={selectedChaplain} onChange={e => setSelectedChaplain(e.target.value)} className="block px-4 py-2 bg-slate-50 border-none rounded-xl font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary/20 min-w-[150px]">
                <option value="ALL">Todos os Membros</option>
                {allUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
             </select>
           </div>
        </div>
      </div>

      <div className="flex justify-center print:hidden">
        <button onClick={() => setShowPreview(true)} className="group px-20 py-7 bg-slate-900 text-white rounded-premium font-black text-xl hover:bg-primary transition-all shadow-2xl flex items-center gap-4">
           <span>GERAR PREVIEW DO RELATÓRIO</span>
           <span className="group-hover:translate-x-1 transition-transform">→</span>
        </button>
      </div>

      {showPreview && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[1000] overflow-y-auto p-4 md:p-12 flex flex-col items-center no-scrollbar">
          <div className="w-full max-w-[21cm] flex items-center justify-between mb-8 bg-white/10 p-6 rounded-3xl border border-white/10 shadow-3xl sticky top-0 z-[1001] backdrop-blur-md">
             <button onClick={() => setShowPreview(false)} className="px-8 py-4 bg-white/10 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/20 transition-all">Voltar</button>
             <button onClick={() => window.print()} className="px-14 py-4 bg-primary text-white rounded-xl font-black text-sm shadow-3xl uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">Imprimir / Salvar PDF 📄</button>
          </div>
          
          {/* Container simulando A4 no Preview */}
          <div className="bg-white shadow-2xl scale-90 md:scale-100 origin-top overflow-visible print:scale-100 w-full max-w-[21cm]">
            <ReportContent />
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
