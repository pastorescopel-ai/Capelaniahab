
import React, { useState, useMemo } from 'react';
import { storageService } from '../services/storageService';
import { HospitalUnit, BiblicalStudy, BiblicalClass, SmallGroup, StaffVisit } from '../types';

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
    config.customSectorsHAB.forEach((s: string) => sectors.add(s));
    config.customSectorsHABA.forEach((s: string) => sectors.add(s));
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
    const countUniqueStudents = (unit: HospitalUnit) => {
      const names = new Set<string>();
      
      filtered.studies
        .filter((s: BiblicalStudy) => s.hospitalUnit === unit)
        .forEach((s: BiblicalStudy) => {
          if (s.patientName) names.add(s.patientName.toLowerCase().trim());
        });

      filtered.classes
        .filter((c: BiblicalClass) => c.hospitalUnit === unit)
        .forEach((c: BiblicalClass) => {
          c.students.forEach((st: string) => {
            if (st) names.add(st.toLowerCase().trim());
          });
        });
        
      return names.size;
    };

    const countByUnit = (unit: HospitalUnit) => ({
      students: countUniqueStudents(unit),
      pgs: filtered.groups.filter((g: SmallGroup) => g.hospitalUnit === unit).length,
      visits: filtered.visits.filter((v: StaffVisit) => v.hospitalUnit === unit).length,
      classes: filtered.classes.filter((c: BiblicalClass) => c.hospitalUnit === unit).length,
      participantsInPGs: filtered.groups
        .filter((g: SmallGroup) => g.hospitalUnit === unit)
        .reduce((acc: number, curr: SmallGroup) => acc + (curr.participantsCount || 0), 0)
    });

    return {
      hab: countByUnit('HAB'),
      haba: countByUnit('HABA')
    };
  }, [filtered]);

  const pgsBySector = useMemo(() => {
    const sectors: Record<string, number> = {};
    filtered.groups.forEach((g: SmallGroup) => {
      sectors[g.sector] = (sectors[g.sector] || 0) + 1;
    });
    return sectors;
  }, [filtered.groups]);

  const handlePrint = () => {
    const printRoot = document.getElementById('print-root');
    if (!printRoot) return;
    
    printRoot.innerHTML = `
      <div style="padding: 40px; font-family: sans-serif;">
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 4px solid #005a9c; padding-bottom: 20px;">
          <img src="${config.reportLogo || ''}" style="height: 80px;" />
          <div style="text-align: right;">
            <h1 style="margin: 0; color: #005a9c;">${config.reportTitle}</h1>
            <p style="margin: 0; font-weight: bold;">${config.reportSubtitle}</p>
            <p style="margin: 0;">Período: ${startDate} a ${endDate}</p>
            <p style="margin: 0;">Setor: ${selectedSector}</p>
          </div>
        </div>
        <div style="margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div style="border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
            <h3 style="color: #005a9c; border-bottom: 2px solid #005a9c;">UNIDADE HAB</h3>
            <p><strong>Alunos Únicos:</strong> ${stats.hab.students}</p>
            <p><strong>PGs Realizados:</strong> ${stats.hab.pgs}</p>
            <p><strong>Total em PGs:</strong> ${stats.hab.participantsInPGs}</p>
            <p><strong>Classes Realizadas:</strong> ${stats.hab.classes}</p>
            <p><strong>Apoio Colaborador:</strong> ${stats.hab.visits}</p>
          </div>
          <div style="border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
            <h3 style="color: #005a9c; border-bottom: 2px solid #005a9c;">UNIDADE HABA</h3>
            <p><strong>Alunos Únicos:</strong> ${stats.haba.students}</p>
            <p><strong>PGs Realizados:</strong> ${stats.haba.pgs}</p>
            <p><strong>Total em PGs:</strong> ${stats.haba.participantsInPGs}</p>
            <p><strong>Classes Realizadas:</strong> ${stats.haba.classes}</p>
            <p><strong>Apoio Colaborador:</strong> ${stats.haba.visits}</p>
          </div>
        </div>
        <h3 style="margin-top: 30px;">DISTRIBUIÇÃO DE PGs POR SETOR</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr style="background: #f8fafc;">
              <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Setor</th>
              <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">Quantidade de PGs</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(pgsBySector).map(([s, v]) => `
              <tr>
                <td style="border: 1px solid #ddd; padding: 10px;">${s}</td>
                <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">${v}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    window.print();
  };

  return (
    <div className="space-y-8 pb-24">
      <div className="bg-white p-6 rounded-premium shadow-xl border border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Data Início</label>
          <input type="date" className="w-full p-3 bg-slate-50 border rounded-xl font-bold" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Data Fim</label>
          <input type="date" className="w-full p-3 bg-slate-50 border rounded-xl font-bold" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Filtrar por Setor</label>
          <select 
            className="w-full p-3 bg-slate-50 border rounded-xl font-bold outline-none focus:border-primary transition-all"
            value={selectedSector}
            onChange={e => setSelectedSector(e.target.value)}
          >
            {allSectors.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button onClick={handlePrint} className="bg-primary text-white w-full py-4 rounded-xl font-black shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
           GERAR PDF
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-primary text-white p-10 rounded-premium shadow-2xl relative overflow-hidden group">
           <p className="text-xs font-black uppercase opacity-60 tracking-widest mb-2">Alunos Únicos HAB</p>
           <h2 className="text-7xl font-black tracking-tighter">{stats.hab.students}</h2>
        </div>
        <div className="bg-slate-800 text-white p-10 rounded-premium shadow-2xl relative overflow-hidden group">
           <p className="text-xs font-black uppercase opacity-60 tracking-widest mb-2">Alunos Únicos HABA</p>
           <h2 className="text-7xl font-black tracking-tighter">{stats.haba.students}</h2>
        </div>
      </div>
    </div>
  );
};

export default Reports;
