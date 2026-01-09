
import React, { useState, useEffect, useMemo } from 'react';
import { STUDY_STATUSES, STUDY_GUIDES } from '../constants';
import { storageService } from '../services/storageService';
import { BiblicalStudy, User } from '../types';
import SearchableSelect from './SearchableSelect';
import SyncOverlay from './SyncOverlay';

interface BiblicalStudyFormProps {
  user: User;
  onSuccess: () => void;
}

const BiblicalStudyForm: React.FC<BiblicalStudyFormProps> = ({ user, onSuccess }) => {
  const [recentRecords, setRecentRecords] = useState<BiblicalStudy[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const config = storageService.getConfig();
  const sectors = config.customSectors || [];
  
  const [formData, setFormData] = useState({
    id: '',
    date: new Date().toISOString().split('T')[0],
    sector: '',
    patientName: '',
    whatsapp: '',
    status: STUDY_STATUSES[0] as any,
    studySeries: '',
    currentLesson: '',
    observations: ''
  });

  const allStudies = useMemo(() => storageService.getStudies(), [recentRecords]);
  
  const activeStudents = useMemo(() => {
    const map = new Map<string, BiblicalStudy>();
    allStudies.forEach(s => {
      const key = s.patientName.trim().toLowerCase();
      if (!map.has(key) || new Date(s.date).getTime() > new Date(map.get(key)!.date).getTime()) {
        map.set(key, s);
      }
    });
    return Array.from(map.values()).sort((a,b) => a.patientName.localeCompare(b.patientName));
  }, [allStudies]);

  const handleSelectStudent = (studentName: string) => {
    const lastRecord = activeStudents.find(s => s.patientName === studentName);
    if (lastRecord) {
      setFormData({
        ...formData,
        patientName: lastRecord.patientName,
        whatsapp: lastRecord.whatsapp,
        sector: lastRecord.sector,
        studySeries: lastRecord.studySeries,
        status: 'Continuidade da série' as any,
        id: ''
      });
    }
  };

  const formatWhatsApp = (value: string) => {
    const digits = value.replace(/\D/g, '').substring(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `(${digits.substring(0, 2)}) ${digits.substring(2)}`;
    if (digits.length <= 10) return `(${digits.substring(0, 2)}) ${digits.substring(2, 6)}-${digits.substring(6)}`;
    return `(${digits.substring(0, 2)}) ${digits.substring(2, 7)}-${digits.substring(7)}`;
  };

  const loadRecent = () => {
    const now = new Date();
    const all = storageService.getStudies();
    const filtered = all.filter(s => s.month === (now.getMonth() + 1) && s.year === now.getFullYear() && s.chaplainId === user.id);
    setRecentRecords(filtered.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  };

  useEffect(() => { loadRecent(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sector || !formData.patientName || !formData.whatsapp || !formData.studySeries || !formData.currentLesson) {
      alert("Por favor, preencha todos os campos obrigatórios, incluindo o setor.");
      return;
    }

    setIsSyncing(true);

    const dateObj = new Date(formData.date);
    const study: BiblicalStudy = {
      ...formData,
      id: formData.id || Math.random().toString(36).substr(2, 9),
      year: dateObj.getFullYear(),
      month: dateObj.getMonth() + 1,
      chaplainId: user.id,
      createdAt: formData.id ? recentRecords.find(r => r.id === formData.id)?.createdAt || new Date().toISOString() : new Date().toISOString()
    } as BiblicalStudy;
    
    try {
      await storageService.saveStudy(study);
      setFormData({ id: '', date: new Date().toISOString().split('T')[0], sector: '', patientName: '', whatsapp: '', status: STUDY_STATUSES[0] as any, studySeries: '', currentLesson: '', observations: '' });
      loadRecent();
      onSuccess();
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-12">
      <SyncOverlay isVisible={isSyncing} />
      <div className="bg-white p-8 rounded-premium border border-slate-100 shadow-xl">
        <div className="flex justify-between items-center mb-8 border-b pb-4">
           <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2 italic">📖 Estudo Bíblico</h2>
           <div className="flex items-center gap-2">
              <label className="text-[10px] font-black uppercase text-slate-400">Lançamento Diário:</label>
              <select onChange={(e) => handleSelectStudent(e.target.value)} className="bg-slate-50 px-4 py-2 rounded-xl text-xs font-bold text-primary border-none outline-none max-w-[150px] md:max-w-none">
                 <option value="">Buscar Aluno...</option>
                 {activeStudents.map(s => <option key={s.id} value={s.patientName}>{s.patientName}</option>)}
              </select>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-[11px] md:text-[10px] font-black text-slate-500 md:text-slate-400 uppercase tracking-widest ml-1">Data do Atendimento *</label>
            <input type="date" required className="w-full px-4 py-4 md:py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-bold" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
          </div>
          
          <SearchableSelect 
            label="Setor Hospitalar" 
            options={sectors} 
            value={formData.sector} 
            onChange={val => setFormData({...formData, sector: val})} 
            placeholder="Escolha o setor oficial..."
            required
          />

          <div className="space-y-1">
            <label className="text-[11px] md:text-[10px] font-black text-slate-500 md:text-slate-400 uppercase tracking-widest ml-1">Nome do Aluno/Paciente *</label>
            <input type="text" list="all-students-list" required placeholder="Digite o nome completo..." className="w-full px-4 py-4 md:py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-bold" value={formData.patientName} onChange={(e) => setFormData({...formData, patientName: e.target.value})} />
            <datalist id="all-students-list">
               {activeStudents.map(s => <option key={s.id} value={s.patientName} />)}
            </datalist>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] md:text-[10px] font-black text-slate-500 md:text-slate-400 uppercase tracking-widest ml-1">WhatsApp *</label>
            <input type="tel" required placeholder="(00) 00000-0000" className="w-full px-4 py-4 md:py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-bold" value={formData.whatsapp} onChange={(e) => setFormData({...formData, whatsapp: formatWhatsApp(e.target.value)})} />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] md:text-[10px] font-black text-slate-500 md:text-slate-400 uppercase tracking-widest ml-1">Guia de Estudo *</label>
            <input list="guides-list" required placeholder="Guia utilizado..." className="w-full px-4 py-4 md:py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-bold" value={formData.studySeries} onChange={(e) => setFormData({...formData, studySeries: e.target.value})} />
            <datalist id="guides-list">
              {STUDY_GUIDES.map(g => <option key={g} value={g} />)}
            </datalist>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] md:text-[10px] font-black text-slate-500 md:text-slate-400 uppercase tracking-widest ml-1">Lição Atual *</label>
            <input type="text" required placeholder="Título da lição..." className="w-full px-4 py-4 md:py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-bold" value={formData.currentLesson} onChange={(e) => setFormData({...formData, currentLesson: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] md:text-[10px] font-black text-slate-500 md:text-slate-400 uppercase tracking-widest ml-1">Status da Série *</label>
            <select required className="w-full px-4 py-4 md:py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-bold" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value as any})}>
              {STUDY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="md:col-span-2 space-y-1">
            <label className="text-[11px] md:text-[10px] font-black text-slate-500 md:text-slate-400 uppercase tracking-widest ml-1">Observações</label>
            <textarea rows={2} className="w-full px-4 py-4 md:py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-medium" placeholder="Relato do encontro..." value={formData.observations} onChange={(e) => setFormData({...formData, observations: e.target.value})} />
          </div>
          <div className="md:col-span-2 flex gap-4">
             <button type="submit" disabled={isSyncing} className="flex-1 py-5 bg-primary text-white rounded-premium font-black shadow-xl hover:scale-[1.02] active:scale-98 transition-all disabled:opacity-50">
                {formData.id ? 'Salvar Alterações' : 'Registrar na Nuvem'}
             </button>
             {formData.id && <button type="button" onClick={() => setFormData({ id: '', date: new Date().toISOString().split('T')[0], sector: '', patientName: '', whatsapp: '', status: STUDY_STATUSES[0] as any, studySeries: '', currentLesson: '', observations: '' })} className="px-8 py-5 bg-slate-100 text-slate-500 rounded-premium font-bold">Cancelar</button>}
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Atendimentos do Mês ({recentRecords.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentRecords.map(record => (
            <div key={record.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-md flex items-center justify-between group">
              <div className="flex-1 min-w-0">
                <p className="font-black text-slate-800 truncate">{record.patientName}</p>
                <p className="text-[10px] text-primary font-bold uppercase">{record.sector} • {record.studySeries}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setFormData({...record}); window.scrollTo({top:0, behavior:'smooth'}); }} className="p-3 md:p-2 bg-slate-50 text-primary rounded-xl hover:bg-primary hover:text-white transition-all">📝</button>
                <button onClick={async () => { if(confirm("Apagar este registro permanentemente?")) { await storageService.deleteStudy(record.id); loadRecent(); } }} className="p-3 md:p-2 bg-slate-50 text-danger rounded-xl hover:bg-danger hover:text-white transition-all">✕</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BiblicalStudyForm;
