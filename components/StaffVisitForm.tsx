
import React, { useState, useMemo } from 'react';
import { storageService } from '../services/storageService';
import { User, StaffVisit, HospitalUnit } from '../types';
import { VISIT_REASONS } from '../constants';
import SearchableSelect from './SearchableSelect';
import SyncOverlay from './SyncOverlay';

interface Props { user: User; onSuccess: () => void; }

const StaffVisitForm: React.FC<Props> = ({ user, onSuccess }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [unit, setUnit] = useState<HospitalUnit>('HAB');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    sector: '', staffName: '', reason: VISIT_REASONS[0], needsFollowUp: false, observations: ''
  });

  const config = storageService.getConfig();
  const sectors = unit === 'HAB' ? config.customSectorsHAB : config.customSectorsHABA;
  const allVisits = storageService.getVisits();

  // Lógica do Calendário
  const calendarDays = useMemo(() => {
    const days = [];
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    for (let i = 1; i <= end.getDate(); i++) {
      const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const hasPending = allVisits.some(v => v.date === dateStr && v.needsFollowUp && v.chaplainId === user.id);
      days.push({ day: i, dateStr, hasPending });
    }
    return days;
  }, [allVisits, user.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSyncing(true);
    const date = new Date(formData.date);
    const visit: StaffVisit = {
      ...formData,
      id: Math.random().toString(36).substr(2, 9),
      hospitalUnit: unit,
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      chaplainId: user.id,
      createdAt: new Date().toISOString()
    } as StaffVisit;
    await storageService.saveVisit(visit);
    setIsSyncing(false);
    setFormData({...formData, staffName: '', observations: '', needsFollowUp: false});
    onSuccess();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <SyncOverlay isVisible={isSyncing} />
      <div className="lg:col-span-2 space-y-6">
        <form onSubmit={handleSave} className="bg-white p-8 rounded-premium shadow-xl space-y-6">
          <h2 className="text-2xl font-black italic">🤝 Apoio a Colaborador</h2>
          <div className="flex gap-4">
            {['HAB', 'HABA'].map(u => (
              <button key={u} type="button" onClick={() => setUnit(u as any)} className={`flex-1 py-3 rounded-xl font-black ${unit === u ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>UNIDADE {u}</button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="date" className="p-4 bg-slate-50 rounded-xl font-bold" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
            <SearchableSelect label="Setor" options={sectors} value={formData.sector} onChange={v => setFormData({...formData, sector: v})} />
            <input className="p-4 bg-slate-50 rounded-xl font-bold" placeholder="Nome do Colaborador" value={formData.staffName} onChange={e => setFormData({...formData, staffName: e.target.value})} />
            <select className="p-4 bg-slate-50 rounded-xl font-bold" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})}>
              {VISIT_REASONS.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 p-4 bg-amber-50 rounded-xl">
            <input type="checkbox" className="w-6 h-6" checked={formData.needsFollowUp} onChange={e => setFormData({...formData, needsFollowUp: e.target.checked})} />
            <label className="font-black text-xs uppercase text-amber-700">Requer Retorno / Acompanhamento?</label>
          </div>
          <textarea className="w-full p-4 bg-slate-50 border rounded-xl font-bold" placeholder="Observações do atendimento" value={formData.observations} onChange={e => setFormData({...formData, observations: e.target.value})} />
          <button type="submit" className="w-full py-4 bg-primary text-white rounded-xl font-black shadow-lg">REGISTRAR VISITA</button>
        </form>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-premium shadow-lg border">
          <h3 className="text-sm font-black uppercase text-slate-400 mb-4">Agenda de Retornos</h3>
          <div className="grid grid-cols-7 gap-2">
            {['D','S','T','Q','Q','S','S'].map((d,i) => <div key={i} className="text-center text-[10px] font-black opacity-30">{d}</div>)}
            {calendarDays.map(d => (
              <div 
                key={d.day} 
                onClick={() => setFormData({...formData, date: d.dateStr})}
                className={`h-10 flex items-center justify-center rounded-lg text-xs font-bold cursor-pointer transition-all ${d.hasPending ? 'bg-danger text-white animate-pulse' : 'bg-slate-50 hover:bg-slate-200'}`}
              >
                {d.day}
              </div>
            ))}
          </div>
          <p className="text-[10px] mt-4 italic text-slate-400">* Dias em vermelho indicam retornos pendentes.</p>
        </div>
      </div>
    </div>
  );
};

export default StaffVisitForm;
