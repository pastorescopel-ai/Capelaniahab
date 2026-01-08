
import React, { useState, useMemo } from 'react';
import { SECTORS } from '../constants';
import { storageService } from '../services/storageService';
import { BiblicalClass, User } from '../types';

interface BiblicalClassFormProps {
  user: User;
  onSuccess: () => void;
}

const BiblicalClassForm: React.FC<BiblicalClassFormProps> = ({ user, onSuccess }) => {
  const config = storageService.getConfig();
  const ALL_SECTORS = useMemo(() => [
    ...SECTORS,
    ...(config.customSectors || [])
  ], [config.customSectors]);

  const masterStudentList = useMemo(() => {
    const list = new Set<string>();
    storageService.getClasses()
      .filter(c => c.chaplainId === user.id)
      .forEach(c => c.students.forEach(s => list.add(s)));
    return Array.from(list).sort();
  }, [user.id]);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    sector: ALL_SECTORS[0],
    studySeries: '',
    currentLesson: '',
    observations: ''
  });
  const [students, setStudents] = useState<string[]>([]);
  const [newStudent, setNewStudent] = useState('');
  const [showMasterList, setShowMasterList] = useState(false);

  const addStudent = (name?: string) => {
    const targetName = name || newStudent.trim();
    if (targetName && !students.includes(targetName)) {
      setStudents([...students, targetName]);
      setNewStudent('');
    }
  };

  const removeStudent = (index: number) => {
    setStudents(students.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (students.length === 0) {
      alert("Adicione participantes à classe.");
      return;
    }
    const dateObj = new Date(formData.date);
    const cls: BiblicalClass = {
      ...formData,
      id: Math.random().toString(36).substr(2, 9),
      year: dateObj.getFullYear(),
      month: dateObj.getMonth() + 1,
      students,
      chaplainId: user.id,
      createdAt: new Date().toISOString()
    };
    
    storageService.saveClass(cls);
    alert("Classe Bíblica registrada!");
    
    // Limpar campos variáveis mas manter página
    setStudents([]);
    setFormData({
      ...formData,
      currentLesson: '',
      observations: ''
    });
    
    onSuccess();
  };

  return (
    <div className="bg-white p-8 rounded-premium border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <span className="p-2 bg-primary/10 text-primary rounded-xl text-xl">🎓</span>
          Lançamento de Classe Bíblica
        </h2>
        <button 
          type="button"
          onClick={() => setShowMasterList(!showMasterList)}
          className="text-xs font-black uppercase tracking-widest text-primary bg-primary/5 px-4 py-2 rounded-xl hover:bg-primary/10 transition-all"
        >
          {showMasterList ? 'Ocultar Meus Alunos' : 'Ver Meus Alunos'}
        </button>
      </div>

      {showMasterList && (
        <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 animate-in slide-in-from-top-4 duration-300">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Selecione alunos da sua lista mestra:</p>
          <div className="flex flex-wrap gap-2">
            {masterStudentList.map(name => (
              <button 
                key={name}
                type="button"
                disabled={students.includes(name)}
                onClick={() => addStudent(name)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                  students.includes(name) 
                    ? 'bg-slate-200 text-slate-400 border-transparent cursor-not-allowed' 
                    : 'bg-white text-slate-700 border-slate-200 hover:border-primary hover:text-primary'
                }`}
              >
                + {name}
              </button>
            ))}
            {masterStudentList.length === 0 && <p className="text-xs text-slate-400 italic">Você ainda não tem alunos cadastrados em classes.</p>}
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-600">Data da Classe*</label>
            <input 
              type="date" 
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-bold"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-600">Setor*</label>
            <select 
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-bold"
              value={formData.sector}
              onChange={(e) => setFormData({...formData, sector: e.target.value})}
            >
              {ALL_SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-600">Nome da Série de Estudos</label>
            <input 
              type="text" 
              placeholder="Ex: Vida de Jesus"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-bold"
              value={formData.studySeries}
              onChange={(e) => setFormData({...formData, studySeries: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-600">Lição Atual</label>
            <input 
              type="text" 
              placeholder="Ex: Cap. 02"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-bold"
              value={formData.currentLesson}
              onChange={(e) => setFormData({...formData, currentLesson: e.target.value})}
            />
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-semibold text-slate-600">Participantes da Aula de Hoje*</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Digite um novo nome..."
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-bold"
              value={newStudent}
              onChange={(e) => setNewStudent(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addStudent())}
            />
            <button 
              type="button"
              onClick={() => addStudent()}
              className="px-6 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/10"
            >
              Adicionar
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2 min-h-[60px] p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            {students.length === 0 ? (
              <span className="text-slate-400 text-sm italic self-center">Nenhum aluno selecionado para esta classe hoje.</span>
            ) : (
              students.map((s, i) => (
                <span key={i} className="px-3 py-1.5 bg-white border border-slate-100 rounded-xl text-xs font-black text-slate-700 flex items-center gap-2 shadow-sm uppercase tracking-tighter animate-in zoom-in duration-200">
                  {s}
                  <button type="button" onClick={() => removeStudent(i)} className="text-danger hover:scale-120 transition-transform">✕</button>
                </span>
              ))
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-600">Observações da Classe</label>
          <textarea 
            rows={3}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none resize-none"
            placeholder="Detalhes do que foi estudado hoje..."
            value={formData.observations}
            onChange={(e) => setFormData({...formData, observations: e.target.value})}
          />
        </div>

        <button 
          type="submit"
          className="w-full py-5 bg-primary text-white rounded-premium font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.01] transition-all"
        >
          Salvar Registro Diário
        </button>
      </form>
    </div>
  );
};

export default BiblicalClassForm;
