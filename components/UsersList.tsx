
import React, { useState } from 'react';
import { storageService } from '../services/storageService';
import { User, UserRole } from '../types';

const UsersList: React.FC = () => {
  const [users, setUsers] = useState<User[]>(storageService.getUsers());
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const handleResetPassword = async () => {
    if (!editingUser || !newPassword) return;
    const updated = { ...editingUser, password: newPassword };
    await storageService.saveUser(updated);
    setUsers(storageService.getUsers());
    setEditingUser(null);
    setNewPassword('');
    alert("Senha alterada com sucesso!");
  };

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-black italic">Gestão da Equipe</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map(u => (
          <div key={u.id} className="bg-white p-6 rounded-premium shadow-lg border flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-slate-100 rounded-full mb-4 flex items-center justify-center font-black text-primary">
                {u.name.charAt(0)}
              </div>
              <p className="font-black text-slate-800">{u.name}</p>
              <p className="text-xs text-slate-400 font-bold uppercase">{u.role}</p>
              <p className="text-[10px] text-slate-400 mt-2">{u.email}</p>
            </div>
            <div className="mt-6 pt-4 border-t flex gap-2">
               <button onClick={() => setEditingUser(u)} className="flex-1 py-2 bg-slate-100 text-[10px] font-black uppercase rounded-lg">Alterar Senha</button>
               {u.id !== 'master-admin' && (
                 <button onClick={async () => { if(confirm("Remover acesso?")) { await storageService.deleteUser(u.id); setUsers(storageService.getUsers()); } }} className="p-2 bg-danger text-white rounded-lg">✕</button>
               )}
            </div>
          </div>
        ))}
      </div>

      {editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-premium shadow-2xl max-w-sm w-full space-y-4">
            <h3 className="font-black text-xl">Nova Senha para {editingUser.name}</h3>
            <input 
              type="text" 
              className="w-full p-4 bg-slate-50 border rounded-xl font-black" 
              value={newPassword} 
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Digite a nova senha"
            />
            <div className="flex gap-2">
              <button onClick={() => setEditingUser(null)} className="flex-1 py-3 font-bold text-slate-400">Cancelar</button>
              <button onClick={handleResetPassword} className="flex-1 py-3 bg-primary text-white rounded-xl font-black">CONFIRMAR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersList;
