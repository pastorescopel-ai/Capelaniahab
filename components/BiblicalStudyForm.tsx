
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
  
  const myRecent = useMemo(() => {
    return allRecords
      .filter(r => r.chaplainId === user.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [allRecords, user.id]);
  
  const existingNames = useMemo(() => {
    const names = new Set<string>();
    allRecords.forEach(r => names.add(r.patientName));
    storageService.getClasses().forEach(c => c.students.forEach(s => names.add(s)));
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
    if(!confirm("Deseja realmente excluir este registro?")) return;
    setIsSyncing(true);
    await storageService.deleteStudy(id);
    setIsSyncing(false);
    onSuccess();
  };

  return (
    <div className="space-y-6">
      <SyncOverlay isVisible={isSyncing} />
      <form onSubmit={handleSave} className="bg-white p-8 rounded-premium shadow-xl space-y-6">
        <h2 className="text-2xl font-black italic">📖 Novo Estudo Bíblico</h2>
        <div className="flex gap-4">
          {['HAB', 'HABA'].map(u => (
            <button key={u} type="button" onClick={() => setUnit(u as any)} className={`flex-1 py-3 rounded-xl font-black transition-all ${unit === u ? 'bg-primary text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>UNIDADE {u}</button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase opacity-40 ml-1">Data do Estudo</label>
            <input type="date" className="w-full p-4 bg-slate-50 border rounded-xl font-bold" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
          </div>
          <SearchableSelect label="Setor" options={sectors} value={formData.sector} onChange={v => setFormData({...formData, sector: v})} />
          
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase opacity-40 ml-1">Nome do Aluno (Busca Automática)</label>
            <input list="names" className="w-full p-4 bg-slate-50 border rounded-xl font-bold" value={formData.patientName} onChange={e => setFormData({...formData, patientName: e.target.value})} placeholder="Digite para buscar ou adicionar..." />
            <datalist id="names">{existingNames.map(n => <option key={n} value={n} />)}</datalist>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase opacity-40 ml-1">WhatsApp</label>
            <input className="w-full p-4 bg-slate-50 border rounded-xl font-bold" placeholder="(00) 00000-0000" value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase opacity-40 ml-1">Status</label>
            <select className="w-full p-4 bg-slate-50 border rounded-xl font-bold" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
              {STUDY_STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase opacity-40 ml-1">Série / Guia</label>
            <select className="w-full p-4 bg-slate-50 border rounded-xl font-bold" value={formData.studySeries} onChange={e => setFormData({...formData, studySeries: e.target.value})}>
              {STUDY_GUIDES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase opacity-40 ml-1">Lição Atual e Observações</label>
          <textarea className="w-full p-4 bg-slate-50 border rounded-xl font-bold" placeholder="Detalhes do progresso..." value={formData.observations} onChange={e => setFormData({...formData, observations: e.target.value})} />
        </div>
        <button type="submit" className="w-full py-5 bg-primary text-white rounded-premium font-black shadow-xl hover:bg-slate-800 transition-all">SALVAR REGISTRO</button>
      </form>

      <div className="bg-white p-6 rounded-premium shadow-lg border border-slate-100">
        <h3 className="text-[11px] font-black uppercase text-slate-400 mb-4 tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 bg-primary rounded-full"></span> Meus Lançamentos Recentes
        </h3>
        <div className="space-y-3">
          {myRecent.length > 0 ? myRecent.map(r => (
            <div key={r.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-primary/30 transition-all">
              <div>
                <p className="font-black text-slate-800">{r.patientName}</p>
                <p className="text-[10px] font-bold text-primary uppercase">{r.sector} • {r.date.split('-').reverse().join('/')}</p>
              </div>
              <button onClick={() => handleDelete(r.id)} className="p-2 text-danger hover:bg-danger/10 rounded-xl transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )) : (
            <p className="text-center py-4 text-xs font-bold text-slate-400 italic">Nenhum registro recente encontrado.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BiblicalStudyForm;
