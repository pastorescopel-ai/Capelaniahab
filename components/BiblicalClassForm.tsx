import React, { useState, useEffect } from 'react';
import { SECTORS, STUDY_GUIDES } from '../constants';
import { storageService } from '../services/storageService';
import { BiblicalClass, User } from '../types';

interface BiblicalClassFormProps {
  user: User;
  onSuccess: () => void;
}

const BiblicalClassForm: React.FC<BiblicalClassFormProps> = ({ user, onSuccess }) => {
  const [recentRecords, setRecentRecords] = useState<BiblicalClass[]>([]);
  const [formData, setFormData] = useState({
    id: '',
    date: new Date().toISOString().split('T')[0],
    sector: SECTORS[0],
    studySeries: '',
    currentLesson: '',
    observations: ''
  });
  const [students, setStudents] = useState<string[]>([]);
  const [newStudent, setNewStudent] = useState('');

  const loadRecent = () => {
    const now = new Date();
    const all = storageService.getClasses();
    const filtered = all.filter(s => s.month === (now.getMonth() + 1) && s.year === now.getFullYear() && s.chaplainId === user.id);
    setRecentRecords(filtered.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  };

  useEffect(() => { loadRecent(); }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (students.length === 0) {
      alert("Por favor, adicione pelo menos um aluno na lista.");
      return;
    }
    if (!formData.studySeries || !formData.currentLesson) {
      alert("Os campos Guia de Estudo e Lição são obrigatórios.");
      return;
    }

    const dateObj = new Date(formData.date);
    const cls: BiblicalClass = {
      ...formData,
      id: formData.id || Math.random().toString(36).substr(2, 9),
      year: dateObj.getFullYear(),
      month: dateObj.getMonth() + 1,
      students,
      chaplainId: user.id,
      createdAt: formData.id ? recentRecords.find(r => r.id === formData.id)?.createdAt || new Date().toISOString() : new Date().toISOString()
    };
    storageService.saveClass(cls).then(() => {
      alert("Classe bíblica registrada com sucesso!");
      setFormData({ id: '', date: new Date().toISOString().split('T')[0], sector: SECTORS[0], studySeries: '', currentLesson: '', observations: '' });
      setStudents([]);
      loadRecent();
      onSuccess();
    });
  };

  const handleEdit = (record: BiblicalClass) => {
    setFormData({
      id: record.id,
      date: record.date,
      sector: record.sector,
      studySeries: record.studySeries || '',
      currentLesson: record.currentLesson || '',
      observations: record.observations || ''
    });
    setStudents([...record.students]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-12">
      <div className="bg-white p-8 rounded-premium border border-slate-100 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2"><span>🎓</span> Registro de Classe Bíblica</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Guia de Estudo *</label>
              <input list="guides-list" required placeholder="Digite o guia utilizado" className="w-full px-4 py-3 bg-slate-50 border rounded-2xl outline-none font-bold" value={formData.studySeries} onChange={(e) => setFormData({...formData, studySeries: e.target.value})} />
              <datalist id="guides-list">
                {STUDY_GUIDES.map(g => <option key={g} value={g} />)}
              </datalist>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lição que está realizando? *</label>
              <input type="text" required placeholder="Nº ou título da lição" className="w-full px-4 py-3 bg-slate-50 border rounded-2xl outline-none font-bold" value={formData.currentLesson} onChange={(e) => setFormData({...formData, currentLesson: e.target.value})} />
            </div>
          </div>
          
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lista de Alunos Presentes *</label>
            <div className="flex gap-2">
               <input type="text" placeholder="Adicionar nome do aluno..." className="flex-1 px-4 py-3 bg-slate-50 border rounded-2xl outline-none font-bold" value={newStudent} onChange={e => setNewStudent(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), newStudent && !students.includes(newStudent) && setStudents([...students, newStudent]), setNewStudent(''))} />
               <button type="button" onClick={() => (newStudent && !students.includes(newStudent) && setStudents([...students, newStudent]), setNewStudent(''))} className="px-6 bg-primary text-white rounded-2xl font-black">Adicionar</button>
            </div>
            <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-2xl min-h-[60px] border border-slate-100">
              {students.map((s, i) => (
                <span key={i} className="px-3 py-1 bg-white border rounded-xl text-xs font-black flex items-center gap-2 shadow-sm animate-in fade-in zoom-in">
                  {s} <button type="button" onClick={() => setStudents(students.filter((_, idx) => idx !== i))} className="text-danger hover:scale-125 transition-transform">✕</button>
                </span>
              ))}
              {students.length === 0 && <span className="text-slate-300 text-xs italic">Nenhum aluno adicionado à lista...</span>}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Observações (Opcional)</label>
            <textarea rows={2} className="w-full px-4 py-3 bg-slate-50 border rounded-2xl outline-none" placeholder="Relate o que ocorreu nesta classe bíblica..." value={formData.observations} onChange={(e) => setFormData({...formData, observations: e.target.value})} />
          </div>

          <button type="submit" className="w-full py-5 bg-primary text-white rounded-premium font-black shadow-xl hover:scale-[1.01] active:scale-95 transition-all">
            {formData.id ? 'Salvar Alterações da Classe' : 'Finalizar Registro de Classe'}
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest ml-2">Classes Realizadas este Mês ({recentRecords.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentRecords.map(record => (
            <div key={record.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group">
              <div>
                <p className="font-black text-slate-800">{record.students.length} Alunos Presentes</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase">{record.studySeries} • {record.currentLesson}</p>
              </div>
              <div className="flex gap-2">
                 <button onClick={() => handleEdit(record)} className="p-2 bg-slate-50 text-primary rounded-xl hover:bg-primary hover:text-white transition-all">📝</button>
                 <button onClick={async () => { if(confirm("Apagar este registro permanentemente?")) { await storageService.deleteClass(record.id); loadRecent(); } }} className="p-2 bg-slate-50 text-danger rounded-xl hover:bg-danger hover:text-white transition-all">✕</button>
              </div>
            </div>
          ))}
          {recentRecords.length === 0 && <p className="text-slate-400 italic text-sm ml-2">Nenhuma classe bíblica registrada no período.</p>}
        </div>
      </div>
    </div>
  );
};

export default BiblicalClassForm;