
import React, { useState, useRef } from 'react';
import { storageService } from '../services/storageService';
import { User } from '../types';
import { Icons } from '../constants';

interface ProfileProps {
  user: User;
  onUpdate: (updatedUser: User) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onUpdate }) => {
  const [name, setName] = useState(user.name);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [photoUrl, setPhotoUrl] = useState(user.photoUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Limite de tamanho para evitar problemas no Google Sheets (máx 50kb recomendado para strings base64 em células)
      if (file.size > 100000) {
        alert("A imagem é muito grande. Escolha uma foto menor (máx 100kb).");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword || currentPassword || confirmPassword) {
      if (currentPassword !== user.password) {
        alert("Senha atual incorreta.");
        return;
      }
      if (newPassword !== confirmPassword) {
        alert("A nova senha e a confirmação não coincidem.");
        return;
      }
      if (newPassword.length < 3) {
        alert("A nova senha deve ter pelo menos 3 caracteres.");
        return;
      }
    }

    setIsSaving(true);
    const updatedUser = { 
      ...user, 
      name, 
      photoUrl,
      password: newPassword ? newPassword : user.password 
    };
    
    try {
      await storageService.updateCurrentUser(updatedUser);
      onUpdate(updatedUser);
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      alert("Perfil atualizado e sincronizado na nuvem!");
    } catch (err) {
      alert("Erro ao sincronizar perfil.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div>
        <h2 className="text-4xl font-black text-slate-800 tracking-tight">Meu Perfil</h2>
        <p className="text-slate-500 text-lg">Gerencie suas informações pessoais e segurança da conta.</p>
      </div>

      <form onSubmit={handleSave} className="bg-white p-8 md:p-12 rounded-premium border border-slate-100 shadow-xl space-y-12">
        <div className="flex flex-col items-center gap-6 pb-8 border-b border-slate-50">
          <div className="relative">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-40 h-40 rounded-full border-8 border-slate-50 shadow-2xl overflow-hidden bg-slate-100 flex items-center justify-center cursor-pointer hover:ring-4 hover:ring-primary/20 transition-all group"
            >
              {photoUrl ? (
                <img src={photoUrl} alt="Foto Perfil" className="w-full h-full object-cover" />
              ) : (
                <span className="text-6xl">👤</span>
              )}
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-white text-[10px] font-black uppercase tracking-widest">Alterar Foto</span>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-2 right-2 w-10 h-10 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
            >
              <Icons.Plus />
            </button>
          </div>
          <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handlePhotoUpload} />
          <div className="text-center">
             <p className="font-bold text-slate-700">Sua Foto de Perfil</p>
             <p className="text-sm text-slate-400">Salve para sincronizar com todos os seus dispositivos.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span>📝</span> Dados Pessoais
            </h3>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">Nome Completo</label>
              <input 
                type="text" 
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all font-semibold"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">E-mail de Acesso</label>
              <div className="w-full px-6 py-4 bg-slate-100 border border-slate-100 rounded-2xl text-slate-400 font-medium select-none">
                {user.email}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span>🔒</span> Alterar Senha
            </h3>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">Senha Atual</label>
              <input 
                type="password" 
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">Nova Senha</label>
              <input 
                type="password" 
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                placeholder="Nova senha..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">Confirmar Nova Senha</label>
              <input 
                type="password" 
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                placeholder="Repita a nova senha..."
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
        </div>

        <button 
          type="submit"
          disabled={isSaving}
          className="w-full py-5 bg-primary text-white rounded-premium font-black text-xl shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {isSaving ? 'Sincronizando Perfil...' : 'Salvar e Sincronizar Perfil'}
        </button>
      </form>
    </div>
  );
};

export default Profile;
