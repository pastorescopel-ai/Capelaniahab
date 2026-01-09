
import React, { useState, useMemo } from 'react';
import { storageService } from '../services/storageService';
import { HospitalUnit, UserRole } from '../types';

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

  const filtered = useMemo(() => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime() + 86400000;
    
    const f = (list: any[]) => list.filter(item => {
      const d = new Date(item.date).getTime();
      return d >= start && d <= end;
    });

    return {
      studies: f(allStudies),
      classes: f(allClasses),
      groups: f(allGroups),
      visits: f(allVisits)
    };
  }, [startDate, endDate]);

  const stats = useMemo(() => {
    const countUniqueStudents = (unit: HospitalUnit) => {
      const names = new Set<string>();
      filtered.studies.filter(s => s.hospitalUnit === unit).forEach(s => names.add(s.patientName.toLowerCase().trim()));
      filtered.classes.filter(c => c.hospitalUnit === unit).forEach(c => c.students.forEach(st => names.add(st.toLowerCase().trim())));
      return names.size;
    };

    const countByUnit = (unit: HospitalUnit) => ({
      students: countUniqueStudents(unit),
      pgs: filtered.groups.filter(g => g.hospitalUnit === unit).length,
      visits: filtered.visits.filter(v => v.hospitalUnit === unit).length,
      classes: filtered.classes.filter(c => c.hospitalUnit === unit).length
    });

    return {
      hab: countByUnit('HAB'),
      haba: countByUnit('HABA')
    };
  }, [filtered]);

  const pgsBySector = useMemo(() => {
    const sectors: Record<string, number> = {};
    filtered.groups.forEach(g => {
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
          </div>
        </div>
        <div style="margin-top: 40px; display: grid; grid-cols: 2; gap: 20px;">
          <div style="border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
            <h3>UNIDADE HAB</h3>
            <p>Total Alunos Únicos: ${stats.hab.students}</p>
            <p>Total PGs realizados: ${stats.hab.pgs}</p>
            <p>Total Classes: ${stats.hab.classes}</p>
            <p>Total Apoio Colaborador: ${stats.hab.visits}</p>
          </div>
          <div style="border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
            <h3>UNIDADE HABA</h3>
            <p>Total Alunos Únicos: ${stats.haba.students}</p>
            <p>Total PGs realizados: ${stats.haba.pgs}</p>
            <p>Total Classes: ${stats.haba.classes}</p>
            <p>Total Apoio Colaborador: ${stats.haba.visits}</p>
          </div>
        </div>
        <h3 style="margin-top: 30px;">PGs POR SETOR</h3>
        <ul>
          ${Object.entries(pgsBySector).map(([s, v]) => `<li>${s}: ${v}</li>`).join('')}
        </ul>
      </div>
    `;
    window.print();
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end bg-white p-6 rounded-premium shadow-lg border">
        <div className="flex gap-4">
          <input type="date" className="p-2 border rounded-xl font-bold" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <input type="date" className="p-2 border rounded-xl font-bold" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
        <button onClick={handlePrint} className="bg-primary text-white px-6 py-3 rounded-xl font-black shadow-lg">GERAR PDF OFICIAL</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-primary text-white p-8 rounded-premium shadow-xl">
           <p className="text-xs font-black uppercase opacity-60">Alunos Únicos HAB (Estudos + Classes)</p>
           <h2 className="text-6xl font-black">{stats.hab.students}</h2>
        </div>
        <div className="bg-slate-800 text-white p-8 rounded-premium shadow-xl">
           <p className="text-xs font-black uppercase opacity-60">Alunos Únicos HABA (Estudos + Classes)</p>
           <h2 className="text-6xl font-black">{stats.haba.students}</h2>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-premium border shadow-sm">
          <p className="text-[10px] font-black opacity-40 uppercase">Total PGs HAB</p>
          <p className="text-3xl font-black text-primary">{stats.hab.pgs}</p>
        </div>
        <div className="bg-white p-6 rounded-premium border shadow-sm">
          <p className="text-[10px] font-black opacity-40 uppercase">Total PGs HABA</p>
          <p className="text-3xl font-black text-primary">{stats.haba.pgs}</p>
        </div>
        <div className="bg-white p-6 rounded-premium border shadow-sm">
          <p className="text-[10px] font-black opacity-40 uppercase">Apoios HAB</p>
          <p className="text-3xl font-black text-success">{stats.hab.visits}</p>
        </div>
        <div className="bg-white p-6 rounded-premium border shadow-sm">
          <p className="text-[10px] font-black opacity-40 uppercase">Apoios HABA</p>
          <p className="text-3xl font-black text-success">{stats.haba.visits}</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-premium shadow-xl border">
        <h3 className="font-black text-slate-800 mb-4 uppercase">Distribuição de PGs por Setor</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(pgsBySector).map(([sector, count]) => (
            <div key={sector} className="p-4 bg-slate-50 rounded-2xl border">
              <p className="text-[9px] font-black text-slate-400 uppercase truncate">{sector}</p>
              <p className="text-xl font-black text-primary">{count}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Reports;
