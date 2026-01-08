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
  const [formData, setFormData] = useState({
    id: '',
    date: new Date().toISOString().split('T')[0],
    sector: SECTORS[0],
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
    
    // Validação
    if (!formData.staffName || !formData.reason || !formData.date) {
      alert("Por favor, preencha os campos obrigatórios (Data, Setor, Nome e Motivo).");
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
      alert("Visita registrada com sucesso!");
      setFormData({ id: '', date: new Date().toISOString().split('T')[0], sector: SECTORS[0], staffName: '', reason: VISIT_REASONS[0], needsFollowUp: false, observations: '' });
      loadRecent();
      onSuccess();
    });
  };

  const handleEdit = (record: StaffVisit) => {
    setFormData({ ...record });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-12">
      <div className="bg-white p-8 rounded-premium border border-slate-100 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2"><span>🤝</span> Visita e Apoio a Colaborador</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data *</label>
            <input type="date" required className="w-full px-4 py-3 bg-slate-50 border rounded-2xl outline-none font-bold focus:ring-2 focus:ring-primary/20" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Setor *</label>
            <select required className="w-full px-4 py-3 bg-slate-50 border rounded-2xl outline-none font-bold focus:ring-2 focus:ring-primary/20" value={formData.sector} onChange={(e) => setFormData({...formData, sector: e.target.value})}>
              {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Colaborador *</label>
            <input type="text" required placeholder="Digite o nome do funcionário" className="w-full px-4 py-3 bg-slate-50 border rounded-2xl outline-none font-bold focus:ring-2 focus:ring-primary/20" value={formData.staffName} onChange={(e) => setFormData({...formData, staffName: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Motivo do Atendimento *</label>
            <select required className="w-full px-4 py-3 bg-slate-50 border rounded-2xl outline-none font-bold focus:ring-2 focus:ring-primary/20" value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})}>
              {VISIT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group cursor-pointer hover:bg-amber-50 transition-colors">
             <input type="checkbox" id="needs-followup-check" className="w-6 h-6 accent-primary rounded-lg cursor-pointer" checked={formData.needsFollowUp} onChange={e => setFormData({...formData, needsFollowUp: e.target.checked})} />
             <label htmlFor="needs-followup-check" className="text-sm font-black text-slate-700 cursor-pointer select-none">
                MARCAR COMO: NECESSITA RETORNO PASTORAL?
                <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Isso gerará um alerta no seu dashboard.</p>
             </label>
          </div>
          <div className="md:col-span-2 space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Observações / Relato (Opcional)</label>
            <textarea rows={3} className="w-full px-4 py-3 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-primary/20" placeholder="Resumo do que foi conversado ou orações realizadas..." value={formData.observations} onChange={(e) => setFormData({...formData, observations: e.target.value})} />
          </div>
          <button type="submit" className="md:col-span-2 py-5 bg-primary text-white rounded-premium font-black shadow-xl hover:scale-[1.01] active:scale-95 transition-all">
            {formData.id ? 'Salvar Alterações do Atendimento' : 'Finalizar Lançamento de Atendimento'}
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest ml-2">Atendimentos do Mês ({recentRecords.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentRecords.map(record => (
            <div key={record.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group">
              <div className="flex-1">
                <p className="font-black text-slate-800 truncate">{record.staffName}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase">{record.sector} • {record.reason}</p>
                {record.needsFollowUp && <span className="text-[8px] px-2 py-0.5 bg-amber-100 text-amber-600 rounded font-black uppercase inline-block mt-1 shadow-sm border border-amber-200">Aguardando Retorno</span>}
              </div>
              <div className="flex gap-2">
                 <button onClick={() => handleEdit(record)} className="p-2 bg-slate-50 text-primary rounded-xl hover:bg-primary hover:text-white transition-all">📝</button>
                 <button onClick={async () => { if(confirm("Apagar este registro permanentemente?")) { await storageService.deleteVisit(record.id); loadRecent(); } }} className="p-2 bg-slate-50 text-danger rounded-xl hover:bg-danger hover:text-white transition-all">✕</button>
              </div>
            </div>
          ))}
          {recentRecords.length === 0 && <p className="text-slate-400 italic text-sm ml-2">Nenhum atendimento registrado este mês.</p>}
        </div>
      </div>
    </div>
  );
};

export default StaffVisitForm;