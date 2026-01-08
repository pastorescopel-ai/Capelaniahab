
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
  
  // Estados para Controle de Modais
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

  const executeDelete = () => {
    const record = confirmDelete;
    if (!record) return;

    if (!isCurrentMonth(record.month, record.year)) {
      const reason = prompt("Este registro é de um mês passado. Justifique a exclusão para o administrador:");
      if (reason) {
        storageService.addRequest({
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
        loadData();
      }
    } else {
      switch (record._module) {
        case 'STUDY': storageService.deleteStudy(record.id); break;
        case 'CLASS': storageService.deleteClass(record.id); break;
        case 'PG': storageService.deleteGroup(record.id); break;
        case 'VISIT': storageService.deleteVisit(record.id); break;
      }
      loadData();
      alert("Registro excluído com sucesso!");
    }
    setConfirmDelete(null);
  };

  const openEditor = () => {
    setIsEditing({ ...confirmEdit });
    setConfirmEdit(null);
  };

  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, '').substring(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.substring(0, 2)}) ${digits.substring(2)}`;
    return `(${digits.substring(0, 2)}) ${digits.substring(2, 7)}-${digits.substring(7)}`;
  };

  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const { _module, ...cleanRecord } = isEditing;

    if (!isCurrentMonth(isEditing.month, isEditing.year)) {
      const reason = prompt("Justificativa para alteração de mês retroativo:");
      if (reason) {
        storageService.addRequest({
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
      setIsEditing(null);
      return;
    }

    // Edição direta
    switch (_module) {
      case 'STUDY': storageService.saveStudy(cleanRecord); break;
      case 'CLASS': storageService.saveClass(cleanRecord); break;
      case 'PG': storageService.saveGroup(cleanRecord); break;
      case 'VISIT': storageService.saveVisit(cleanRecord); break;
    }
    setIsEditing(null);
    loadData();
    alert("Alterações salvas com sucesso!");
  };

  const approveRequest = (req: ChangeRequest) => {
    if (req.type === 'DELETE') {
      switch (req.module) {
        case 'STUDY': storageService.deleteStudy(req.recordId); break;
        case 'CLASS': storageService.deleteClass(req.recordId); break;
        case 'PG': storageService.deleteGroup(req.recordId); break;
        case 'VISIT': storageService.deleteVisit(req.recordId); break;
      }
    } else if (req.type === 'EDIT' && req.newData) {
      switch (req.module) {
        case 'STUDY': storageService.saveStudy(req.newData); break;
        case 'CLASS': storageService.saveClass(req.newData); break;
        case 'PG': storageService.saveGroup(req.newData); break;
        case 'VISIT': storageService.saveVisit(req.newData); break;
      }
    }
    storageService.updateRequestStatus(req.id, 'APPROVED');
    loadData();
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
          <p className="text-slate-500 font-medium text-lg">Gerenciamento completo de registros efetuados.</p>
        </div>
        <select 
          className="px-6 py-4 bg-white border border-slate-100 rounded-2xl shadow-xl text-sm font-bold text-slate-600 outline-none focus:ring-4 focus:ring-primary/10 transition-all"
          value={filterModule}
          onChange={(e) => setFilterModule(e.target.value)}
        >
          <option value="ALL">Todos os Módulos</option>
          <option value="STUDY">📖 Estudos Bíblicos</option>
          <option value="CLASS">🎓 Classes Bíblicas</option>
          <option value="PG">🏠 Pequenos Grupos</option>
          <option value="VISIT">🤝 Visitas Colab.</option>
        </select>
      </div>

      {/* Modal de Confirmação de EXCLUSÃO */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
          <div className="bg-white rounded-premium p-8 max-w-sm w-full text-center space-y-6 shadow-2xl animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-danger/10 text-danger rounded-full flex items-center justify-center text-4xl mx-auto">⚠️</div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-800">Confirmar Exclusão</h3>
              <p className="text-slate-500 text-sm">Deseja realmente apagar o registro de <span className="font-bold text-slate-700">"{confirmDelete.patientName || confirmDelete.staffName || confirmDelete.name}"</span>?</p>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold">Não, manter</button>
              <button onClick={executeDelete} className="flex-1 py-4 bg-danger text-white rounded-2xl font-bold shadow-lg shadow-danger/20">Sim, excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de EDIÇÃO */}
      {confirmEdit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
          <div className="bg-white rounded-premium p-8 max-w-sm w-full text-center space-y-6 shadow-2xl animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center text-4xl mx-auto">📝</div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-800">Editar Registro?</h3>
              <p className="text-slate-500 text-sm">Deseja abrir as informações deste atendimento para modificação?</p>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setConfirmEdit(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold">Cancelar</button>
              <button onClick={openEditor} className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20">Sim, editar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Formuário de Edição Completo */}
      {isEditing && (
        <div className="fixed inset-0 bg-primary/20 backdrop-blur-md z-[200] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-premium w-full max-w-2xl shadow-2xl animate-in zoom-in duration-300 flex flex-col my-8">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-2xl font-black text-slate-800">Modificar {isEditing._module}</h3>
              <button onClick={() => setIsEditing(null)} className="text-slate-400 hover:text-danger text-2xl">✕</button>
            </div>
            <form onSubmit={saveEdit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Ano</label>
                  <input type="number" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none" value={isEditing.year} onChange={e => setIsEditing({...isEditing, year: Number(e.target.value)})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Mês</label>
                  <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none" value={isEditing.month} onChange={e => setIsEditing({...isEditing, month: Number(e.target.value)})}>
                    {MONTHS.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Setor</label>
                <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none" value={isEditing.sector} onChange={e => setIsEditing({...isEditing, sector: e.target.value})}>
                  {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Campos específicos por Módulo */}
              {isEditing._module === 'STUDY' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Nome do Paciente</label>
                    <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none" value={isEditing.patientName} onChange={e => setIsEditing({...isEditing, patientName: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">WhatsApp</label>
                    <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none" value={isEditing.whatsapp} onChange={e => setIsEditing({...isEditing, whatsapp: formatPhone(e.target.value)})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase">Série</label>
                      <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none" value={isEditing.studySeries || ''} onChange={e => setIsEditing({...isEditing, studySeries: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase">Lição</label>
                      <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none" value={isEditing.currentLesson || ''} onChange={e => setIsEditing({...isEditing, currentLesson: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Status</label>
                    <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none" value={isEditing.status} onChange={e => setIsEditing({...isEditing, status: e.target.value as any})}>
                      {STUDY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </>
              )}

              {isEditing._module === 'CLASS' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase">Série</label>
                      <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none" value={isEditing.studySeries || ''} onChange={e => setIsEditing({...isEditing, studySeries: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase">Lição</label>
                      <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none" value={isEditing.currentLesson || ''} onChange={e => setIsEditing({...isEditing, currentLesson: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Participantes (separados por vírgula)</label>
                    <textarea className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none" value={isEditing.students.join(', ')} onChange={e => setIsEditing({...isEditing, students: e.target.value.split(',').map(s => s.trim())})} />
                  </div>
                </>
              )}

              {isEditing._module === 'PG' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Nome do Grupo</label>
                    <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none" value={isEditing.name} onChange={e => setIsEditing({...isEditing, name: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Líder</label>
                    <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none" value={isEditing.leader} onChange={e => setIsEditing({...isEditing, leader: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase">Turno</label>
                      <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none" value={isEditing.shift} onChange={e => setIsEditing({...isEditing, shift: e.target.value as any})}>
                        {SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase">Qtd Participantes</label>
                      <input type="number" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none" value={isEditing.participantsCount} onChange={e => setIsEditing({...isEditing, participantsCount: Number(e.target.value)})} />
                    </div>
                  </div>
                </>
              )}

              {isEditing._module === 'VISIT' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Nome do Colaborador</label>
                    <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none" value={isEditing.staffName} onChange={e => setIsEditing({...isEditing, staffName: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Motivo</label>
                    <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none" value={isEditing.reason} onChange={e => setIsEditing({...isEditing, reason: e.target.value})}>
                      {VISIT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 p-2">
                    <input type="checkbox" id="edit-followup" checked={isEditing.needsFollowUp} onChange={e => setIsEditing({...isEditing, needsFollowUp: e.target.checked})} />
                    <label htmlFor="edit-followup" className="text-sm font-bold text-slate-600">Necessita Retorno?</label>
                  </div>
                </>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Observações</label>
                <textarea className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl min-h-[100px] outline-none focus:ring-2 focus:ring-primary/20" value={isEditing.observations || ''} onChange={e => setIsEditing({...isEditing, observations: e.target.value})} />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsEditing(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20">Efetivar Alterações</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {user.role === UserRole.ADMIN && requests.some(r => r.status === 'PENDING') && (
        <div className="bg-amber-50 border border-amber-100 rounded-premium p-8 space-y-6 shadow-sm">
          <h3 className="text-xl font-bold text-amber-800 flex items-center gap-2">
            <span>🔔</span> Solicitações Pendentes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requests.filter(r => r.status === 'PENDING').map(req => (
              <div key={req.id} className="bg-white p-6 rounded-2xl shadow-md border border-amber-100 space-y-4">
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-black text-slate-800">{req.requestedByName}</p>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black ${req.type === 'DELETE' ? 'bg-danger/10 text-danger' : 'bg-blue-100 text-blue-600'}`}>{req.type}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Módulo: {req.module}</p>
                  <p className="text-sm text-slate-600 mt-3 italic bg-slate-50 p-3 rounded-xl">"{req.reason || 'Sem justificativa'}"</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => storageService.updateRequestStatus(req.id, 'REJECTED')} className="flex-1 py-2 text-xs font-bold text-slate-400 hover:text-danger border border-slate-100 rounded-xl transition-all">Recusar</button>
                  <button onClick={() => approveRequest(req)} className="flex-1 py-2 text-xs font-bold bg-success text-white rounded-xl shadow-lg shadow-success/20 hover:scale-105 transition-all">Aprovar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-premium border border-slate-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Módulo</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Atendimento</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mês Referência</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRecords.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-8 py-6">
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-sm ${
                      item._module === 'STUDY' ? 'bg-blue-100 text-blue-600' : 
                      item._module === 'CLASS' ? 'bg-purple-100 text-purple-600' :
                      item._module === 'PG' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                    }`}>
                      {item._module === 'STUDY' ? '📖 Estudo' : 
                       item._module === 'CLASS' ? '🎓 Classe' :
                       item._module === 'PG' ? '🏠 PG' : '🤝 Visita'}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-base font-black text-slate-800">
                      {item.patientName || item.staffName || item.name || `${item.students?.length} Estudantes`}
                    </div>
                    <div className="text-xs text-slate-400 font-bold uppercase mt-0.5 tracking-tight">{item.sector}</div>
                    {(item.studySeries || item.currentLesson) && (
                      <div className="text-[10px] text-primary font-bold mt-1">
                        {item.studySeries} {item.currentLesson && `• ${item.currentLesson}`}
                      </div>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-sm font-bold text-slate-600">{MONTHS[item.month-1]} / {item.year}</div>
                    <div className="text-[10px] text-slate-400 font-medium">Registrado em: {new Date(item.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setConfirmEdit(item)}
                        className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-primary hover:border-primary/30 rounded-2xl shadow-sm transition-all"
                        title="Editar Registro"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => setConfirmDelete(item)}
                        className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-danger hover:border-danger/30 rounded-2xl shadow-sm transition-all"
                        title="Excluir Registro"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-slate-400 italic font-medium">Não há registros para os filtros selecionados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default History;
