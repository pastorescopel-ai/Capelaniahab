
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

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 150;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
      };
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file);
        setPhotoUrl(compressedBase64);
      } catch (err) {
        alert("Erro ao processar imagem.");
      }
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
        alert("Senhas não coincidem.");
        return;
      }
    }

    setIsSaving(true);
    const updatedUser: User = { 
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
      alert("Erro na sincronização.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div>
        <h2 className="text-4xl font-black text-slate-800 tracking-tight">Meu Perfil</h2>
        <p className="text-slate-500 text-lg italic">Dados sincronizados com a nuvem.</p>
      </div>

      <form onSubmit={handleSave} className="bg-white p-8 md:p-12 rounded-premium border border-slate-100 shadow-xl space-y-12">
        <div className="flex flex-col items-center gap-6 pb-8 border-b border-slate-50">
          <div className="relative">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-44 h-44 rounded-full border-8 border-slate-50 shadow-2xl overflow-hidden bg-slate-100 flex items-center justify-center cursor-pointer hover:ring-4 hover:ring-primary/20 transition-all group"
            >
              {photoUrl ? (
                <img src={photoUrl} alt="Perfil" className="w-full h-full object-cover" />
              ) : (
                <span className="text-7xl">👤</span>
              )}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                <span className="text-white text-[10px] font-black uppercase tracking-widest">Trocar Foto</span>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-2 right-4 w-12 h-12 bg-primary text-white rounded-full shadow-lg flex items-center justify-center border-4 border-white"
            >
              <Icons.Plus />
            </button>
          </div>
          <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handlePhotoUpload} />
          <div className="text-center">
             <p className="font-black text-slate-800 text-xl tracking-tight">Identidade Visual</p>
             <p className="text-sm text-slate-400 font-medium">Foto otimizada para sincronização rápida.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 uppercase tracking-tighter">
              <span className="text-primary">01.</span> Informações
            </h3>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
              <input 
                type="text" 
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-slate-700"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
              <div className="w-full px-6 py-4 bg-slate-100 border border-slate-100 rounded-2xl text-slate-400 font-bold select-none italic">
                {user.email}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 uppercase tracking-tighter">
              <span className="text-primary">02.</span> Segurança
            </h3>
            <div className="space-y-4">
              <input 
                type="password" 
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                placeholder="Senha atual"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <input 
                type="password" 
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                placeholder="Nova senha"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <input 
                type="password" 
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                placeholder="Confirmar nova senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
        </div>

        <button 
          type="submit"
          disabled={isSaving}
          className="w-full py-6 bg-primary text-white rounded-premium font-black text-xl shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {isSaving ? 'Sincronizando Foto...' : 'Salvar e Atualizar em Todos os Dispositivos'}
        </button>
      </form>
    </div>
  );
};

export default Profile;
