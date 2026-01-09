
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { User, UserRole, ChangeRequest } from '../types';
import { MONTHS, SECTORS, STUDY_STATUSES, SHIFTS, VISIT_REASONS } from '../constants';

interface HistoryProps {
  user: User;
}

const History: React.FC<HistoryProps> = ({ user }) => {
  const [records, setRecords] = useState<any[]>([]);
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [filterModule, setFilterModule] = useState<string>('ALL');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [isEditing, setIsEditing] = useState<any | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<any | null>(null);
  const [confirmEdit, setConfirmEdit] = useState<any | null>(null);

  useEffect(() => {
    loadData();
  }, []);

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
    setRequests(storageService.getRequests());
  };

  const isCurrentMonth = (m: number, y: number) => {
    const d = new Date();
    return d.getMonth() + 1 === m && d.getFullYear() === y;
  };

  const canModify = (record: any) => {
    if (user.role === UserRole.ADMIN) return true;
    return isCurrentMonth(record.month, record.year);
  };

  const executeDelete = async () => {
    const record = confirmDelete;
    if (!record || isProcessing) return;

    setIsProcessing(true);

    try {
      if (!isCurrentMonth(record.month, record.year) && user.role !== UserRole.ADMIN) {
        const reason = prompt("Este registro é de um mês passado. Justifique a exclusão para o administrador aprovar:");
        if (reason) {
          await storageService.addRequest({
            id: Math.random().toString(36).substr(2, 9),
            recordId: record.id,
            type: 'DELETE',
            module: record._module,
            status: 'PENDING',
            requestedBy: user.id,
            requestedByName: user.name,
            requestedAt: new Date().toISOString(),
            reason
          });
          alert("Solicitação de exclusão enviada com sucesso!");
        }
      } else {
        switch (record._module) {
          case 'STUDY': await storageService.deleteStudy(record.id); break;
          case 'CLASS': await storageService.deleteClass(record.id); break;
          case 'PG': await storageService.deleteGroup(record.id); break;
          case 'VISIT': await storageService.deleteVisit(record.id); break;
        }
        alert("Registro excluído com sucesso!");
      }
    } catch (e) {
      alert("Erro ao excluir. Verifique sua conexão.");
    } finally {
      loadData();
      setIsProcessing(false);
      setConfirmDelete(null);
    }
  };

  const openEditor = () => {
    setIsEditing({ ...confirmEdit });
    setConfirmEdit(null);
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    
    setIsProcessing(true);
    const { _module, ...cleanRecord } = isEditing;

    try {
      if (!isCurrentMonth(isEditing.month, isEditing.year) && user.role !== UserRole.ADMIN) {
        const reason = prompt("Justificativa para alteração de mês retroativo:");
        if (reason) {
          await storageService.addRequest({
            id: Math.random().toString(36).substr(2, 9),
            recordId: isEditing.id,
            type: 'EDIT',
            module: _module,
            status: 'PENDING',
            requestedBy: user.id,
            requestedByName: user.name,
            requestedAt: new Date().toISOString(),
            reason,
            newData: cleanRecord
          });
          alert("Solicitação de edição retroativa enviada!");
        }
      } else {
        switch (_module) {
          case 'STUDY': await storageService.saveStudy(cleanRecord); break;
          case 'CLASS': await storageService.saveClass(cleanRecord); break;
          case 'PG': await storageService.saveGroup(cleanRecord); break;
          case 'VISIT': await storageService.saveVisit(cleanRecord); break;
        }
        alert("Alterações salvas com sucesso!");
      }
    } catch (e) {
      alert("Erro ao salvar alterações.");
    } finally {
      setIsEditing(null);
      loadData();
      setIsProcessing(false);
    }
  };

  const approveRequest = async (req: ChangeRequest) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      if (req.type === 'DELETE') {
        switch (req.module) {
          case 'STUDY': await storageService.deleteStudy(req.recordId); break;
          case 'CLASS': await storageService.deleteClass(req.recordId); break;
          case 'PG': await storageService.deleteGroup(req.recordId); break;
          case 'VISIT': await storageService.deleteVisit(req.recordId); break;
        }
      } else if (req.type === 'EDIT' && req.newData) {
        switch (req.module) {
          case 'STUDY': await storageService.saveStudy(req.newData); break;
          case 'CLASS': await storageService.saveClass(req.newData); break;
          case 'PG': await storageService.saveGroup(req.newData); break;
          case 'VISIT': await storageService.saveVisit(req.newData); break;
        }
      }
      await storageService.updateRequestStatus(req.id, 'APPROVED');
    } finally {
      loadData();
      setIsProcessing(false);
    }
  };

  const filteredRecords = records.filter(r => 
    (user.role === UserRole.ADMIN || r.chaplainId === user.id) && 
    (filterModule === 'ALL' || r._module === filterModule)
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight">Histórico de Atividades</h2>
          <p className="text-slate-500 font-medium text-lg italic">Controle e edição de registros ministeriais.</p>
        </div>
        <select 
          className="px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl shadow-xl text-sm font-black text-slate-600 outline-none"
          value={filterModule}
          onChange={(e) => setFilterModule(e.target.value)}
        >
          <option value="ALL">Visualizar Tudo</option>
          <option value="STUDY">📖 Estudos Bíblicos</option>
          <option value="CLASS">🎓 Classes Bíblicas</option>
          <option value="PG">🏠 Pequenos Grupos</option>
          <option value="VISIT">🤝 Visitas Colab.</option>
        </select>
      </div>

      {/* Tabela Customizada */}
      <div className="bg-white rounded-premium border border-slate-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Módulo / Nome</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Setor / Ref.</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRecords.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                       <span className={`w-fit text-[9px] font-black px-2 py-0.5 rounded-md mb-1 ${
                         item._module === 'STUDY' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                       }`}>
                         {item._module}
                       </span>
                       <span className="text-base font-black text-slate-800">{item.patientName || item.staffName || item.name || 'Registro de Equipe'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-bold text-slate-600">{item.sector}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{item.studySeries || item.reason || ''}</p>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-black text-primary italic">{MONTHS[item.month-1]} / {item.year}</p>
                    <p className="text-[9px] text-slate-300 font-bold">{new Date(item.createdAt).toLocaleDateString()}</p>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2">
                       {canModify(item) ? (
                         <>
                           <button onClick={() => setConfirmEdit(item)} className="p-3 bg-slate-50 text-primary rounded-xl hover:bg-primary hover:text-white transition-all">📝</button>
                           <button onClick={() => setConfirmDelete(item)} className="p-3 bg-slate-50 text-danger rounded-xl hover:bg-danger hover:text-white transition-all">✕</button>
                         </>
                       ) : (
                         <span className="text-[9px] font-black text-slate-300 uppercase px-3 py-2 bg-slate-50 rounded-xl">🔒 BLOQUEADO</span>
                       )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default History;
