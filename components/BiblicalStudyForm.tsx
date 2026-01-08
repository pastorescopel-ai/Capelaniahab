
import React, { useState, useMemo, useEffect } from 'react';
import { SECTORS, STUDY_STATUSES } from '../constants';
import { storageService } from '../services/storageService';
import { BiblicalStudy, User } from '../types';

interface BiblicalStudyFormProps {
  user: User;
  onSuccess: () => void;
}

const BiblicalStudyForm: React.FC<BiblicalStudyFormProps> = ({ user, onSuccess }) => {
  const config = storageService.getConfig();
  const [recentRecords, setRecentRecords] = useState<BiblicalStudy[]>([]);
  
  const [formData, setFormData] = useState({
    id: '',
    date: new Date().toISOString().split('T')[0],
    sector: SECTORS[0],
    patientName: '',
    whatsapp: '',
    status: STUDY_STATUSES[0],
    studySeries: '',
    currentLesson: '',
    observations: ''
  });

  const loadRecent = () => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const all = storageService.getStudies();
    const filtered = all.filter(s => s.month === currentMonth && s.year === currentYear && s.chaplainId === user.id);
    setRecentRecords(filtered.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  };

  useEffect(() => { loadRecent(); }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dateObj = new Date(formData.date);
    const study: BiblicalStudy = {
      ...formData,
      id: formData.id || Math.random().toString(36).substr(2, 9),
      year: dateObj.getFullYear(),
      month: dateObj.getMonth() + 1,
      chaplainId: user.id,
      createdAt: formData.id ? recentRecords.find(r => r.id === formData.id)?.createdAt || new Date().toISOString() : new Date().toISOString()
    } as BiblicalStudy;
    
    storageService.saveStudy(study).then(() => {
      alert("Registro salvo com sucesso!");
      setFormData({ id: '', date: new Date().toISOString().split('T')[0], sector: SECTORS[0], patientName: '', whatsapp: '', status: STUDY_STATUSES[0], studySeries: '', currentLesson: '', observations: '' });
      loadRecent();
      onSuccess();
    });
  };

  // Fix: Explicitly map record to formData state to resolve type mismatch errors
  const handleEdit = (record: BiblicalStudy) => {
    setFormData({
      id: record.id,
      date: record.date,
      sector: record.sector,
      patientName: record.patientName,
      whatsapp: record.whatsapp,
      status: record.status,
      studySeries: record.studySeries || '',
      currentLesson: record.currentLesson || '',
      observations: record.observations
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Deseja realmente apagar este registro permanentemente do Google Sheets?")) {
      await storageService.deleteStudy(id);
      loadRecent();
    }
  };

  return (
    <div className="space-y-12">
      <div className="bg-white p-8 rounded-premium border border-slate-100 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <span>📖</span> {formData.id ? 'Editando Registro' : 'Lançamento de Estudo Bíblico'}
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <input type="date" required className="px-4 py-3 bg-slate-50 border rounded-2xl outline-none font-bold" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
          <select required className="px-4 py-3 bg-slate-50 border rounded-2xl outline-none font-bold" value={formData.sector} onChange={(e) => setFormData({...formData, sector: e.target.value})}>
            {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input type="text" required placeholder="Nome do Aluno" className="px-4 py-3 bg-slate-50 border rounded-2xl outline-none font-bold" value={formData.patientName} onChange={(e) => setFormData({...formData, patientName: e.target.value})} />
          <input type="tel" required placeholder="WhatsApp" className="px-4 py-3 bg-slate-50 border rounded-2xl outline-none font-bold" value={formData.whatsapp} onChange={(e) => setFormData({...formData, whatsapp: e.target.value})} />
          <select required className="px-4 py-3 bg-slate-50 border rounded-2xl outline-none font-bold" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value as any})}>
            {STUDY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input type="text" placeholder="Lição" className="px-4 py-3 bg-slate-50 border rounded-2xl outline-none font-bold" value={formData.currentLesson} onChange={(e) => setFormData({...formData, currentLesson: e.target.value})} />
          <textarea rows={2} className="md:col-span-2 px-4 py-3 bg-slate-50 border rounded-2xl outline-none" placeholder="Observações..." value={formData.observations} onChange={(e) => setFormData({...formData, observations: e.target.value})} />
          <div className="md:col-span-2 flex gap-4">
             <button type="submit" className="flex-1 py-4 bg-primary text-white rounded-premium font-black shadow-lg hover:scale-105 transition-all">
                {formData.id ? 'Salvar Alterações' : 'Salvar Estudo'}
             </button>
             {formData.id && <button type="button" onClick={() => setFormData({ id: '', date: new Date().toISOString().split('T')[0], sector: SECTORS[0], patientName: '', whatsapp: '', status: STUDY_STATUSES[0], studySeries: '', currentLesson: '', observations: '' })} className="px-8 py-4 bg-slate-100 text-slate-500 rounded-premium font-bold">Cancelar</button>}
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest ml-2">Registros de Hoje / Mês Atual ({recentRecords.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentRecords.map(record => (
            <div key={record.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group">
              <div>
                <p className="font-black text-slate-800">{record.patientName}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase">{record.sector} • {record.status}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(record)} className="p-2 bg-slate-50 text-primary rounded-xl hover:bg-primary hover:text-white transition-all">📝</button>
                <button onClick={() => handleDelete(record.id)} className="p-2 bg-slate-50 text-danger rounded-xl hover:bg-danger hover:text-white transition-all">✕</button>
              </div>
            </div>
          ))}
          {recentRecords.length === 0 && <p className="text-slate-400 italic text-sm ml-2">Nenhum registro encontrado para este mês.</p>}
        </div>
      </div>
    </div>
  );
};

export default BiblicalStudyForm;
