
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { storageService } from '../services/storageService';
import { User, BiblicalStudy, BiblicalClass, SmallGroup, StaffVisit, HospitalUnit } from '../types';
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
  const [data, setData] = useState({
    studies: [] as BiblicalStudy[],
    classes: [] as BiblicalClass[],
    groups: [] as SmallGroup[],
    visits: [] as StaffVisit[]
  });

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

  const countStudentsByUnit = (unit: HospitalUnit) => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime() + 86399999;
    
    const unitStudies = storageService.getStudies().filter(s => s.hospitalUnit === unit && new Date(s.date || s.createdAt).getTime() >= start && new Date(s.date || s.createdAt).getTime() <= end);
    const unitClasses = storageService.getClasses().filter(c => c.hospitalUnit === unit && new Date(c.date || c.createdAt).getTime() >= start && new Date(c.date || c.createdAt).getTime() <= end);

    const names = new Set<string>();
    unitStudies.forEach(s => s.patientName && names.add(s.patientName.trim().toLowerCase()));
    unitClasses.forEach(c => c.students.forEach(st => st && names.add(st.trim().toLowerCase())));
    return names.size;
  };

  const studentsHAB = useMemo(() => countStudentsByUnit('HAB'), [startDate, endDate]);
  const studentsHABA = useMemo(() => countStudentsByUnit('HABA'), [startDate, endDate]);

  return (
    <div className="space-y-10 pb-40">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-800 italic">Relatórios Estratégicos</h2>
          <p className="text-slate-500 font-medium italic">Gestão de indicadores separados por Unidade.</p>
        </div>
        <div className="flex gap-4 bg-white p-4 rounded-premium shadow-xl border">
           <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="px-4 py-2 bg-slate-50 border rounded-xl font-bold" />
           <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="px-4 py-2 bg-slate-50 border rounded-xl font-bold" />
           <select value={selectedChaplain} onChange={e => setSelectedChaplain(e.target.value)} className="px-4 py-2 bg-slate-50 border rounded-xl font-bold">
                <option value="ALL">Toda Equipe</option>
                {allUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
           </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-primary p-8 rounded-premium text-white shadow-xl flex justify-between items-center">
            <div>
              <p className="text-xs font-black uppercase opacity-60 tracking-widest">Alunos HAB</p>
              <p className="text-6xl font-black tracking-tighter">{studentsHAB}</p>
            </div>
            <span className="text-4xl opacity-20">🏥</span>
          </div>
          <div className="bg-slate-800 p-8 rounded-premium text-white shadow-xl flex justify-between items-center">
            <div>
              <p className="text-xs font-black uppercase opacity-60 tracking-widest">Alunos HABA</p>
              <p className="text-6xl font-black tracking-tighter">{studentsHABA}</p>
            </div>
            <span className="text-4xl opacity-20">⛪</span>
          </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Estudos', val: data.studies.length, color: 'text-blue-600' },
            { label: 'Classes', val: data.classes.length, color: 'text-purple-600' },
            { label: 'PGs', val: data.groups.length, color: 'text-orange-600' },
            { label: 'Visitas', val: data.visits.length, color: 'text-green-600' }
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-6 rounded-premium border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
              <p className={`text-4xl font-black ${item.color}`}>{item.val}</p>
            </div>
          ))}
      </div>
    </div>
  );
};

export default Reports;
