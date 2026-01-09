
import React, { useState, useMemo } from 'react';
import { storageService } from '../services/storageService';
import { BiblicalClass, User, BiblicalStudy } from '../types';
import { STUDY_GUIDES } from '../constants';
import SearchableSelect from './SearchableSelect';
import SyncOverlay from './SyncOverlay';

interface Props { user: User; onSuccess: () => void; }

const BiblicalClassForm: React.FC<Props> = ({ user, onSuccess }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [newStudent, setNewStudent] = useState('');
  const [students, setStudents] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    sector: '', studySeries: STUDY_GUIDES[0], currentLesson: '', observations: ''
  });

  const config = storageService.getConfig();
  const allClasses = storageService.getClasses();

  const myRecent = useMemo(() => {
    return (allClasses || [])
      .filter((r: BiblicalClass) => r.chaplainId === user.id)
      .sort((a: BiblicalClass, b: BiblicalClass) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [allClasses, user.id]);

  const existingNames = useMemo(() => {
    const names = new Set<string>();
    (storageService.getStudies() || []).forEach((r: BiblicalStudy) => { if(r.patientName) names.add(r.patientName); });
    (allClasses || []).forEach((c: BiblicalClass) => {
      if(c.students) c.students.forEach((s: string) => { if(s) names.add(s); });
    });
    return Array.from(names).sort();
  }, [allClasses]);

  const addStudent = () => {
    if (newStudent.trim() && !students.includes(newStudent.trim())) {
      setStudents([...students, newStudent.trim()]);
      setNewStudent('');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sector || students.length === 0) return alert("Preencha o setor e adicione alunos.");
    setIsSyncing(true);
    const date = new Date(formData.date);
    const cls: BiblicalClass = {
      ...formData,
      id: Math.random().toString(36).substr(2, 9),
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      students,
      chaplainId: user.id,
      createdAt: new Date().toISOString()
    } as BiblicalClass;
    await storageService.saveClass(cls);
    setIsSyncing(false);
    setStudents([]);
    setFormData({...formData, currentLesson: '', observations: ''});
    onSuccess();
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Excluir classe?")) return;
    setIsSyncing(true);
    await storageService.deleteClass(id);
    setIsSyncing(false);
    onSuccess();
  };

  return (
    <div className="space-y-6">
      <SyncOverlay isVisible={isSyncing} />
      <form onSubmit={handleSave} className="bg-white p-8 rounded-premium shadow-xl space-y-6 text-slate-800">
        <h2 className="text-2xl font-black italic">🎓 Nova Classe Bíblica</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="date" className="p-4 bg-slate-50 border rounded-xl font-bold" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
          <SearchableSelect label="Setor" options={config.customSectors || []} value={formData.sector} onChange={v => setFormData({...formData, sector: v})} />
        </div>

        <div className="space-y-3 bg-slate-50 p-6 rounded-2xl border-2 border-dashed border-slate-200">
          <label className="text-[10px] font-black uppercase opacity-40">Adicionar Alunos</label>
          <div className="flex gap-2">
            <input list="all-students" className="flex-1 p-4 bg-white border rounded-xl font-bold" value={newStudent} onChange={e => setNewStudent(e.target.value)} placeholder="Nome do aluno..." />
            <datalist id="all-students">{existingNames.map((n: string) => <option key={n} value={n} />)}</datalist>
            <button type="button" onClick={addStudent} className="px-6 bg-success text-white rounded-xl font-black shadow-lg">➕</button>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {students.map((s: string, i: number) => (
              <span key={i} className="px-4 py-2 bg-white border shadow-sm rounded-full text-xs font-black text-slate-700 flex items-center gap-2">
                {s} <button type="button" onClick={() => setStudents(students.filter((_, idx) => idx !== i))} className="text-danger">✕</button>
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select className="p-4 bg-slate-50 border rounded-xl font-bold" value={formData.studySeries} onChange={e => setFormData({...formData, studySeries: e.target.value})}>
            {STUDY_GUIDES.map((s: string) => <option key={s}>{s}</option>)}
          </select>
          <input className="p-4 bg-slate-50 border rounded-xl font-bold" placeholder="Tema da Aula" value={formData.currentLesson} onChange={e => setFormData({...formData, currentLesson: e.target.value})} />
        </div>
        <button type="submit" className="w-full py-5 bg-primary text-white rounded-premium font-black shadow-xl">FINALIZAR CLASSE</button>
      </form>

      <div className="bg-white p-6 rounded-premium shadow-lg border">
        <h3 className="text-[11px] font-black uppercase text-slate-400 mb-4 tracking-widest">Últimas Classes</h3>
        <div className="space-y-3">
          {myRecent.length > 0 ? myRecent.map((r: BiblicalClass) => (
            <div key={r.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border">
              <div>
                <p className="font-black text-slate-800">{r.students.length} Alunos Presentes</p>
                <p className="text-[10px] font-bold text-primary uppercase">{r.sector} • {r.date.split('-').reverse().join('/')}</p>
              </div>
              <button onClick={() => handleDelete(r.id)} className="p-2 text-danger rounded-xl">✕</button>
            </div>
          )) : <p className="text-center py-4 text-xs font-bold text-slate-400 italic">Nenhum registro.</p>}
        </div>
      </div>
    </div>
  );
};

export default BiblicalClassForm;
