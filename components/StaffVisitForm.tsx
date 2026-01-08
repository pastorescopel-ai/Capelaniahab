
import React, { useState, useEffect } from 'react';
import { SECTORS, VISIT_REASONS } from '../constants';
import { storageService } from '../services/storageService';
import { StaffVisit, User } from '../types';

interface StaffVisitFormProps {
  user: User;
  onSuccess: () => void;
}

const StaffVisitForm: React.FC<StaffVisitFormProps> = ({ user, onSuccess }) => {
  const [recentRecords, setRecentRecords] = useState<StaffVisit[]>([]);
  const config = storageService.getConfig();
  const sectors = config.customSectors.length > 0 ? config.customSectors : SECTORS;
  const collaborators = config.customCollaborators || [];

  const [formData, setFormData] = useState({
    id: '',
    date: new Date().toISOString().split('T')[0],
    sector: sectors[0],
    staffName: '',
    reason: VISIT_REASONS[0],
    needsFollowUp: false,
    observations: ''
  });

  const loadRecent = () => {
    const now = new Date();
    const all = storageService.getVisits();
    const filtered = all.filter(s => s.month === (now.getMonth() + 1) && s.year === now.getFullYear() && s.chaplainId === user.id);
    setRecentRecords(filtered.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  };

  useEffect(() => { loadRecent(); }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.staffName || !formData.date) {
      alert("Preencha o nome do colaborador e a data.");
      return;
    }

    const dateObj = new Date(formData.date);
    const visit: StaffVisit = {
      ...formData,
      id: formData.id || Math.random().toString(36).substr(2, 9),
      year: dateObj.getFullYear(),
      month: dateObj.getMonth() + 1,
      chaplainId: user.id,
      createdAt: formData.id ? recentRecords.find(r => r.id === formData.id)?.createdAt || new Date().toISOString() : new Date().toISOString()
    } as StaffVisit;
    
    storageService.saveVisit(visit).then(() => {
      alert("Atendimento registrado!");
      setFormData({ id: '', date: new Date().toISOString().split('T')[0], sector: sectors[0], staffName: '', reason: VISIT_REASONS[0], needsFollowUp: false, observations: '' });
      loadRecent();
      onSuccess();
    });
  };

  const handleToggleFollowUp = async (record: StaffVisit) => {
    const updatedRecord = { ...record, needsFollowUp: !record.needsFollowUp };
    await storageService.saveVisit(updatedRecord);
    loadRecent();
  };

  return (
    <div className="space-y-12">
      <div className="bg-white p-8 rounded-premium border border-slate-100 shadow-xl">
        <h2 className="text-2xl font-black text-slate-800 mb-8 border-b pb-4 italic">🤝 Apoio a Colaborador</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data *</label>
            <input type="date" required className="w-full px-4 py-3 bg-slate-50 border rounded-2xl outline-none font-bold" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Setor *</label>
            <select required className="w-full px-4 py-3 bg-slate-50 border rounded-2xl outline-none font-bold" value={formData.sector} onChange={(e) => setFormData({...formData, sector: e.target.value})}>
              {sectors.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Colaborador *</label>
            <input type="text" list="collab-list" required placeholder="Digite ou escolha..." className="w-full px-4 py-3 bg-slate-50 border rounded-2xl outline-none font-bold" value={formData.staffName} onChange={(e) => setFormData({...formData, staffName: e.target.value})} />
            <datalist id="collab-list">
               {collaborators.map((c, i) => <option key={i} value={c} />)}
            </datalist>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Motivo *</label>
            <select required className="w-full px-4 py-3 bg-slate-50 border rounded-2xl outline-none font-bold" value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})}>
              {VISIT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group cursor-pointer hover:bg-amber-50 transition-colors md:col-span-2">
             <input type="checkbox" id="needs-followup-check" className="w-6 h-6 accent-primary rounded-lg cursor-pointer" checked={formData.needsFollowUp} onChange={e => setFormData({...formData, needsFollowUp: e.target.checked})} />
             <label htmlFor="needs-followup-check" className="text-sm font-black text-slate-700 cursor-pointer select-none">
                MARCAR PARA RETORNO PASTORAL?
                <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Sinalizará uma bandeira vermelha no histórico.</p>
             </label>
          </div>
          <textarea rows={3} className="md:col-span-2 w-full px-4 py-3 bg-slate-50 border rounded-2xl outline-none font-medium" placeholder="Relato do atendimento..." value={formData.observations} onChange={(e) => setFormData({...formData, observations: e.target.value})} />
          <button type="submit" className="md:col-span-2 py-5 bg-primary text-white rounded-premium font-black shadow-xl hover:scale-[1.01] transition-all">
            {formData.id ? 'Salvar Alterações' : 'Finalizar Atendimento'}
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Histórico Mensal ({recentRecords.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentRecords.map(record => (
            <div key={record.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-md flex items-center justify-between group relative overflow-hidden">
              <div className="flex items-center gap-4 flex-1">
                {/* Bandeira de Retorno */}
                <button 
                  onClick={() => handleToggleFollowUp(record)}
                  className={`p-2 rounded-xl transition-all hover:scale-110 ${record.needsFollowUp ? 'bg-danger/10 text-danger animate-pulse' : 'bg-success/10 text-success'}`}
                  title={record.needsFollowUp ? "Pendente de Retorno (Clique para finalizar)" : "Retorno Realizado (Clique para reabrir)"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5.221 21.0001C4.84715 21.0001 4.54419 20.6971 4.54419 20.3233V4.07326C4.54419 3.69941 4.84715 3.39645 5.221 3.39645C5.36709 3.39645 5.51036 3.44391 5.62886 3.5317L18.1544 11.2317C18.4601 11.4198 18.5524 11.8239 18.3644 12.1296C18.3103 12.2176 18.2384 12.2895 18.1504 12.3436L5.62483 20.8682C5.50854 20.9542 5.36653 21.0001 5.221 21.0001Z" />
                  </svg>
                </button>

                <div className="flex-1 min-w-0">
                  <p className="font-black text-slate-800 truncate">{record.staffName}</p>
                  <p className="text-[10px] text-green-600 font-bold uppercase">{record.sector} • {record.reason}</p>
                </div>
              </div>

              <div className="flex gap-2">
                 <button onClick={() => { setFormData({...record}); window.scrollTo({top:0, behavior:'smooth'}); }} className="p-2 bg-slate-50 text-primary rounded-xl hover:bg-primary hover:text-white transition-all">📝</button>
                 <button onClick={async () => { if(confirm("Apagar permanentemente?")) { await storageService.deleteVisit(record.id); loadRecent(); } }} className="p-2 bg-slate-50 text-danger rounded-xl hover:bg-danger hover:text-white transition-all">✕</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StaffVisitForm;
