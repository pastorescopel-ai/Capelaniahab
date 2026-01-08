
import React, { useState, useMemo } from 'react';
import { SECTORS, STUDY_STATUSES } from '../constants';
import { storageService } from '../services/storageService';
import { BiblicalStudy, User } from '../types';

interface BiblicalStudyFormProps {
  user: User;
  onSuccess: () => void;
}

const BiblicalStudyForm: React.FC<BiblicalStudyFormProps> = ({ user, onSuccess }) => {
  const config = storageService.getConfig();
  const pastStudies = storageService.getStudies().filter(s => s.chaplainId === user.id);
  
  const uniquePatients = useMemo(() => {
    const names = new Set();
    const list: {name: string, whatsapp: string, sector: string, studySeries: string}[] = [];
    pastStudies.forEach(s => {
      if (!names.has(s.patientName)) {
        names.add(s.patientName);
        list.push({ 
          name: s.patientName, 
          whatsapp: s.whatsapp, 
          sector: s.sector,
          studySeries: s.studySeries || ''
        });
      }
    });
    return list;
  }, [pastStudies]);

  const ALL_SECTORS = useMemo(() => [
    ...SECTORS,
    ...(config.customSectors || [])
  ], [config.customSectors]);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    sector: ALL_SECTORS[0],
    patientName: '',
    whatsapp: '',
    status: STUDY_STATUSES[0],
    studySeries: '',
    currentLesson: '',
    observations: ''
  });

  const [showHistory, setShowHistory] = useState(false);

  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, '').substring(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.substring(0, 2)}) ${digits.substring(2)}`;
    return `(${digits.substring(0, 2)}) ${digits.substring(2, 7)}-${digits.substring(7)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({...formData, whatsapp: formatPhone(e.target.value)});
  };

  const selectPatient = (p: any) => {
    setFormData({
      ...formData,
      patientName: p.name,
      whatsapp: p.whatsapp,
      sector: p.sector,
      studySeries: p.studySeries || ''
    });
    setShowHistory(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dateObj = new Date(formData.date);
    const study: BiblicalStudy = {
      ...formData,
      id: Math.random().toString(36).substr(2, 9),
      year: dateObj.getFullYear(),
      month: dateObj.getMonth() + 1,
      chaplainId: user.id,
      createdAt: new Date().toISOString()
    } as BiblicalStudy;
    
    storageService.saveStudy(study);
    alert("Estudo Bíblico registrado!");
    
    // Limpar apenas campos específicos para permitir novo registro rápido
    setFormData({
      ...formData,
      patientName: '',
      whatsapp: '',
      currentLesson: '',
      observations: ''
    });
    
    onSuccess();
  };

  return (
    <div className="bg-white p-8 rounded-premium border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <span className="p-2 bg-primary/10 text-primary rounded-xl text-xl">📖</span>
          Lançamento de Estudo Bíblico
        </h2>
        <button 
          type="button"
          onClick={() => setShowHistory(!showHistory)}
          className="text-xs font-black uppercase tracking-widest text-primary bg-primary/5 px-4 py-2 rounded-xl hover:bg-primary/10 transition-all"
        >
          {showHistory ? 'Fechar Lista' : 'Selecionar Aluno Existente'}
        </button>
      </div>

      {showHistory && (
        <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 animate-in slide-in-from-top-4 duration-300">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Seus Alunos Recentes</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {uniquePatients.map((p, i) => (
              <button 
                key={i} 
                onClick={() => selectPatient(p)}
                className="p-4 bg-white border border-slate-100 rounded-xl text-left hover:border-primary hover:shadow-md transition-all group"
              >
                <p className="font-black text-slate-800 group-hover:text-primary transition-colors">{p.name}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase">{p.sector}</p>
              </button>
            ))}
            {uniquePatients.length === 0 && <p className="text-sm text-slate-400 italic">Nenhum aluno cadastrado anteriormente.</p>}
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-600">Data do Atendimento*</label>
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
          <label className="block text-sm font-semibold text-slate-600">Nome do Aluno/Paciente*</label>
          <input 
            type="text" 
            required
            placeholder="Nome completo"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-bold"
            value={formData.patientName}
            onChange={(e) => setFormData({...formData, patientName: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-600">WhatsApp*</label>
          <input 
            type="tel" 
            required
            placeholder="(00) 00000-0000"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-bold"
            value={formData.whatsapp}
            onChange={handlePhoneChange}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-600">Status da Série*</label>
          <select 
            required
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-bold"
            value={formData.status}
            onChange={(e) => setFormData({...formData, status: e.target.value as any})}
          >
            {STUDY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4 md:col-span-2">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-600">Nome da Série de Estudos</label>
            <input 
              type="text" 
              placeholder="Ex: Ouvindo a Voz de Deus"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-bold"
              value={formData.studySeries}
              onChange={(e) => setFormData({...formData, studySeries: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-600">Lição Atual</label>
            <input 
              type="text" 
              placeholder="Ex: Lição 05"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-bold"
              value={formData.currentLesson}
              onChange={(e) => setFormData({...formData, currentLesson: e.target.value})}
            />
          </div>
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className="block text-sm font-semibold text-slate-600">Observações</label>
          <textarea 
            rows={3}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none resize-none"
            value={formData.observations}
            onChange={(e) => setFormData({...formData, observations: e.target.value})}
          />
        </div>

        <button 
          type="submit"
          className="md:col-span-2 py-5 bg-primary text-white rounded-premium font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all mt-4"
        >
          Salvar Estudo do Dia
        </button>
      </form>
    </div>
  );
};

export default BiblicalStudyForm;
