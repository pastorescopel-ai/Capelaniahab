
import React, { useState, useEffect } from 'react';
import { VISIT_REASONS } from '../constants';
import { storageService } from '../services/storageService';
import { StaffVisit, User, HospitalUnit } from '../types';
import SearchableSelect from './SearchableSelect';
import SyncOverlay from './SyncOverlay';

interface StaffVisitFormProps {
  user: User;
  onSuccess: () => void;
}

const StaffVisitForm: React.FC<StaffVisitFormProps> = ({ user, onSuccess }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [hospitalUnit, setHospitalUnit] = useState<HospitalUnit>('HAB');
  
  const config = storageService.getConfig();
  const currentSectors = hospitalUnit === 'HAB' ? config.customSectorsHAB : config.customSectorsHABA;

  const [formData, setFormData] = useState({
    id: '',
    date: new Date().toISOString().split('T')[0],
    sector: '',
    staffName: '',
    reason: VISIT_REASONS[0],
    needsFollowUp: false,
    observations: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sector || !formData.staffName) {
      alert("Preencha o setor e o nome do colaborador.");
      return;
    }

    setIsSyncing(true);
    const dateObj = new Date(formData.date);
    const visit: StaffVisit = {
      ...formData,
      id: formData.id || Math.random().toString(36).substr(2, 9),
      hospitalUnit,
      year: dateObj.getFullYear(),
      month: dateObj.getMonth() + 1,
      chaplainId: user.id,
      createdAt: new Date().toISOString()
    } as StaffVisit;
    
    try {
      await storageService.saveVisit(visit);
      setFormData({ id: '', date: new Date().toISOString().split('T')[0], sector: '', staffName: '', reason: VISIT_REASONS[0], needsFollowUp: false, observations: '' });
      onSuccess();
      alert("Atendimento ao colaborador registrado!");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-8">
      <SyncOverlay isVisible={isSyncing} />
      <div className="bg-white p-6 md:p-8 rounded-premium border border-slate-100 shadow-xl">
        <h2 className="text-2xl font-black text-slate-800 mb-8 border-b pb-4 italic">🤝 Apoio a Colaborador</h2>

        <div className="flex gap-4 mb-8">
          {(['HAB', 'HABA'] as HospitalUnit[]).map(unit => (
            <button key={unit} type="button" onClick={() => { setHospitalUnit(unit); setFormData({...formData, sector: ''}); }} className={`flex-1 py-4 rounded-2xl font-black text-sm transition-all ${hospitalUnit === unit ? 'bg-primary text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
              UNIDADE {unit}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-[11px] font-black text-slate-700 uppercase tracking-widest ml-1">Data</label>
            <input type="date" required className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-800" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
          </div>

          <SearchableSelect 
            label={`Setor ${hospitalUnit}`} 
            options={currentSectors} 
            value={formData.sector} 
            onChange={val => setFormData({...formData, sector: val})} 
            placeholder="Escolha o setor..."
            required
          />

          <div className="space-y-1">
            <label className="text-[11px] font-black text-slate-700 uppercase tracking-widest ml-1">Nome do Colaborador</label>
            <input type="text" required placeholder="Digite o nome..." className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-800" value={formData.staffName} onChange={(e) => setFormData({...formData, staffName: e.target.value})} />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-black text-slate-700 uppercase tracking-widest ml-1">Motivo do Atendimento</label>
            <select className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-800" value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})}>
              {VISIT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border-2 border-slate-100">
            <input 
              type="checkbox" 
              id="followUp"
              className="w-6 h-6 rounded-lg accent-primary" 
              checked={formData.needsFollowUp} 
              onChange={e => setFormData({...formData, needsFollowUp: e.target.checked})} 
            />
            <label htmlFor="followUp" className="text-sm font-black text-slate-700 uppercase cursor-pointer">Requer Retorno Pastoral?</label>
          </div>

          <div className="md:col-span-2 space-y-1">
            <label className="text-[11px] font-black text-slate-700 uppercase tracking-widest ml-1">Observações Confidenciais</label>
            <textarea rows={3} className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-800" value={formData.observations} onChange={(e) => setFormData({...formData, observations: e.target.value})} placeholder="Relato do atendimento..." />
          </div>

          <button type="submit" disabled={isSyncing} className="md:col-span-2 py-5 bg-primary text-white rounded-premium font-black shadow-xl hover:bg-slate-800 transition-all">
            {isSyncing ? 'Sincronizando...' : 'Finalizar Atendimento'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StaffVisitForm;
