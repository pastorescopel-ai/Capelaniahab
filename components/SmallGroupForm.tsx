
import React, { useState } from 'react';
import { SECTORS, SHIFTS } from '../constants';
import { storageService } from '../services/storageService';
import { SmallGroup, User } from '../types';

interface SmallGroupFormProps {
  user: User;
  onSuccess: () => void;
}

const SmallGroupForm: React.FC<SmallGroupFormProps> = ({ user, onSuccess }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    sector: SECTORS[0],
    name: '',
    leader: '',
    shift: SHIFTS[0],
    participantsCount: 1
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dateObj = new Date(formData.date);
    const group: SmallGroup = {
      ...formData,
      id: Math.random().toString(36).substr(2, 9),
      year: dateObj.getFullYear(),
      month: dateObj.getMonth() + 1,
      chaplainId: user.id,
      createdAt: new Date().toISOString()
    } as SmallGroup;
    
    storageService.saveGroup(group);
    alert("Pequeno Grupo registrado com sucesso!");
    
    // Limpar campos mas manter na página
    setFormData({
      ...formData,
      name: '',
      leader: '',
      participantsCount: 1
    });
    
    onSuccess();
  };

  return (
    <div className="bg-white p-8 rounded-premium border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <span className="p-2 bg-primary/10 text-primary rounded-xl text-xl">🏠</span>
        Novo Pequeno Grupo
      </h2>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-600">Data do Encontro*</label>
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
            {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-600">Nome do Grupo*</label>
          <input 
            type="text" 
            required
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-bold"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-600">Líder do PG*</label>
          <input 
            type="text" 
            required
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-bold"
            value={formData.leader}
            onChange={(e) => setFormData({...formData, leader: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-600">Turno*</label>
          <select 
            required
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-bold"
            value={formData.shift}
            onChange={(e) => setFormData({...formData, shift: e.target.value as any})}
          >
            {SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-600">Qtd. Participantes*</label>
          <input 
            type="number" 
            required
            min="1"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-bold"
            value={formData.participantsCount}
            onChange={(e) => setFormData({...formData, participantsCount: Number(e.target.value)})}
          />
        </div>

        <button 
          type="submit"
          className="md:col-span-2 py-5 bg-primary text-white rounded-premium font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.01] transition-all mt-4"
        >
          Salvar Pequeno Grupo do Dia
        </button>
      </form>
    </div>
  );
};

export default SmallGroupForm;
