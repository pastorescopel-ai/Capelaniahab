
import React, { useState, useEffect } from 'react';
import { SHIFTS } from '../constants';
import { storageService } from '../services/storageService';
import { SmallGroup, User, HospitalUnit } from '../types';
import SearchableSelect from './SearchableSelect';
import SyncOverlay from './SyncOverlay';

interface SmallGroupFormProps {
  user: User;
  onSuccess: () => void;
}

const SmallGroupForm: React.FC<SmallGroupFormProps> = ({ user, onSuccess }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [hospitalUnit, setHospitalUnit] = useState<HospitalUnit>('HAB');
  
  const config = storageService.getConfig();
  const currentSectors = hospitalUnit === 'HAB' ? config.customSectorsHAB : config.customSectorsHABA;
  const currentPGs = hospitalUnit === 'HAB' ? config.customPGsHAB : config.customPGsHABA;

  const [formData, setFormData] = useState({
    id: '',
    date: new Date().toISOString().split('T')[0],
    sector: '',
    name: '',
    leader: '',
    shift: SHIFTS[0] as any,
    participantsCount: 1
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.sector) {
        alert("Preencha todos os campos.");
        return;
    }

    setIsSyncing(true);
    const dateObj = new Date(formData.date);
    const group: SmallGroup = {
      ...formData,
      id: formData.id || Math.random().toString(36).substr(2, 9),
      hospitalUnit,
      year: dateObj.getFullYear(),
      month: dateObj.getMonth() + 1,
      chaplainId: user.id,
      createdAt: new Date().toISOString()
    } as SmallGroup;

    try {
        await storageService.saveGroup(group);
        setFormData({ id: '', date: new Date().toISOString().split('T')[0], sector: '', name: '', leader: '', shift: SHIFTS[0] as any, participantsCount: 1 });
        onSuccess();
    } finally {
        setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-8">
      <SyncOverlay isVisible={isSyncing} />
      <div className="bg-white p-8 rounded-premium border border-slate-100 shadow-xl">
        <h2 className="text-2xl font-black text-slate-800 mb-8 border-b pb-4 italic">🏠 Novo Pequeno Grupo</h2>

        <div className="flex gap-4 mb-8">
          {(['HAB', 'HABA'] as HospitalUnit[]).map(unit => (
            <button key={unit} onClick={() => { setHospitalUnit(unit); setFormData({...formData, sector: '', name: ''}); }} className={`flex-1 py-4 rounded-2xl font-black text-sm transition-all ${hospitalUnit === unit ? 'bg-primary text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
              UNIDADE {unit}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SearchableSelect 
            label="Escolha o PG Oficial" 
            options={currentPGs} 
            value={formData.name} 
            onChange={val => setFormData({...formData, name: val})}
            placeholder="Buscar PG..."
            required
          />

          <SearchableSelect 
            label="Setor do Hospital" 
            options={currentSectors} 
            value={formData.sector} 
            onChange={val => setFormData({...formData, sector: val})}
            placeholder="Buscar Setor..."
            required
          />

          <div className="space-y-1">
            <label className="text-sm font-black text-slate-700 uppercase tracking-widest ml-1">Líder do Grupo</label>
            <input type="text" required placeholder="Nome do líder" className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold" value={formData.leader} onChange={(e) => setFormData({...formData, leader: e.target.value})} />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-black text-slate-700 uppercase tracking-widest ml-1">Nº Participantes</label>
            <input type="number" required min="1" className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold" value={formData.participantsCount} onChange={(e) => setFormData({...formData, participantsCount: Number(e.target.value)})} />
          </div>

          <button type="submit" disabled={isSyncing} className="md:col-span-2 py-5 bg-primary text-white rounded-premium font-black shadow-xl">
             Salvar e Sincronizar
          </button>
        </form>
      </div>
    </div>
  );
};

export default SmallGroupForm;
