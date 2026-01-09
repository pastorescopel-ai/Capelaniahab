
import React, { useState, useMemo } from 'react';
import { storageService } from '../services/storageService';
import { BiblicalClass, User, HospitalUnit } from '../types';
import { STUDY_GUIDES } from '../constants';
import SearchableSelect from './SearchableSelect';
import SyncOverlay from './SyncOverlay';

interface Props { user: User; onSuccess: () => void; }

const BiblicalClassForm: React.FC<Props> = ({ user, onSuccess }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [unit, setUnit] = useState<HospitalUnit>('HAB');
  const [newStudent, setNewStudent] = useState('');
  const [students, setStudents] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    sector: '', studySeries: STUDY_GUIDES[0], currentLesson: '', observations: ''
  });

  const config = storageService.getConfig();
  const sectors = unit === 'HAB' ? config.customSectorsHAB : config.customSectorsHABA;
  const allClasses = storageService.getClasses();

  const myRecent = useMemo(() => {
    return allClasses
      .filter(r => r.chaplainId === user.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [allClasses, user.id]);

  const existingNames = useMemo(() => {
    const names = new Set<string>();
    storageService.getStudies().forEach(r => names.add(r.patientName));
    allClasses.forEach(c => c.students.forEach(s => names.add(s)));
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
    if (!formData.sector || students.length === 0) return alert("Selecione o setor e adicione alunos.");
    setIsSyncing(true);
    const date = new Date(formData.date);
    const cls: BiblicalClass = {
      ...formData,
      id: Math.random().toString(36).substr(2, 9),
      hospitalUnit: unit,
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
    if(!confirm("Deseja realmente excluir este registro?")) return;
    setIsSyncing(true);
    await storageService.deleteClass(id);
    setIsSyncing(false);
    onSuccess();
  };

  return (
    <div className="space-y-6">
      <SyncOverlay isVisible={isSyncing} />
      <form onSubmit={handleSave} className="bg-white p-8 rounded-premium shadow-xl space-y-6">
        <h2 className="text-2xl font-black italic">🎓 Nova Classe Bíblica</h2>
        <div className="flex gap-4">
          {['HAB', 'HABA'].map(u => (
            <button key={u} type="button" onClick={() => setUnit(u as any)} className={`flex-1 py-3 rounded-xl font-black transition-all ${unit === u ? 'bg-primary text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>UNIDADE {u}</button>
          ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="date" className="p-4 bg-slate-50 border rounded-xl font-bold" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
          <SearchableSelect label="Setor" options={sectors} value={formData.sector} onChange={v => setFormData({...formData, sector: v})} />
        </div>

        <div className="space-y-3 bg-slate-50 p-6 rounded-2xl border-2 border-dashed border-slate-200">
          <label className="text-[10px] font-black uppercase opacity-40">Adicionar Alunos (Busca ou Novo)</label>
          <div className="flex gap-2">
            <input list="all-students" className="flex-1 p-4 bg-white border rounded-xl font-bold" value={newStudent} onChange={e => setNewStudent(e.target.value)} placeholder="Nome do aluno..." />
            <datalist id="all-students">{existingNames.map(n => <option key={n} value={n} />)}</datalist>
            <button type="button" onClick={addStudent} className="px-6 bg-success text-white rounded-xl font-black shadow-lg">➕</button>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {students.map((s, i) => (
              <span key={i} className="px-4 py-2 bg-white border shadow-sm rounded-full text-xs font-black text-slate-700 flex items-center gap-2">
                {s} <button type="button" onClick={() => setStudents(students.filter((_, idx) => idx !== i))} className="text-danger">✕</button>
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select className="p-4 bg-slate-50 border rounded-xl font-bold" value={formData.studySeries} onChange={e => setFormData({...formData, studySeries: e.target.value})}>
            {STUDY_GUIDES.map(s => <option key={s}>{s}</option>)}
          </select>
          <input className="p-4 bg-slate-50 border rounded-xl font-bold" placeholder="Lição / Tema" value={formData.currentLesson} onChange={e => setFormData({...formData, currentLesson: e.target.value})} />
        </div>
        
        <button type="submit" className="w-full py-5 bg-primary text-white rounded-premium font-black shadow-xl hover:bg-slate-800 transition-all">FINALIZAR CLASSE</button>
      </form>

      <div className="bg-white p-6 rounded-premium shadow-lg border border-slate-100">
        <h3 className="text-[11px] font-black uppercase text-slate-400 mb-4 tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 bg-primary rounded-full"></span> Últimas Classes Registradas
        </h3>
        <div className="space-y-3">
          {myRecent.length > 0 ? myRecent.map(r => (
            <div key={r.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-primary/30 transition-all">
              <div>
                <p className="font-black text-slate-800">{r.students.length} Alunos Presentes</p>
                <p className="text-[10px] font-bold text-primary uppercase">{r.sector} • {r.date.split('-').reverse().join('/')}</p>
                <p className="text-[9px] text-slate-400 italic truncate max-w-[200px]">{r.students.join(', ')}</p>
              </div>
              <button onClick={() => handleDelete(r.id)} className="p-2 text-danger hover:bg-danger/10 rounded-xl transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )) : (
            <p className="text-center py-4 text-xs font-bold text-slate-400 italic">Nenhum registro recente.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BiblicalClassForm;
