
import React, { useState, useMemo } from 'react';
import { storageService } from '../services/storageService';
import { BiblicalStudy, User, HospitalUnit } from '../types';
import { STUDY_GUIDES, STUDY_STATUSES } from '../constants';
import SearchableSelect from './SearchableSelect';
import SyncOverlay from './SyncOverlay';

interface Props { user: User; onSuccess: () => void; }

const BiblicalStudyForm: React.FC<Props> = ({ user, onSuccess }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [unit, setUnit] = useState<HospitalUnit>('HAB');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    sector: '', patientName: '', whatsapp: '', status: STUDY_STATUSES[0],
    studySeries: STUDY_GUIDES[0], currentLesson: '', observations: ''
  });

  const config = storageService.getConfig();
  const sectors = unit === 'HAB' ? config.customSectorsHAB : config.customSectorsHABA;
  const allRecords = storageService.getStudies();
  const myRecent = useMemo(() => allRecords.filter(r => r.chaplainId === user.id).slice(-5).reverse(), [allRecords]);
  
  const existingNames = useMemo(() => {
    const names = new Set<string>();
    allRecords.forEach(r => names.add(r.patientName));
    return Array.from(names);
  }, [allRecords]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sector || !formData.patientName) return alert("Preencha setor e nome.");
    setIsSyncing(true);
    const date = new Date(formData.date);
    const study: BiblicalStudy = {
      ...formData,
      id: Math.random().toString(36).substr(2, 9),
      hospitalUnit: unit,
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      chaplainId: user.id,
      createdAt: new Date().toISOString()
    } as BiblicalStudy;
    await storageService.saveStudy(study);
    setIsSyncing(false);
    setFormData({...formData, patientName: '', whatsapp: '', currentLesson: '', observations: ''});
    onSuccess();
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Excluir definitivamente?")) return;
    setIsSyncing(true);
    await storageService.deleteStudy(id);
    setIsSyncing(false);
  };

  return (
    <div className="space-y-6">
      <SyncOverlay isVisible={isSyncing} />
      <form onSubmit={handleSave} className="bg-white p-8 rounded-premium shadow-xl space-y-6">
        <h2 className="text-2xl font-black italic">📖 Novo Estudo Bíblico</h2>
        <div className="flex gap-4">
          {['HAB', 'HABA'].map(u => (
            <button key={u} type="button" onClick={() => setUnit(u as any)} className={`flex-1 py-3 rounded-xl font-black ${unit === u ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>UNIDADE {u}</button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="date" className="p-4 bg-slate-50 rounded-xl font-bold" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
          <SearchableSelect label="Setor" options={sectors} value={formData.sector} onChange={v => setFormData({...formData, sector: v})} />
          
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase opacity-40">Nome do Aluno (Existente ou Novo)</label>
            <input list="names" className="w-full p-4 bg-slate-50 border rounded-xl font-bold" value={formData.patientName} onChange={e => setFormData({...formData, patientName: e.target.value})} placeholder="Digite ou selecione..." />
            <datalist id="names">{existingNames.map(n => <option key={n} value={n} />)}</datalist>
          </div>

          <input className="p-4 bg-slate-50 rounded-xl font-bold" placeholder="WhatsApp" value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} />
          <select className="p-4 bg-slate-50 rounded-xl font-bold" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
            {STUDY_STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <select className="p-4 bg-slate-50 rounded-xl font-bold" value={formData.studySeries} onChange={e => setFormData({...formData, studySeries: e.target.value})}>
            {STUDY_GUIDES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <textarea className="w-full p-4 bg-slate-50 border rounded-xl font-bold" placeholder="Observações" value={formData.observations} onChange={e => setFormData({...formData, observations: e.target.value})} />
        <button type="submit" className="w-full py-4 bg-primary text-white rounded-xl font-black shadow-lg">SALVAR ESTUDO</button>
      </form>

      <div className="bg-white p-6 rounded-premium shadow-lg">
        <h3 className="text-xs font-black uppercase opacity-40 mb-4">Meus Lançamentos Recentes</h3>
        <div className="space-y-2">
          {myRecent.map(r => (
            <div key={r.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border">
              <div>
                <p className="font-bold text-sm">{r.patientName}</p>
                <p className="text-[10px] opacity-40">{r.sector} - {r.date}</p>
              </div>
              <button onClick={() => handleDelete(r.id)} className="text-danger p-2 hover:bg-danger/10 rounded-lg">✕</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BiblicalStudyForm;
