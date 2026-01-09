
import React, { useState, useEffect, useMemo } from 'react';
import { storageService } from '../services/storageService';
import { User, UserRole } from '../types';
import { MONTHS } from '../constants';

interface HistoryProps {
  user: User;
}

const History: React.FC<HistoryProps> = ({ user }) => {
  const [records, setRecords] = useState<any[]>([]);
  const [filterModule, setFilterModule] = useState<string>('ALL');

  const loadData = () => {
    const studies = storageService.getStudies();
    const classes = storageService.getClasses();
    const groups = storageService.getGroups();
    const visits = storageService.getVisits();
    const all = [
      ...studies.map(s => ({ ...s, _module: 'STUDY' })),
      ...classes.map(c => ({ ...c, _module: 'CLASS' })),
      ...groups.map(g => ({ ...g, _module: 'PG' })),
      ...visits.map(v => ({ ...v, _module: 'VISIT' }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setRecords(all);
  };

  useEffect(() => { loadData(); }, []);

  const isCurrentMonth = (m: number, y: number) => {
    const d = new Date();
    return d.getMonth() + 1 === m && d.getFullYear() === y;
  };

  const filteredRecords = useMemo(() => {
    return records.filter(r => 
      (user.role === UserRole.ADMIN || r.chaplainId === user.id) && 
      (filterModule === 'ALL' || r._module === filterModule)
    );
  }, [records, filterModule, user]);

  const handleDelete = async (item: any) => {
    if (user.role !== UserRole.ADMIN && !isCurrentMonth(item.month, item.year)) {
        alert("Ação bloqueada: Somente o administrador pode excluir registros de meses anteriores.");
        return;
    }

    if (confirm("Deseja realmente excluir este registro permanentemente?")) {
        if (item._module === 'STUDY') await storageService.deleteStudy(item.id);
        else if (item._module === 'CLASS') await storageService.deleteClass(item.id);
        else if (item._module === 'PG') await storageService.deleteGroup(item.id);
        else if (item._module === 'VISIT') await storageService.deleteVisit(item.id);
        loadData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-3xl font-black text-slate-800 italic">Histórico Ministerial</h2>
        <select 
          className="px-6 py-3 bg-white border-2 border-slate-100 rounded-2xl font-bold outline-none"
          value={filterModule}
          onChange={(e) => setFilterModule(e.target.value)}
        >
          <option value="ALL">Todos os Lançamentos</option>
          <option value="STUDY">📖 Estudos Bíblicos</option>
          <option value="CLASS">🎓 Classes Bíblicas</option>
          <option value="PG">🏠 Pequenos Grupos</option>
          <option value="VISIT">🤝 Apoio Colaborador</option>
        </select>
      </div>

      <div className="bg-white rounded-premium border border-slate-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Setor</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRecords.map((item) => {
                const canModify = user.role === UserRole.ADMIN || isCurrentMonth(item.month, item.year);
                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <p className="font-black text-slate-800">{item.patientName || item.staffName || item.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{item._module}</p>
                    </td>
                    <td className="px-6 py-5 text-sm font-bold text-slate-600">{item.sector}</td>
                    <td className="px-6 py-5">
                      <p className="text-xs font-black text-primary uppercase">{MONTHS[item.month-1]} / {item.year}</p>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        {canModify ? (
                          <button onClick={() => handleDelete(item)} className="p-2 bg-danger/10 text-danger rounded-xl hover:bg-danger hover:text-white transition-all">✕</button>
                        ) : (
                          <span className="text-[9px] font-black text-slate-300 bg-slate-50 px-3 py-2 rounded-xl uppercase">Bloqueado</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default History;
