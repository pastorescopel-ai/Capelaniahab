
import React, { useState, useEffect } from 'react';
import { STUDY_STATUSES, STUDY_GUIDES } from '../constants';
import { storageService } from '../services/storageService';
import { BiblicalStudy, User, HospitalUnit } from '../types';
import SearchableSelect from './SearchableSelect';
import SyncOverlay from './SyncOverlay';

interface BiblicalStudyFormProps {
  user: User;
  onSuccess: () => void;
}

const BiblicalStudyForm: React.FC<BiblicalStudyFormProps> = ({ user, onSuccess }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [hospitalUnit, setHospitalUnit] = useState<HospitalUnit>('HAB');
  
  const config = storageService.getConfig();
  const currentSectors = hospitalUnit === 'HAB' ? config.customSectorsHAB : config.customSectorsHABA;

  const [formData, setFormData] = useState({
    id: '',
    date: new Date().toISOString().split('T')[0],
    sector: '',
    patientName: '',
    whatsapp: '',
    status: STUDY_STATUSES[0] as any,
    studySeries: STUDY_GUIDES[0],
    currentLesson: '',
    observations: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sector || !formData.patientName) {
      alert("Selecione a unidade, o setor e o nome.");
      return;
    }

    setIsSyncing(true);
    const dateObj = new Date(formData.date);
    const study: BiblicalStudy = {
      ...formData,
      id: formData.id || Math.random().toString(36).substr(2, 9),
      hospitalUnit,
      year: dateObj.getFullYear(),
      month: dateObj.getMonth() + 1,
      chaplainId: user.id,
      createdAt: new Date().toISOString()
    } as BiblicalStudy;
    
    try {
      await storageService.saveStudy(study);
      setFormData({ id: '', date: new Date().toISOString().split('T')[0], sector: '', patientName: '', whatsapp: '', status: STUDY_STATUSES[0] as any, studySeries: STUDY_GUIDES[0], currentLesson: '', observations: '' });
      onSuccess();
      alert("Estudo bíblico registrado com sucesso!");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-8">
      <SyncOverlay isVisible={isSyncing} />
      <div className="bg-white p-6 md:p-8 rounded-premium border border-slate-100 shadow-xl">
        <h2 className="text-2xl font-black text-slate-800 mb-8 border-b pb-4 italic">📖 Novo Estudo Bíblico</h2>
        
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
            <input type="date" required className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
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
            <label className="text-[11px] font-black text-slate-700 uppercase tracking-widest ml-1">Nome do Aluno</label>
            <input type="text" required placeholder="Nome completo..." className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-800" value={formData.patientName} onChange={(e) => setFormData({...formData, patientName: e.target.value})} />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-black text-slate-700 uppercase tracking-widest ml-1">WhatsApp</label>
            <input type="tel" placeholder="(00) 00000-0000" className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-800" value={formData.whatsapp} onChange={(e) => setFormData({...formData, whatsapp: e.target.value})} />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-black text-slate-700 uppercase tracking-widest ml-1">Status do Estudo</label>
            <select className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-800" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value as any})}>
              {STUDY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-black text-slate-700 uppercase tracking-widest ml-1">Série / Guia</label>
            <select className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-800" value={formData.studySeries} onChange={(e) => setFormData({...formData, studySeries: e.target.value})}>
              {STUDY_GUIDES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-black text-slate-700 uppercase tracking-widest ml-1">Lição Atual</label>
            <input type="text" placeholder="Ex: Lição 05" className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-800" value={formData.currentLesson} onChange={(e) => setFormData({...formData, currentLesson: e.target.value})} />
          </div>

          <div className="md:col-span-2 space-y-1">
            <label className="text-[11px] font-black text-slate-700 uppercase tracking-widest ml-1">Observações / Motivos de Oração</label>
            <textarea rows={3} className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-800" value={formData.observations} onChange={(e) => setFormData({...formData, observations: e.target.value})} placeholder="Detalhes do atendimento..." />
          </div>

          <button type="submit" disabled={isSyncing} className="md:col-span-2 py-5 bg-primary text-white rounded-premium font-black shadow-xl hover:bg-slate-800 transition-all">
            {isSyncing ? 'Sincronizando...' : 'Registrar Estudo Bíblico'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BiblicalStudyForm;
