
import React, { useState, useMemo } from 'react';
import { SECTORS, VISIT_REASONS } from '../constants';
import { storageService } from '../services/storageService';
import { StaffVisit, User } from '../types';

interface StaffVisitFormProps {
  user: User;
  onSuccess: () => void;
}

const StaffVisitForm: React.FC<StaffVisitFormProps> = ({ user, onSuccess }) => {
  const config = storageService.getConfig();
  
  const MASTER_STAFF_LIST = useMemo(() => {
    const base = [
      "Ana Oliveira", "Carlos Santos", "Daniel Lima", "Eduarda Souza", 
      "Fábio Silva", "Gisela Pereira", "Heitor Gomes", "Isabela Rocha"
    ];
    return Array.from(new Set([...base, ...(config.customCollaborators || [])])).sort();
  }, [config.customCollaborators]);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    sector: SECTORS[0],
    staffName: '',
    reason: VISIT_REASONS[0],
    otherReason: '',
    needsFollowUp: false,
    observations: ''
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredStaff = useMemo(() => 
    MASTER_STAFF_LIST.filter(s => 
      s.toLowerCase().includes(searchTerm.toLowerCase())
    ), [searchTerm, MASTER_STAFF_LIST]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalStaffName = formData.staffName || searchTerm.trim();
    
    if (!finalStaffName) {
      alert("Por favor, selecione ou digite o nome de um colaborador.");
      return;
    }

    // Se o nome não existe, salva na lista customizada
    if (!MASTER_STAFF_LIST.some(s => s.toLowerCase() === finalStaffName.toLowerCase())) {
      const confirmAdd = window.confirm(`"${finalStaffName}" é um novo colaborador. Deseja salvá-lo na lista permanente do sistema?`);
      if (confirmAdd) {
        const currentConfig = storageService.getConfig();
        const updatedCollaborators = Array.from(new Set([...(currentConfig.customCollaborators || []), finalStaffName]));
        storageService.saveConfig({ ...currentConfig, customCollaborators: updatedCollaborators });
      }
    }

    const dateObj = new Date(formData.date);
    const visit: StaffVisit = {
      ...formData,
      id: Math.random().toString(36).substr(2, 9),
      year: dateObj.getFullYear(),
      month: dateObj.getMonth() + 1,
      staffName: finalStaffName,
      chaplainId: user.id,
      createdAt: new Date().toISOString()
    } as StaffVisit;
    
    storageService.saveVisit(visit);
    alert("Visita registrada com sucesso!");

    setSearchTerm('');
    setFormData({
      ...formData,
      staffName: '',
      observations: '',
      needsFollowUp: false
    });

    onSuccess();
  };

  return (
    <div className="bg-white p-8 rounded-premium border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <span className="p-2 bg-primary/10 text-primary rounded-xl text-xl">🤝</span>
        Visita a Colaborador
      </h2>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-600">Data*</label>
          <input 
            type="date" 
            required
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold"
            value={formData.date}
            onChange={(e) => setFormData({...formData, date: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-600">Setor*</label>
          <select 
            required
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold"
            value={formData.sector}
            onChange={(e) => setFormData({...formData, sector: e.target.value})}
          >
            {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
            {config.customSectors?.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="space-y-2 relative">
          <label className="block text-sm font-semibold text-slate-600">Colaborador*</label>
          <div className="relative">
            <input 
              type="text" 
              required
              placeholder="Digite para buscar ou adicionar..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold pr-12"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setFormData({...formData, staffName: ''});
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />
            {searchTerm && !MASTER_STAFF_LIST.some(s => s.toLowerCase() === searchTerm.toLowerCase()) && (
              <span className="absolute right-4 top-3.5 text-[9px] font-black bg-success/10 text-success px-2 py-1 rounded uppercase tracking-widest">Novo</span>
            )}
          </div>
          
          {showSuggestions && filteredStaff.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-100 rounded-xl shadow-2xl max-h-40 overflow-y-auto no-scrollbar">
              {filteredStaff.map(s => (
                <button
                  key={s}
                  type="button"
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm font-medium border-b border-slate-50 last:border-none"
                  onClick={() => {
                    setSearchTerm(s);
                    setFormData({...formData, staffName: s});
                    setShowSuggestions(false);
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-600">Motivo*</label>
          <select 
            required
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold"
            value={formData.reason}
            onChange={(e) => setFormData({...formData, reason: e.target.value})}
          >
            {VISIT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 md:col-span-2">
          <input 
            type="checkbox" 
            id="followup-visit"
            className="w-5 h-5 rounded text-primary"
            checked={formData.needsFollowUp}
            onChange={(e) => setFormData({...formData, needsFollowUp: e.target.checked})}
          />
          <label htmlFor="followup-visit" className="text-sm font-semibold text-slate-700 cursor-pointer">
            Necessita Retorno / Acompanhamento?
          </label>
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className="block text-sm font-semibold text-slate-600">Observações</label>
          <textarea 
            rows={3}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none resize-none"
            value={formData.observations}
            onChange={(e) => setFormData({...formData, observations: e.target.value})}
            placeholder="Relate o atendimento..."
          />
        </div>

        <button 
          type="submit"
          className="md:col-span-2 py-5 bg-primary text-white rounded-premium font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.01] transition-all"
        >
          Salvar Visita
        </button>
      </form>
    </div>
  );
};

export default StaffVisitForm;
