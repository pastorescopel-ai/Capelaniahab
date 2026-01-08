import { BiblicalStudy, BiblicalClass, SmallGroup, StaffVisit, User, UserRole, CloudConfig, ChangeRequest } from '../types';

// =========================================================
// CONFIGURAÇÃO INTERNA DO BACKEND (GOOGLE APPS SCRIPT)
// COLE SUA URL GERADA NO GOOGLE APPS SCRIPT AQUI ABAIXO:
// =========================================================
const INTERNAL_CLOUD_URL = "https://script.google.com/macros/s/AKfycbzMpLDFyRQcWB9GBacD-hbCIYgnMszfAuuTl5RvhOwmlXyXSauG4k8qV-4SHt09rRW_KA/exec"; 

const STORAGE_KEYS = {
  STUDIES: 'cap_studies',
  CLASSES: 'cap_classes',
  GROUPS: 'cap_groups',
  USERS: 'cap_users',
  CONFIG: 'cap_config',
  REQUESTS: 'cap_requests',
  CURRENT_USER: 'cap_current_user',
  VISITS: 'cap_visits'
};

const DEFAULT_USERS: User[] = [
  { id: '1', name: 'Admin Master', email: 'pastorescopel@gmail.com', password: 'admin', role: UserRole.ADMIN },
];

export const storageService = {
  init() {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
    }
    
    // Garante que a URL interna seja aplicada à configuração local
    const currentConfig = this.getConfig();
    if (currentConfig.databaseURL !== INTERNAL_CLOUD_URL) {
      this.saveConfig({
        ...currentConfig,
        databaseURL: INTERNAL_CLOUD_URL
      });
    }
  },

  async pullFromCloud(): Promise<boolean> {
    const url = INTERNAL_CLOUD_URL;
    if (!url || url.includes("SUA_URL")) return false;

    try {
      const response = await fetch(`${url}?action=fetchAll`);
      if (!response.ok) return false;
      const cloudData = await response.json();
      
      if (cloudData) {
        if (cloudData.users && cloudData.users.length > 0) {
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(cloudData.users));
        }
        if (cloudData.studies) localStorage.setItem(STORAGE_KEYS.STUDIES, JSON.stringify(cloudData.studies));
        if (cloudData.classes) localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(cloudData.classes));
        if (cloudData.groups) localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(cloudData.groups));
        if (cloudData.visits) localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(cloudData.visits));
        if (cloudData.requests) localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(cloudData.requests));
        return true;
      }
      return false;
    } catch (e) {
      console.error("Falha na sincronização Cloud:", e);
      return false;
    }
  },

  async syncToCloud(type: string, data: any) {
    const url = INTERNAL_CLOUD_URL;
    if (!url || url.includes("SUA_URL")) return;

    try {
      const user = this.getCurrentUser();
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: type,
          timestamp: new Date().toISOString(),
          executedBy: user?.name || 'Sistema',
          data: data
        })
      });
    } catch (e) {
      console.warn("Erro ao enviar dados para nuvem:", e);
    }
  },

  login(email: string, password?: string): User | null {
    const users = this.getUsers();
    const user = users.find(u => 
      u.email.toLowerCase() === email.toLowerCase() && 
      (u.password === password || (!u.password && !password))
    );
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      return user;
    }
    return null;
  },

  logout() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  getCurrentUser(): User | null {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  },

  updateCurrentUser(user: User) {
    this.saveUser(user);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  },

  getUsers(): User[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
  },

  saveUser(user: User) {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) users[index] = user;
    else users.push(user);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    this.syncToCloud('USUARIOS', user);
  },

  deleteUser(userId: string) {
    const users = this.getUsers();
    const filtered = users.filter(u => u.id !== userId);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filtered));
    this.syncToCloud('DELETE_USER', { id: userId });
  },

  getStudies(): BiblicalStudy[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDIES) || '[]');
  },

  saveStudy(study: BiblicalStudy) {
    const data = this.getStudies();
    const index = data.findIndex(i => i.id === study.id);
    if (index >= 0) data[index] = study;
    else data.push(study);
    localStorage.setItem(STORAGE_KEYS.STUDIES, JSON.stringify(data));
    this.syncToCloud('ESTUDOS_BIBLICOS', study);
  },

  deleteStudy(id: string) {
    const data = this.getStudies();
    const filtered = data.filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEYS.STUDIES, JSON.stringify(filtered));
    this.syncToCloud('DELETE_STUDY', { id });
  },

  getClasses(): BiblicalClass[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CLASSES) || '[]');
  },

  saveClass(cls: BiblicalClass) {
    const data = this.getClasses();
    const index = data.findIndex(i => i.id === cls.id);
    if (index >= 0) data[index] = cls;
    else data.push(cls);
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(data));
    this.syncToCloud('CLASSES_BIBLICAS', cls);
  },

  deleteClass(id: string) {
    const data = this.getClasses();
    const filtered = data.filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(filtered));
    this.syncToCloud('DELETE_CLASS', { id });
  },

  getGroups(): SmallGroup[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.GROUPS) || '[]');
  },

  saveGroup(group: SmallGroup) {
    const data = this.getGroups();
    const index = data.findIndex(i => i.id === group.id);
    if (index >= 0) data[index] = group;
    else data.push(group);
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(data));
    this.syncToCloud('PEQUENOS_GRUPOS', group);
  },

  deleteGroup(id: string) {
    const data = this.getGroups();
    const filtered = data.filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(filtered));
    this.syncToCloud('DELETE_GROUP', { id });
  },

  getVisits(): StaffVisit[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.VISITS) || '[]');
  },

  saveVisit(visit: StaffVisit) {
    const data = this.getVisits();
    const index = data.findIndex(i => i.id === visit.id);
    if (index >= 0) data[index] = visit;
    else data.push(visit);
    localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(data));
    this.syncToCloud('VISITAS_COLABORADORES', visit);
  },

  deleteVisit(id: string) {
    const data = this.getVisits();
    const filtered = data.filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(filtered));
    this.syncToCloud('DELETE_VISIT', { id });
  },

  getConfig(): CloudConfig {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CONFIG) || `{"databaseURL":"${INTERNAL_CLOUD_URL}","spreadsheetId":"","customSectors":[],"customCollaborators":[]}`);
  },

  saveConfig(config: CloudConfig) {
    // Garante que a URL interna nunca seja sobrescrita por uma vazia
    const finalConfig = { ...config, databaseURL: INTERNAL_CLOUD_URL };
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(finalConfig));
    this.syncToCloud('CONFIGURACAO_SISTEMA', { ...finalConfig, appLogo: 'OMITIDO', reportLogo: 'OMITIDO' });
  },

  getRequests(): ChangeRequest[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.REQUESTS) || '[]');
  },

  addRequest(req: ChangeRequest) {
    const reqs = this.getRequests();
    reqs.push(req);
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(reqs));
    this.syncToCloud('SOLICITACOES_ALTERACAO', req);
  },

  updateRequestStatus(id: string, status: 'APPROVED' | 'REJECTED') {
    const reqs = this.getRequests();
    const idx = reqs.findIndex(r => r.id === id);
    if (idx >= 0) {
      reqs[idx].status = status;
      localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(reqs));
      this.syncToCloud('UPDATE_REQUEST', { id, status });
    }
  }
};