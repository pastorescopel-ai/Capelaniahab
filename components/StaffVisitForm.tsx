
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

  const myRecent = useMemo(() => {
    return allVisits
      .filter(r => r.chaplainId === user.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [allVisits, user.id]);

  // Lógica do Calendário Ministerial
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

  const handleDelete = async (id: string) => {
    if(!confirm("Excluir atendimento?")) return;
    setIsSyncing(true);
    await storageService.deleteVisit(id);
    setIsSyncing(false);
    onSuccess();
  };

  return (
    <div className="space-y-8 pb-20">
      <SyncOverlay isVisible={isSyncing} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="bg-white p-8 rounded-premium shadow-xl space-y-6">
            <h2 className="text-2xl font-black italic">🤝 Apoio a Colaborador</h2>
            <div className="flex gap-4">
              {['HAB', 'HABA'].map(u => (
                <button key={u} type="button" onClick={() => setUnit(u as any)} className={`flex-1 py-3 rounded-xl font-black transition-all ${unit === u ? 'bg-primary text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>UNIDADE {u}</button>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="date" className="p-4 bg-slate-50 border rounded-xl font-bold" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              <SearchableSelect label="Setor" options={sectors} value={formData.sector} onChange={v => setFormData({...formData, sector: v})} />
              <input className="p-4 bg-slate-50 border rounded-xl font-bold" placeholder="Nome do Colaborador" value={formData.staffName} onChange={e => setFormData({...formData, staffName: e.target.value})} />
              <select className="p-4 bg-slate-50 border rounded-xl font-bold" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})}>
                {VISIT_REASONS.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3 p-5 bg-amber-50 rounded-2xl border-2 border-amber-100">
              <input type="checkbox" className="w-6 h-6 rounded accent-amber-600" id="followUp" checked={formData.needsFollowUp} onChange={e => setFormData({...formData, needsFollowUp: e.target.checked})} />
              <label htmlFor="followUp" className="font-black text-xs uppercase text-amber-700 cursor-pointer">Requer Retorno / Acompanhamento Pastoral?</label>
            </div>
            <textarea className="w-full p-4 bg-slate-50 border rounded-xl font-bold" placeholder="Relato do atendimento" value={formData.observations} onChange={e => setFormData({...formData, observations: e.target.value})} />
            <button type="submit" className="w-full py-5 bg-primary text-white rounded-premium font-black shadow-xl hover:bg-slate-800 transition-all">REGISTRAR ATENDIMENTO</button>
          </form>

          {/* Histórico Local de Visitas */}
          <div className="bg-white p-6 rounded-premium shadow-lg border border-slate-100">
            <h3 className="text-[11px] font-black uppercase text-slate-400 mb-4 tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-success rounded-full"></span> Meus Atendimentos Recentes
            </h3>
            <div className="space-y-3">
              {myRecent.length > 0 ? myRecent.map(r => (
                <div key={r.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-primary/30 transition-all">
                  <div>
                    <p className="font-black text-slate-800">{r.staffName} {r.needsFollowUp && <span className="ml-2 text-[8px] bg-danger text-white px-2 py-0.5 rounded-full uppercase">Pendente</span>}</p>
                    <p className="text-[10px] font-bold text-primary uppercase">{r.sector} • {r.reason} • {r.date.split('-').reverse().join('/')}</p>
                  </div>
                  <button onClick={() => handleDelete(r.id)} className="p-2 text-danger hover:bg-danger/10 rounded-xl transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )) : (
                <p className="text-center py-4 text-xs font-bold text-slate-400 italic">Nenhum atendimento registrado hoje.</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-premium shadow-lg border border-slate-100">
            <h3 className="text-sm font-black uppercase text-slate-400 mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Agenda de Retornos
            </h3>
            <div className="grid grid-cols-7 gap-2">
              {['D','S','T','Q','Q','S','S'].map((d,i) => <div key={i} className="text-center text-[10px] font-black opacity-30">{d}</div>)}
              {calendarDays.map(d => (
                <div 
                  key={d.day} 
                  onClick={() => setFormData({...formData, date: d.dateStr})}
                  className={`h-10 flex items-center justify-center rounded-xl text-xs font-black cursor-pointer transition-all ${
                    d.hasPending 
                    ? 'bg-danger text-white shadow-lg shadow-danger/30 animate-pulse scale-110 border-2 border-white' 
                    : 'bg-slate-50 text-slate-600 hover:bg-primary hover:text-white'
                  }`}
                >
                  {d.day}
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-danger rounded-full animate-pulse"></span>
                <span className="text-[10px] font-black text-slate-500 uppercase">Retorno Pastoral Pendente</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-slate-100 border rounded-full"></span>
                <span className="text-[10px] font-black text-slate-500 uppercase">Dia Comum</span>
              </div>
              <p className="text-[10px] mt-4 italic text-slate-400 leading-tight">* Clique em um dia para selecionar a data do atendimento.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffVisitForm;
