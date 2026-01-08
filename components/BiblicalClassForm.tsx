
import React, { useState, useEffect, useMemo } from 'react';
import { SECTORS, STUDY_GUIDES } from '../constants';
import { storageService } from '../services/storageService';
import { BiblicalClass, User } from '../types';

interface BiblicalClassFormProps {
  user: User;
  onSuccess: () => void;
}

const BiblicalClassForm: React.FC<BiblicalClassFormProps> = ({ user, onSuccess }) => {
  const [recentRecords, setRecentRecords] = useState<BiblicalClass[]>([]);
  const config = storageService.getConfig();
  const sectors = config.customSectors.length > 0 ? config.customSectors : SECTORS;

  const [formData, setFormData] = useState({
    id: '',
    date: new Date().toISOString().split('T')[0],
    sector: sectors[0],
    studySeries: '',
    currentLesson: '',
    observations: ''
  });
  const [students, setStudents] = useState<string[]>([]);
  const [newStudent, setNewStudent] = useState('');

  const allClasses = useMemo(() => storageService.getClasses(), [recentRecords]);
  
  // Lista de Classes Recentes para Replicação
  const uniqueClasses = useMemo(() => {
    const map = new Map<string, BiblicalClass>();
    allClasses.forEach(c => {
        const key = `${c.sector}-${c.students.sort().join(',')}`;
        if (!map.has(key)) map.set(key, c);
    });
    return Array.from(map.values()).slice(0, 10);
  }, [allClasses]);

  const handleReplicaClass = (classId: string) => {
    const base = uniqueClasses.find(c => c.id === classId);
    if (base) {
        setStudents([...base.students]);
        setFormData({...formData, sector: base.sector, studySeries: base.studySeries, id: ''});
    }
  };

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
      alert("Adicione pelo menos um aluno na lista.");
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
      alert("Classe bíblica registrada!");
      setFormData({ id: '', date: new Date().toISOString().split('T')[0], sector: sectors[0], studySeries: '', currentLesson: '', observations: '' });
      setStudents([]);
      loadRecent();
      onSuccess();
    });
  };

  return (
    <div className="space-y-12">
      <div className="bg-white p-8 rounded-premium border border-slate-100 shadow-xl">
        <div className="flex justify-between items-center mb-8 border-b pb-4">
           <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2 italic">🎓 Classe Bíblica</h2>
           <div className="flex items-center gap-2">
              <label className="text-[10px] font-black uppercase text-slate-400">Replicar Classe:</label>
              <select onChange={(e) => handleReplicaClass(e.target.value)} className="bg-slate-50 px-4 py-2 rounded-xl text-xs font-bold text-purple-600 border-none outline-none">
                 <option value="">Selecione uma anterior...</option>
                 {uniqueClasses.map(c => <option key={c.id} value={c.id}>{c.sector} ({c.students.length} alunos)</option>)}
              </select>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data *</label>
              <input type="date" required className="w-full px-4 py-3 bg-slate-50 border rounded-2xl outline-none font-bold" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Setor *</label>
              <select required className="w-full px-4 py-3 bg-slate-50 border rounded-2xl outline-none font-bold" value={formData.sector} onChange={(e) => setFormData({...formData, sector: e.target.value})}>
                {sectors.map(s => <option key={s} value={s}>{s}</option>)}
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
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lição Atual *</label>
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
                <span key={i} className="px-3 py-1 bg-white border rounded-xl text-xs font-black flex items-center gap-2 shadow-sm">
                  {s} <button type="button" onClick={() => setStudents(students.filter((_, idx) => idx !== i))} className="text-danger hover:scale-125 transition-transform">✕</button>
                </span>
              ))}
              {students.length === 0 && <span className="text-slate-300 text-xs italic">Nenhum aluno na lista...</span>}
            </div>
          </div>

          <button type="submit" className="w-full py-5 bg-primary text-white rounded-premium font-black shadow-xl hover:scale-[1.01] active:scale-95 transition-all">
            {formData.id ? 'Salvar Alterações' : 'Finalizar Registro de Classe'}
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Classes deste Mês ({recentRecords.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentRecords.map(record => (
            <div key={record.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-md flex items-center justify-between">
              <div>
                <p className="font-black text-slate-800">{record.students.length} Alunos</p>
                <p className="text-[10px] text-purple-600 font-bold uppercase">{record.sector} • {record.currentLesson}</p>
              </div>
              <div className="flex gap-2">
                 <button onClick={() => { setFormData({...record}); setStudents([...record.students]); window.scrollTo({top:0, behavior:'smooth'}); }} className="p-2 bg-slate-50 text-primary rounded-xl hover:bg-primary hover:text-white transition-all">📝</button>
                 <button onClick={async () => { if(confirm("Remover registro?")) { await storageService.deleteClass(record.id); loadRecent(); } }} className="p-2 bg-slate-50 text-danger rounded-xl hover:bg-danger hover:text-white transition-all">✕</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BiblicalClassForm;
