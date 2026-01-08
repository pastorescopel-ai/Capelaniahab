import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Reports from './components/Reports';
import Admin from './components/Admin';
import UsersList from './components/UsersList';
import Login from './components/Login';
import Profile from './components/Profile';
import History from './components/History';
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

  useEffect(() => {
    const initApp = async () => {
      storageService.init();
      const currentUser = storageService.getCurrentUser();
      setUser(currentUser);
      
      if (currentUser) {
        setIsSyncing(true);
        // Tenta baixar os dados mais recentes da nuvem para que o usuário veja o que outros postaram
        await storageService.pullFromCloud();
        setIsSyncing(false);
      }
      
      setIsInitializing(false);
    };
    
    initApp();
  }, []);

  const handleLogin = async (loggedUser: User) => {
    setUser(loggedUser);
    setIsSyncing(true);
    await storageService.pullFromCloud();
    setIsSyncing(false);
  };

  const handleLogout = () => {
    storageService.logout();
    setUser(null);
    setActiveTab('dashboard');
  };

  const handleUserUpdate = (updatedUser: User) => {
    setUser(updatedUser);
  };

  if (isInitializing) return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-slate-500 font-medium tracking-tight">Capelania Pro está carregando...</p>
    </div>
  );

  if (!user) return <Login onLogin={handleLogin} />;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard user={user} />;
      case 'estudos': return <BiblicalStudyForm user={user} onSuccess={() => {}} />;
      case 'classes': return <BiblicalClassForm user={user} onSuccess={() => {}} />;
      case 'pgs': return <SmallGroupForm user={user} onSuccess={() => {}} />;
      case 'colaboradores': return <StaffVisitForm user={user} onSuccess={() => {}} />;
      case 'history': return <History user={user} />;
      case 'reports': return user.role === UserRole.ADMIN ? <Reports user={user} /> : <Dashboard user={user} />;
      case 'admin': return <Admin />;
      case 'users': return <UsersList />;
      case 'profile': return <Profile user={user} onUpdate={handleUserUpdate} />;
      default: return <Dashboard user={user} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar user={user} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* TOP HEADER */}
        <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between shadow-sm z-30">
          <div className="flex items-center gap-4">
            <div className="md:hidden w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xs">C</div>
            <div className="flex flex-col">
              <h1 className="hidden md:block text-sm font-black text-slate-400 uppercase tracking-widest">
                {activeTab.replace(/([A-Z])/g, ' $1').trim()}
              </h1>
              {isSyncing && (
                <span className="text-[10px] text-primary animate-pulse font-bold">Sincronizando dados...</span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 pr-4 border-r border-slate-100 cursor-pointer" onClick={() => setActiveTab('profile')}>
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-slate-800">{user.name}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{user.role}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-100 overflow-hidden border border-slate-200 shadow-inner">
                {user.photoUrl ? <img src={user.photoUrl} alt="" className="w-full h-full object-cover" /> : <span className="flex items-center justify-center h-full text-lg">👤</span>}
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-danger/5 text-danger hover:bg-danger hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm active:scale-95"
            >
              <span>Sair</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" />
              </svg>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-8 lg:p-12">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </main>

      {/* MOBILE NAVS MANTIDAS IGUAIS */}
      <nav className="md:hidden fixed bottom-[88px] left-4 right-4 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-2xl flex items-center justify-around p-2 z-40">
        <button onClick={() => setActiveTab('dashboard')} className={`p-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-primary text-white scale-110 shadow-lg' : 'text-slate-400'}`}>
          <Icons.Dashboard />
        </button>
        <button onClick={() => setActiveTab('history')} className={`p-3 rounded-xl transition-all ${activeTab === 'history' ? 'bg-primary text-white scale-110 shadow-lg' : 'text-slate-400'}`}>
          <Icons.Sync />
        </button>
        
        {user.role === UserRole.ADMIN ? (
          <button onClick={() => setActiveTab('reports')} className={`p-3 rounded-xl transition-all ${activeTab === 'reports' ? 'bg-primary text-white scale-110 shadow-lg' : 'text-slate-400'}`}>
            <Icons.Reports />
          </button>
        ) : (
          <button onClick={() => setActiveTab('profile')} className={`p-3 rounded-xl transition-all ${activeTab === 'profile' ? 'bg-primary text-white scale-110 shadow-lg' : 'text-slate-400'}`}>
            <Icons.Users />
          </button>
        )}

        {user.role === UserRole.ADMIN && (
          <button onClick={() => setActiveTab('admin')} className={`p-3 rounded-xl transition-all ${activeTab === 'admin' ? 'bg-primary text-white scale-110 shadow-lg' : 'text-slate-400'}`}>
            <Icons.Admin />
          </button>
        )}
      </nav>

      <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-slate-900 rounded-2xl shadow-2xl flex items-center justify-around p-2 z-50">
        <button onClick={() => setActiveTab('estudos')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === 'estudos' ? 'text-white bg-white/10' : 'text-white/40'}`}>
          <Icons.Study />
          <span className="text-[8px] font-black uppercase">Estudo</span>
        </button>
        <button onClick={() => setActiveTab('classes')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === 'classes' ? 'text-white bg-white/10' : 'text-white/40'}`}>
          <Icons.Class />
          <span className="text-[8px] font-black uppercase">Classe</span>
        </button>
        <button onClick={() => setActiveTab('pgs')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === 'pgs' ? 'text-white bg-white/10' : 'text-white/40'}`}>
          <Icons.PG />
          <span className="text-[8px] font-black uppercase">PG</span>
        </button>
        <button onClick={() => setActiveTab('colaboradores')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === 'colaboradores' ? 'text-white bg-white/10' : 'text-white/40'}`}>
          <Icons.Staff />
          <span className="text-[8px] font-black uppercase">Colab</span>
        </button>
      </nav>
    </div>
  );
};

export default App;