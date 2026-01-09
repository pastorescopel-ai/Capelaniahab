
import React, { useState, useMemo } from 'react';
import { storageService } from '../services/storageService';
import { BiblicalStudy, User, BiblicalClass } from '../types';
import { STUDY_GUIDES, STUDY_STATUSES } from '../constants';
import SearchableSelect from './SearchableSelect';
import SyncOverlay from './SyncOverlay';

interface Props { user: User; onSuccess: () => void; }

const BiblicalStudyForm: React.FC<Props> = ({ user, onSuccess }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    sector: '', patientName: '', whatsapp: '', status: STUDY_STATUSES[0],
    studySeries: STUDY_GUIDES[0], currentLesson: '', observations: ''
  });

  const config = storageService.getConfig();
  const allRecords = storageService.getStudies();
  
  const myRecent = useMemo(() => {
    return (allRecords || [])
      .filter((r: BiblicalStudy) => r.chaplainId === user.id)
      .sort((a: BiblicalStudy, b: BiblicalStudy) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [allRecords, user.id]);
  
  const existingNames = useMemo(() => {
    const names = new Set<string>();
    (allRecords || []).forEach((r: BiblicalStudy) => { if(r.patientName) names.add(r.patientName); });
    (storageService.getClasses() || []).forEach((c: BiblicalClass) => {
      if(c.students) c.students.forEach((s: string) => { if(s) names.add(s); });
    });
    return Array.from(names).sort();
  }, [allRecords]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sector || !formData.patientName) return alert("Preencha setor e nome.");
    setIsSyncing(true);
    const date = new Date(formData.date);
    const study: BiblicalStudy = {
      ...formData,
      id: Math.random().toString(36).substr(2, 9),
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
    if(!confirm("Excluir registro?")) return;
    setIsSyncing(true);
    await storageService.deleteStudy(id);
    setIsSyncing(false);
    onSuccess();
  };

  return (
    <div className="space-y-6">
      <SyncOverlay isVisible={isSyncing} />
      <form onSubmit={handleSave} className="bg-white p-8 rounded-premium shadow-xl space-y-6 text-slate-800">
        <h2 className="text-2xl font-black italic">📖 Novo Estudo Bíblico</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="date" className="w-full p-4 bg-slate-50 border rounded-xl font-bold" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
          <SearchableSelect label="Setor" options={config.customSectors || []} value={formData.sector} onChange={v => setFormData({...formData, sector: v})} />
          <input list="names" className="w-full p-4 bg-slate-50 border rounded-xl font-bold" value={formData.patientName} onChange={e => setFormData({...formData, patientName: e.target.value})} placeholder="Nome do Aluno..." />
          <datalist id="names">{existingNames.map((n: string) => <option key={n} value={n} />)}</datalist>
          <input className="w-full p-4 bg-slate-50 border rounded-xl font-bold" placeholder="WhatsApp" value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} />
          <select className="w-full p-4 bg-slate-50 border rounded-xl font-bold" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
            {STUDY_STATUSES.map((s: string) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <button type="submit" className="w-full py-5 bg-primary text-white rounded-premium font-black shadow-xl">SALVAR ESTUDO</button>
      </form>

      <div className="bg-white p-6 rounded-premium shadow-lg border">
        <h3 className="text-[11px] font-black uppercase text-slate-400 mb-4 tracking-widest">Meus Lançamentos Recentes</h3>
        <div className="space-y-3">
          {myRecent.length > 0 ? myRecent.map((r: BiblicalStudy) => (
            <div key={r.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border">
              <div>
                <p className="font-black text-slate-800">{r.patientName}</p>
                <p className="text-[10px] font-bold text-primary uppercase">{r.sector} • {r.date.split('-').reverse().join('/')}</p>
              </div>
              <button onClick={() => handleDelete(r.id)} className="p-2 text-danger hover:bg-danger/10 rounded-xl">✕</button>
            </div>
          )) : <p className="text-center py-4 text-xs font-bold text-slate-400 italic">Nenhum registro.</p>}
        </div>
      </div>
    </div>
  );
};

export default BiblicalStudyForm;
