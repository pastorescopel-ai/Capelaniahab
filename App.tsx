
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Reports from './components/Reports';
import Admin from './components/Admin';
import UsersList from './components/UsersList';
import Login from './components/Login';
import Profile from './components/Profile';
import BiblicalStudyForm from './components/BiblicalStudyForm';
import BiblicalClassForm from './components/BiblicalClassForm';
import SmallGroupForm from './components/SmallGroupForm';
import StaffVisitForm from './components/StaffVisitForm';
import { storageService } from './services/storageService';
import { User, UserRole } from './types';
import { Icons } from './constants';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Início', icon: Icons.Dashboard, roles: [UserRole.ADMIN, UserRole.CHAPLAIN, UserRole.ASSISTANT] },
    { id: 'estudos', label: 'Estudos', icon: Icons.Study, roles: [UserRole.ADMIN, UserRole.CHAPLAIN] },
    { id: 'classes', label: 'Classes', icon: Icons.Class, roles: [UserRole.ADMIN, UserRole.CHAPLAIN] },
    { id: 'pgs', label: 'PGs', icon: Icons.PG, roles: [UserRole.ADMIN, UserRole.CHAPLAIN] },
    { id: 'colaboradores', label: 'Colaborador', icon: Icons.Staff, roles: [UserRole.ADMIN, UserRole.CHAPLAIN] },
    { id: 'reports', label: 'Relatórios', icon: Icons.Reports, roles: [UserRole.ADMIN] },
    { id: 'admin', label: 'Painel', icon: Icons.Admin, roles: [UserRole.ADMIN] },
    { id: 'users', label: 'Equipe', icon: Icons.Users, roles: [UserRole.ADMIN] },
    { id: 'profile', label: 'Perfil', icon: () => <span className="text-lg">👤</span>, roles: [UserRole.ADMIN, UserRole.CHAPLAIN, UserRole.ASSISTANT] },
  ];

  useEffect(() => {
    const initApp = async () => {
      try {
        storageService.init();
        const currentUser = storageService.getCurrentUser();
        setUser(currentUser);
        if (currentUser) {
          setIsSyncing(true);
          await storageService.pullFromCloud().catch(() => {});
          setIsSyncing(false);
        }
      } catch (error) {
      } finally {
        setIsInitializing(false);
      }
    };
    initApp();
  }, []);

  const handleLogin = async (loggedUser: User) => {
    setUser(loggedUser);
    setIsSyncing(true);
    await storageService.pullFromCloud().catch(() => {});
    setIsSyncing(false);
  };

  const handleLogout = () => {
    if (confirm("Deseja realmente sair do sistema?")) {
      storageService.logout();
      setUser(null);
      setActiveTab('dashboard');
    }
  };

  if (isInitializing) return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!user) return <Login onLogin={handleLogin} />;

  const filteredMenuItems = menuItems.filter(item => item.roles.includes(user.role));

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard user={user} />;
      case 'estudos': return <BiblicalStudyForm user={user} onSuccess={() => {}} />;
      case 'classes': return <BiblicalClassForm user={user} onSuccess={() => {}} />;
      case 'pgs': return <SmallGroupForm user={user} onSuccess={() => {}} />;
      case 'colaboradores': return <StaffVisitForm user={user} onSuccess={() => {}} />;
      case 'reports': return user.role === UserRole.ADMIN ? <Reports user={user} /> : <Dashboard user={user} />;
      case 'admin': return <Admin />;
      case 'users': return <UsersList />;
      case 'profile': return <Profile user={user} onUpdate={(u) => setUser(u)} />;
      default: return <Dashboard user={user} />;
    }
  };

  const activeTabLabel = menuItems.find(i => i.id === activeTab)?.label || 'Dashboard';

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar user={user} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header Otimizado */}
        <header className="bg-white border-b border-slate-100 px-5 py-3 flex items-center justify-between shadow-sm z-30">
          <div className="flex items-center gap-2">
            <h1 className="text-xs font-black text-primary uppercase tracking-widest">{activeTabLabel}</h1>
            {isSyncing && <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></div>}
          </div>
          
          <div className="flex items-center gap-3">
             {/* Botão de Logout Rápido */}
             <button 
                onClick={handleLogout}
                className="p-2.5 bg-slate-50 text-slate-400 hover:text-danger rounded-xl hover:bg-danger/5 transition-all"
                title="Sair do sistema"
             >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
             </button>
             
             <div 
               className="w-9 h-9 rounded-xl bg-slate-100 overflow-hidden cursor-pointer border border-slate-200 shadow-inner" 
               onClick={() => setActiveTab('profile')}
             >
                {user.photoUrl ? (
                  <img src={user.photoUrl} className="w-full h-full object-cover" />
                ) : (
                  <span className="flex items-center justify-center h-full text-lg">👤</span>
                )}
             </div>
          </div>
        </header>

        {/* Área de Conteúdo */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-32 md:pb-8 no-scrollbar">
          <div className="max-w-7xl mx-auto">{renderContent()}</div>
        </div>
      </main>

      {/* Navegação Inferior Mobile Rolável - Todos os Ícones Visíveis */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50">
        <div className="flex overflow-x-auto no-scrollbar items-center px-4 py-2 gap-2">
          {filteredMenuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center min-w-[72px] h-16 rounded-2xl transition-all ${
                activeTab === item.id 
                  ? 'bg-primary text-white scale-105 shadow-lg shadow-primary/20' 
                  : 'text-slate-400'
              }`}
            >
              <div className="mb-1 transform scale-90">
                <item.icon />
              </div>
              <span className="text-[9px] font-black uppercase tracking-tight">{item.label}</span>
            </button>
          ))}
          {/* Espaçador final para garantir que o último item não fique colado */}
          <div className="min-w-[16px] h-1"></div>
        </div>
        {/* Barra de segurança para iPhone (Home Indicator) */}
        <div className="h-[env(safe-area-inset-bottom)] bg-white"></div>
      </nav>
    </div>
  );
};

export default App;
