import { BiblicalStudy, BiblicalClass, SmallGroup, StaffVisit, User, UserRole, CloudConfig, ChangeRequest } from '../types';

// ATENÇÃO: Verifique se esta URL é a sua última "Implantação" no Apps Script
const INTERNAL_CLOUD_URL = "https://script.google.com/macros/s/AKfycbw0ub9hBJxSKEwHDKrZYxhvhAnGIr1zkk4DJMokboDZyjT3eSBIwUwr0jHZ-fZHAn9k6A/exec"; 

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

let lastWriteTimestamp = 0;
const PULL_LOCK_MS = 8000;

export const storageService = {
  init() {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
    }
    const currentConfig = this.getConfig();
    if (currentConfig.databaseURL !== INTERNAL_CLOUD_URL) {
      this.saveConfig({ ...currentConfig, databaseURL: INTERNAL_CLOUD_URL });
    }
  },

  async pullFromCloud(): Promise<boolean> {
    if (Date.now() - lastWriteTimestamp < PULL_LOCK_MS) return true;
    try {
      const response = await fetch(`${INTERNAL_CLOUD_URL}?action=fetchAll`);
      if (!response.ok) return false;
      const cloudData = await response.json();
      if (cloudData) {
        if (cloudData.users) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(cloudData.users));
        if (cloudData.studies) localStorage.setItem(STORAGE_KEYS.STUDIES, JSON.stringify(cloudData.studies));
        if (cloudData.classes) localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(cloudData.classes));
        if (cloudData.groups) localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(cloudData.groups));
        if (cloudData.visits) localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(cloudData.visits));
        return true;
      }
      return false;
    } catch (e) { return false; }
  },

  async syncToCloud(type: string, data: any) {
    lastWriteTimestamp = Date.now();
    try {
      const user = this.getCurrentUser();
      await fetch(INTERNAL_CLOUD_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          type: type,
          timestamp: new Date().toISOString(),
          executedBy: user?.name || 'Sistema',
          data: data
        })
      });
    } catch (e) { console.warn("Cloud Sync Error:", e); }
  },

  async deleteStudy(id: string) {
    const data = this.getStudies().filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEYS.STUDIES, JSON.stringify(data)); 
    await this.syncToCloud('DELETE_STUDY', { id });
  },

  async deleteClass(id: string) {
    const data = this.getClasses().filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(data));
    await this.syncToCloud('DELETE_CLASS', { id });
  },

  async deleteGroup(id: string) {
    const data = this.getGroups().filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(data));
    await this.syncToCloud('DELETE_GROUP', { id });
  },

  async deleteVisit(id: string) {
    const data = this.getVisits().filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(data));
    await this.syncToCloud('DELETE_VISIT', { id });
  },

  login(email: string, password?: string): User | null {
    const users = this.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && (u.password === password || (!u.password && !password)));
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      return user;
    }
    return null;
  },

  logout() { localStorage.removeItem(STORAGE_KEYS.CURRENT_USER); },
  getCurrentUser(): User | null {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  },
  updateCurrentUser(user: User) {
    this.saveUser(user);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  },
  getUsers(): User[] { return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]'); },
  async saveUser(user: User) {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) users[index] = user; else users.push(user);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    await this.syncToCloud('USUARIOS', user);
  },
  async deleteUser(userId: string) {
    const users = this.getUsers().filter(u => u.id !== userId);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    await this.syncToCloud('DELETE_USER', { id: userId });
  },
  getStudies(): BiblicalStudy[] { return JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDIES) || '[]'); },
  async saveStudy(study: BiblicalStudy) {
    const data = this.getStudies();
    const index = data.findIndex(i => i.id === study.id);
    if (index >= 0) data[index] = study; else data.push(study);
    localStorage.setItem(STORAGE_KEYS.STUDIES, JSON.stringify(data));
    await this.syncToCloud('ESTUDOS_BIBLICOS', study);
  },
  getClasses(): BiblicalClass[] { return JSON.parse(localStorage.getItem(STORAGE_KEYS.CLASSES) || '[]'); },
  async saveClass(cls: BiblicalClass) {
    const data = this.getClasses();
    const index = data.findIndex(i => i.id === cls.id);
    if (index >= 0) data[index] = cls; else data.push(cls);
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(data));
    await this.syncToCloud('CLASSES_BIBLICAS', cls);
  },
  getGroups(): SmallGroup[] { return JSON.parse(localStorage.getItem(STORAGE_KEYS.GROUPS) || '[]'); },
  async saveGroup(group: SmallGroup) {
    const data = this.getGroups();
    const index = data.findIndex(i => i.id === group.id);
    if (index >= 0) data[index] = group; else data.push(group);
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(data));
    await this.syncToCloud('PEQUENOS_GRUPOS', group);
  },
  getVisits(): StaffVisit[] { return JSON.parse(localStorage.getItem(STORAGE_KEYS.VISITS) || '[]'); },
  async saveVisit(visit: StaffVisit) {
    const data = this.getVisits();
    const index = data.findIndex(i => i.id === visit.id);
    if (index >= 0) data[index] = visit; else data.push(visit);
    localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(data));
    await this.syncToCloud('VISITAS_COLABORADORES', visit);
  },
  getConfig(): CloudConfig { return JSON.parse(localStorage.getItem(STORAGE_KEYS.CONFIG) || `{"databaseURL":"${INTERNAL_CLOUD_URL}","spreadsheetId":"","customSectors":[],"customCollaborators":[]}`); },
  async saveConfig(config: CloudConfig) {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
    await this.syncToCloud('CONFIGURACAO_SISTEMA', { ...config, appLogo: 'OMITIDO', reportLogo: 'OMITIDO' });
  },
  getRequests(): ChangeRequest[] { return JSON.parse(localStorage.getItem(STORAGE_KEYS.REQUESTS) || '[]'); },
  async addRequest(request: ChangeRequest) {
    const reqs = this.getRequests();
    reqs.push(request);
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(reqs));
    await this.syncToCloud('SOLICITACAO_ALTERACAO', request);
  },
  async updateRequestStatus(id: string, status: 'APPROVED' | 'REJECTED') {
    const reqs = this.getRequests();
    const idx = reqs.findIndex(r => r.id === id);
    if (idx >= 0) {
      reqs[idx].status = status;
      localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(reqs));
    }
  }
};