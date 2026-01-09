
import React, { useState, useMemo } from 'react';
import { storageService } from '../services/storageService';
import { HospitalUnit, UserRole, BiblicalStudy, BiblicalClass, SmallGroup, StaffVisit } from '../types';
import SearchableSelect from './SearchableSelect';

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

  // Consolidação de setores para o filtro
  const allSectors = useMemo(() => {
    const sectors = new Set<string>();
    config.customSectorsHAB.forEach(s => sectors.add(s));
    config.customSectorsHABA.forEach(s => sectors.add(s));
    return ['TODOS', ...Array.from(sectors).sort()];
  }, [config]);

  const filtered = useMemo(() => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime() + 86400000;
    
    const filterFn = (list: any[]) => list.filter(item => {
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
      
      // Adiciona pacientes de estudos bíblicos (HAB ou HABA)
      filtered.studies
        .filter(s => s.hospitalUnit === unit)
        .forEach(s => {
          if (s.patientName) names.add(s.patientName.toLowerCase().trim());
        });

      // Adiciona alunos de classes bíblicas (HAB ou HABA)
      filtered.classes
        .filter(c => c.hospitalUnit === unit)
        .forEach(c => {
          c.students.forEach((st: string) => {
            if (st) names.add(st.toLowerCase().trim());
          });
        });
        
      return names.size;
    };

    const countByUnit = (unit: HospitalUnit) => ({
      students: countUniqueStudents(unit),
      pgs: filtered.groups.filter(g => g.hospitalUnit === unit).length,
      visits: filtered.visits.filter(v => v.hospitalUnit === unit).length,
      classes: filtered.classes.filter(c => c.hospitalUnit === unit).length,
      participantsInPGs: filtered.groups
        .filter(g => g.hospitalUnit === unit)
        .reduce((acc, curr) => acc + (curr.participantsCount || 0), 0)
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
        <div style="margin-top: 50px; text-align: center; font-size: 12px; color: #64748b;">
          Documento gerado em ${new Date().toLocaleString('pt-BR')} pelo Sistema de Gestão de Capelania
        </div>
      </div>
    `;
    window.print();
  };

  return (
    <div className="space-y-8 pb-24">
      {/* Filtros Superiores */}
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
           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
           </svg>
           GERAR PDF
        </button>
      </div>

      {/* Cards de Alunos Únicos (HAB e HABA) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-primary text-white p-10 rounded-premium shadow-2xl relative overflow-hidden group">
           <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all"></div>
           <p className="text-xs font-black uppercase opacity-60 tracking-widest mb-2">Alunos Únicos HAB</p>
           <div className="flex items-baseline gap-3">
             <h2 className="text-7xl font-black tracking-tighter">{stats.hab.students}</h2>
             <span className="text-sm font-bold opacity-40 italic">Indivíduos</span>
           </div>
           <p className="text-[10px] font-bold mt-4 opacity-50 uppercase tracking-tighter">Soma de Estudos + Classes (Sem repetir nomes)</p>
        </div>
        <div className="bg-slate-800 text-white p-10 rounded-premium shadow-2xl relative overflow-hidden group">
           <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all"></div>
           <p className="text-xs font-black uppercase opacity-60 tracking-widest mb-2">Alunos Únicos HABA</p>
           <div className="flex items-baseline gap-3">
             <h2 className="text-7xl font-black tracking-tighter">{stats.haba.students}</h2>
             <span className="text-sm font-bold opacity-40 italic">Indivíduos</span>
           </div>
           <p className="text-[10px] font-bold mt-4 opacity-50 uppercase tracking-tighter">Soma de Estudos + Classes (Sem repetir nomes)</p>
        </div>
      </div>

      {/* Grid de Totais Detalhados */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'PGs HAB', value: stats.hab.pgs, color: 'text-primary' },
          { label: 'PGs HABA', value: stats.haba.pgs, color: 'text-primary' },
          { label: 'Apoio HAB', value: stats.hab.visits, color: 'text-success' },
          { label: 'Apoio HABA', value: stats.haba.visits, color: 'text-success' },
        ].map((item, idx) => (
          <div key={idx} className="bg-white p-6 rounded-premium border border-slate-100 shadow-sm hover:shadow-md transition-all text-center">
            <p className="text-[10px] font-black opacity-40 uppercase mb-1">{item.label}</p>
            <p className={`text-4xl font-black ${item.color} tracking-tighter`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Distribuição por Setor */}
      <div className="bg-white p-8 rounded-premium shadow-xl border border-slate-100">
        <div className="flex items-center justify-between mb-8">
          <h3 className="font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <span className="w-2 h-6 bg-primary rounded-full"></span>
            Distribuição de PGs por Setor
          </h3>
          <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-4 py-2 rounded-full border uppercase">Total: {Object.keys(pgsBySector).length} Setores</span>
        </div>
        
        {Object.keys(pgsBySector).length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Object.entries(pgsBySector).map(([sector, count]) => (
              <div key={sector} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center group hover:bg-white hover:shadow-lg transition-all">
                <p className="text-[9px] font-black text-slate-400 uppercase truncate w-full text-center mb-1">{sector}</p>
                <p className="text-2xl font-black text-primary group-hover:scale-110 transition-transform">{count}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-slate-400 italic font-medium">Nenhum Pequeno Grupo registrado para os filtros selecionados.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
