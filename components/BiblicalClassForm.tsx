
import React, { useState, useEffect } from 'react';
import { STUDY_GUIDES } from '../constants';
import { storageService } from '../services/storageService';
import { BiblicalClass, User, HospitalUnit } from '../types';
import SearchableSelect from './SearchableSelect';
import SyncOverlay from './SyncOverlay';

interface BiblicalClassFormProps {
  user: User;
  onSuccess: () => void;
}

const BiblicalClassForm: React.FC<BiblicalClassFormProps> = ({ user, onSuccess }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [hospitalUnit, setHospitalUnit] = useState<HospitalUnit>('HAB');
  
  const config = storageService.getConfig();
  const currentSectors = hospitalUnit === 'HAB' ? config.customSectorsHAB : config.customSectorsHABA;

  const [formData, setFormData] = useState({
    id: '',
    date: new Date().toISOString().split('T')[0],
    sector: '',
    studySeries: STUDY_GUIDES[0],
    currentLesson: '',
    observations: ''
  });
  const [students, setStudents] = useState<string[]>([]);
  const [newStudent, setNewStudent] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sector || students.length === 0) {
      alert("Selecione o setor e adicione pelo menos um aluno.");
      return;
    }

    setIsSyncing(true);
    const dateObj = new Date(formData.date);
    const cls: BiblicalClass = {
      ...formData,
      id: formData.id || Math.random().toString(36).substr(2, 9),
      hospitalUnit,
      year: dateObj.getFullYear(),
      month: dateObj.getMonth() + 1,
      students,
      chaplainId: user.id,
      createdAt: new Date().toISOString()
    } as BiblicalClass;

    try {
      await storageService.saveClass(cls);
      setFormData({ id: '', date: new Date().toISOString().split('T')[0], sector: '', studySeries: STUDY_GUIDES[0], currentLesson: '', observations: '' });
      setStudents([]);
      onSuccess();
      alert("Classe bíblica registrada!");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-8">
      <SyncOverlay isVisible={isSyncing} />
      <div className="bg-white p-6 md:p-8 rounded-premium border border-slate-100 shadow-xl">
        <h2 className="text-2xl font-black text-slate-800 mb-8 border-b pb-4 italic">🎓 Registro de Classe</h2>

        <div className="flex gap-4 mb-8">
          {(['HAB', 'HABA'] as HospitalUnit[]).map(unit => (
            <button key={unit} type="button" onClick={() => { setHospitalUnit(unit); setFormData({...formData, sector: ''}); }} className={`flex-1 py-4 rounded-2xl font-black text-sm transition-all ${hospitalUnit === unit ? 'bg-primary text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
              UNIDADE {unit}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SearchableSelect 
              label={`Setor ${hospitalUnit}`} 
              options={currentSectors} 
              value={formData.sector} 
              onChange={val => setFormData({...formData, sector: val})} 
              placeholder="Escolha o setor..."
              required
            />
            <div className="space-y-1">
              <label className="text-[11px] font-black text-slate-700 uppercase tracking-widest ml-1">Data</label>
              <input type="date" required className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
            </div>
          </div>
          
          <div className="space-y-4">
            <label className="text-[11px] font-black text-slate-700 uppercase tracking-widest ml-1">Alunos Presentes</label>
            <div className="flex gap-2">
               <input type="text" placeholder="Nome do aluno..." className="flex-1 px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-800" value={newStudent} onChange={e => setNewStudent(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), newStudent && (setStudents([...students, newStudent]), setNewStudent('')))} />
               <button type="button" onClick={() => (newStudent && setStudents([...students, newStudent]), setNewStudent(''))} className="px-6 bg-primary text-white rounded-2xl font-black">Adicionar</button>
            </div>
            <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-2xl min-h-[60px] border-2 border-dashed border-slate-200">
              {students.map((s, i) => (
                <span key={i} className="px-3 py-1 bg-white border-2 border-slate-100 rounded-xl text-xs font-black text-slate-700 flex items-center gap-2 animate-in zoom-in">
                  {s} <button type="button" onClick={() => setStudents(students.filter((_, idx) => idx !== i))} className="text-danger hover:scale-125 transition-transform">✕</button>
                </span>
              ))}
              {students.length === 0 && <span className="text-slate-400 text-xs italic font-bold">Nenhum aluno adicionado...</span>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[11px] font-black text-slate-700 uppercase tracking-widest ml-1">Série / Guia</label>
              <select className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-800" value={formData.studySeries} onChange={(e) => setFormData({...formData, studySeries: e.target.value})}>
                {STUDY_GUIDES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-black text-slate-700 uppercase tracking-widest ml-1">Lição da Classe</label>
              <input type="text" placeholder="Ex: O Sábado" className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-800" value={formData.currentLesson} onChange={(e) => setFormData({...formData, currentLesson: e.target.value})} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-black text-slate-700 uppercase tracking-widest ml-1">Observações</label>
            <textarea rows={2} className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-800" value={formData.observations} onChange={(e) => setFormData({...formData, observations: e.target.value})} placeholder="Notas sobre a classe..." />
          </div>

          <button type="submit" disabled={isSyncing} className="w-full py-5 bg-primary text-white rounded-premium font-black shadow-xl hover:bg-slate-800 transition-all">
            Finalizar e Sincronizar Classe
          </button>
        </form>
      </div>
    </div>
  );
};

export default BiblicalClassForm;
