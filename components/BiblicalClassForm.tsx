
import React, { useState, useMemo, useEffect } from 'react';
import { SECTORS } from '../constants';
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
    if (students.length === 0) return alert("Adicione alunos.");
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
      alert("Classe salva!");
      setFormData({ id: '', date: new Date().toISOString().split('T')[0], sector: SECTORS[0], studySeries: '', currentLesson: '', observations: '' });
      setStudents([]);
      loadRecent();
      onSuccess();
    });
  };

  // Fix: Explicitly map fields to match formData state structure and handle optional properties
  const handleEdit = (record: BiblicalClass) => {
    setFormData({
      id: record.id,
      date: record.date,
      sector: record.sector,
      studySeries: record.studySeries || '',
      currentLesson: record.currentLesson || '',
      observations: record.observations
    });
    setStudents([...record.students]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Apagar permanentemente do Sheets?")) {
      await storageService.deleteClass(id);
      loadRecent();
    }
  };

  return (
    <div className="space-y-12">
      <div className="bg-white p-8 rounded-premium border border-slate-100 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2"><span>🎓</span> Registro de Classe Bíblica</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input type="date" required className="px-4 py-3 bg-slate-50 border rounded-2xl outline-none font-bold" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
            <select required className="px-4 py-3 bg-slate-50 border rounded-2xl outline-none font-bold" value={formData.sector} onChange={(e) => setFormData({...formData, sector: e.target.value})}>
              {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="space-y-4">
            <div className="flex gap-2">
               <input type="text" placeholder="Nome do aluno..." className="flex-1 px-4 py-3 bg-slate-50 border rounded-2xl" value={newStudent} onChange={e => setNewStudent(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), students.includes(newStudent) || setStudents([...students, newStudent]), setNewStudent(''))} />
               <button type="button" onClick={() => (newStudent && !students.includes(newStudent) && setStudents([...students, newStudent]), setNewStudent(''))} className="px-6 bg-primary text-white rounded-2xl font-bold">Add</button>
            </div>
            <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-2xl min-h-[50px]">
              {students.map((s, i) => (
                <span key={i} className="px-3 py-1 bg-white border rounded-xl text-xs font-black flex items-center gap-2">
                  {s} <button type="button" onClick={() => setStudents(students.filter((_, idx) => idx !== i))} className="text-danger">✕</button>
                </span>
              ))}
            </div>
          </div>
          <button type="submit" className="w-full py-5 bg-primary text-white rounded-premium font-black shadow-xl">Salvar Classe</button>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest ml-2">Classes do Mês ({recentRecords.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentRecords.map(record => (
            <div key={record.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="font-black text-slate-800">{record.students.length} Alunos</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase">{record.sector} • {record.date}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(record)} className="p-2 bg-slate-50 text-primary rounded-xl">📝</button>
                <button onClick={() => handleDelete(record.id)} className="p-2 bg-slate-50 text-danger rounded-xl">✕</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BiblicalClassForm;
