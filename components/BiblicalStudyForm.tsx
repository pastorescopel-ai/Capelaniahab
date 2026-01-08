import React, { useState, useEffect } from 'react';
import { SECTORS, STUDY_STATUSES, STUDY_GUIDES } from '../constants';
import { storageService } from '../services/storageService';
import { BiblicalStudy, User } from '../types';

interface BiblicalStudyFormProps {
  user: User;
  onSuccess: () => void;
}

const BiblicalStudyForm: React.FC<BiblicalStudyFormProps> = ({ user, onSuccess }) => {
  const [recentRecords, setRecentRecords] = useState<BiblicalStudy[]>([]);
  
  const [formData, setFormData] = useState({
    id: '',
    date: new Date().toISOString().split('T')[0],
    sector: SECTORS[0],
    patientName: '',
    whatsapp: '',
    status: STUDY_STATUSES[0] as any,
    studySeries: '',
    currentLesson: '',
    observations: ''
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação de campos obrigatórios
    if (!formData.patientName || !formData.whatsapp || !formData.studySeries || !formData.currentLesson || !formData.sector || !formData.status) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    if (formData.whatsapp.replace(/\D/g, '').length < 10) {
      alert("O número de WhatsApp deve conter pelo menos o DDD e o número.");
      return;
    }

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
      alert("Estudo bíblico registrado com sucesso!");
      setFormData({ id: '', date: new Date().toISOString().split('T')[0], sector: SECTORS[0], patientName: '', whatsapp: '', status: STUDY_STATUSES[0] as any, studySeries: '', currentLesson: '', observations: '' });
      loadRecent();
      onSuccess();
    }).catch(() => {
      alert("Erro ao salvar os dados. Verifique sua conexão.");
    });
  };

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
      observations: record.observations || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-12">
      <div className="bg-white p-8 rounded-premium border border-slate-100 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <span>📖</span> {formData.id ? 'Editando Estudo Bíblico' : 'Novo Lançamento de Estudo Bíblico'}
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data *</label>
            <input type="date" required className="w-full px-4 py-3 bg-slate-50 border rounded-2xl outline-none font-bold" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Setor *</label>
            <select required className="w-full px-4 py-3 bg-slate-50 border rounded-2xl outline-none font-bold" value={formData.sector} onChange={(e) => setFormData({...formData, sector: e.target.value})}>
              {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Aluno/Paciente *</label>
            <input type="text" required placeholder="Digite o nome completo" className="w-full px-4 py-3 bg-slate-50 border rounded-2xl outline-none font-bold" value={formData.patientName} onChange={(e) => setFormData({...formData, patientName: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp *</label>
            <input type="tel" required placeholder="(00) 00000-0000" className="w-full px-4 py-3 bg-slate-50 border rounded-2xl outline-none font-bold" value={formData.whatsapp} onChange={(e) => setFormData({...formData, whatsapp: formatWhatsApp(e.target.value)})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Guia de Estudo *</label>
            <input list="guides-list" required placeholder="Ouvindo a voz de Deus, etc" className="w-full px-4 py-3 bg-slate-50 border rounded-2xl outline-none font-bold" value={formData.studySeries} onChange={(e) => setFormData({...formData, studySeries: e.target.value})} />
            <datalist id="guides-list">
              {STUDY_GUIDES.map(g => <option key={g} value={g} />)}
            </datalist>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Qual lição está realizando? *</label>
            <input type="text" required placeholder="Ex: Lição 1 - A Bíblia" className="w-full px-4 py-3 bg-slate-50 border rounded-2xl outline-none font-bold" value={formData.currentLesson} onChange={(e) => setFormData({...formData, currentLesson: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status da Série *</label>
            <select required className="w-full px-4 py-3 bg-slate-50 border rounded-2xl outline-none font-bold" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value as any})}>
              {STUDY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="md:col-span-2 space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Observações (Opcional)</label>
            <textarea rows={2} className="w-full px-4 py-3 bg-slate-50 border rounded-2xl outline-none" placeholder="Relato do atendimento..." value={formData.observations} onChange={(e) => setFormData({...formData, observations: e.target.value})} />
          </div>
          <div className="md:col-span-2 flex gap-4">
             <button type="submit" className="flex-1 py-4 bg-primary text-white rounded-premium font-black shadow-lg hover:scale-[1.02] transition-all">
                {formData.id ? 'Salvar Alterações' : 'Salvar Estudo'}
             </button>
             {formData.id && <button type="button" onClick={() => setFormData({ id: '', date: new Date().toISOString().split('T')[0], sector: SECTORS[0], patientName: '', whatsapp: '', status: STUDY_STATUSES[0] as any, studySeries: '', currentLesson: '', observations: '' })} className="px-8 py-4 bg-slate-100 text-slate-500 rounded-premium font-bold">Cancelar</button>}
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest ml-2">Registros Recentes do Mês ({recentRecords.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentRecords.map(record => (
            <div key={record.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group">
              <div className="flex-1">
                <p className="font-black text-slate-800 truncate">{record.patientName}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase">{record.studySeries} • {record.currentLesson}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(record)} className="p-2 bg-slate-50 text-primary rounded-xl hover:bg-primary hover:text-white transition-all">📝</button>
                <button onClick={async () => { if(confirm("Deseja apagar este registro permanentemente?")) { await storageService.deleteStudy(record.id); loadRecent(); } }} className="p-2 bg-slate-50 text-danger rounded-xl hover:bg-danger hover:text-white transition-all">✕</button>
              </div>
            </div>
          ))}
          {recentRecords.length === 0 && <p className="text-slate-400 italic text-sm ml-2">Nenhum estudo bíblico realizado este mês.</p>}
        </div>
      </div>
    </div>
  );
};

export default BiblicalStudyForm;