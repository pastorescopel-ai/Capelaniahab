
import React, { useState, useMemo } from 'react';
import { storageService } from '../services/storageService';
import { BiblicalStudy, BiblicalClass, SmallGroup, StaffVisit } from '../types';

interface ReportsProps {
  user: any;
}

const Reports: React.FC<ReportsProps> = ({ user }) => {
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSector, setSelectedSector] = useState('TODOS');
  
  const allStudies = storageService.getStudies();
  const allClasses = storageService.getClasses();
  const allGroups = storageService.getGroups();
  const allVisits = storageService.getVisits();
  const config = storageService.getConfig();

  const allSectors = useMemo(() => {
    const sectors = new Set<string>();
    (config.customSectors || []).forEach((s: string) => sectors.add(s));
    return ['TODOS', ...Array.from(sectors).sort()];
  }, [config]);

  const filtered = useMemo(() => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime() + 86400000;
    
    const filterFn = (list: any[]) => list.filter((item: any) => {
      const itemDate = new Date(item.date).getTime();
      const matchDate = itemDate >= start && itemDate <= end;
      const matchSector = selectedSector === 'TODOS' || item.sector === selectedSector;
      return matchDate && matchSector;
    });

    return {
      studies: filterFn(allStudies) as BiblicalStudy[],
      classes: filterFn(allClasses) as BiblicalClass[],
      groups: filterFn(allGroups) as SmallGroup[],
      visits: filterFn(allVisits) as StaffVisit[]
    };
  }, [startDate, endDate, selectedSector, allStudies, allClasses, allGroups, allVisits]);

  const stats = useMemo(() => {
    const names = new Set<string>();
    
    filtered.studies.forEach((s: BiblicalStudy) => {
      if (s.patientName) names.add(s.patientName.toLowerCase().trim());
    });

    filtered.classes.forEach((c: BiblicalClass) => {
      if (c.students && Array.isArray(c.students)) {
        c.students.forEach((st: string) => {
          if (st) names.add(st.toLowerCase().trim());
        });
      }
    });

    return {
      uniqueStudents: names.size,
      totalPGs: filtered.groups.length,
      totalVisits: filtered.visits.length,
      totalClasses: filtered.classes.length,
      participantsInPGs: filtered.groups.reduce((acc: number, curr: SmallGroup) => acc + (Number(curr.participantsCount) || 0), 0)
    };
  }, [filtered]);

  const handlePrint = () => {
    const printRoot = document.getElementById('print-root');
    if (!printRoot) return;
    
    printRoot.innerHTML = `
      <div style="padding: 40px; font-family: sans-serif;">
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 4px solid #005a9c; padding-bottom: 20px;">
          <img src="${config.reportLogo || ''}" style="height: 80px;" />
          <div style="text-align: right;">
            <h1 style="margin: 0; color: #005a9c;">${config.reportTitle || 'RELATÓRIO MENSAL'}</h1>
            <p style="margin: 0; font-weight: bold;">${config.reportSubtitle || 'CAPELANIA HOSPITALAR'}</p>
            <p style="margin: 0;">Período: ${startDate} a ${endDate}</p>
          </div>
        </div>
        <div style="margin-top: 40px; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
          <h3 style="color: #005a9c; border-bottom: 2px solid #005a9c; margin-top: 0;">RESUMO GERAL</h3>
          <p><strong>Alunos Únicos Atendidos:</strong> ${stats.uniqueStudents}</p>
          <p><strong>Pequenos Grupos Realizados:</strong> ${stats.totalPGs}</p>
          <p><strong>Pessoas Alcançadas em PGs:</strong> ${stats.participantsInPGs}</p>
          <p><strong>Classes Bíblicas Realizadas:</strong> ${stats.totalClasses}</p>
          <p><strong>Apoio a Colaboradores:</strong> ${stats.totalVisits}</p>
        </div>
      </div>
    `;
    window.print();
  };

  return (
    <div className="space-y-8 pb-24">
      <div className="bg-white p-6 rounded-premium shadow-xl border border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Início</label>
          <input type="date" className="w-full p-3 bg-slate-50 border rounded-xl font-bold" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Fim</label>
          <input type="date" className="w-full p-3 bg-slate-50 border rounded-xl font-bold" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Setor</label>
          <select 
            className="w-full p-3 bg-slate-50 border rounded-xl font-bold outline-none focus:border-primary transition-all"
            value={selectedSector}
            onChange={e => setSelectedSector(e.target.value)}
          >
            {allSectors.map((s: string) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button onClick={handlePrint} className="bg-primary text-white w-full py-4 rounded-xl font-black shadow-lg hover:bg-slate-800 transition-all">
           GERAR RELATÓRIO
        </button>
      </div>

      <div className="bg-primary text-white p-10 rounded-premium shadow-2xl relative overflow-hidden group">
         <p className="text-xs font-black uppercase opacity-60 tracking-widest mb-2">Total de Impacto (Alunos Únicos)</p>
         <h2 className="text-7xl font-black tracking-tighter">{stats.uniqueStudents}</h2>
      </div>
    </div>
  );
};

export default Reports;
