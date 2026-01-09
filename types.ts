
export enum UserRole {
  ADMIN = 'ADMIN',
  CHAPLAIN = 'CHAPLAIN',
  ASSISTANT = 'ASSISTANT'
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  photoUrl?: string;
}

export interface BiblicalStudy {
  id: string;
  date: string;
  year: number;
  month: number;
  sector: string;
  patientName: string;
  whatsapp: string;
  status: 'Início da série' | 'Continuidade da série' | 'Término da série';
  studySeries: string;
  currentLesson: string;
  observations: string;
  chaplainId: string;
  createdAt: string;
}

export interface BiblicalClass {
  id: string;
  date: string;
  year: number;
  month: number;
  sector: string;
  students: string[];
  studySeries: string;
  currentLesson: string;
  observations: string;
  chaplainId: string;
  createdAt: string;
}

export interface SmallGroup {
  id: string;
  date: string;
  year: number;
  month: number;
  sector: string;
  name: string;
  leader: string;
  shift: 'Manhã' | 'Tarde' | 'Noite';
  participantsCount: number;
  chaplainId: string;
  createdAt: string;
}

export interface StaffVisit {
  id: string;
  date: string;
  year: number;
  month: number;
  sector: string;
  staffName: string;
  reason: string;
  otherReason?: string;
  needsFollowUp: boolean;
  observations: string;
  chaplainId: string;
  createdAt: string;
}

export interface CloudConfig {
  databaseURL: string;
  spreadsheetId: string;
  appLogo?: string;
  reportLogo?: string;
  customSectors: string[];
  customCollaborators: string[];
  customPGs: string[];
  generalMessage?: string;
  dashboardGreeting?: string;
  reportTitle?: string;
  reportSubtitle?: string;
  reportTitleFontSize?: string;
  reportSubtitleFontSize?: string;
}

export interface ChangeRequest {
  id: string;
  recordId: string;
  type: 'EDIT' | 'DELETE';
  module: 'STUDY' | 'CLASS' | 'PG' | 'VISIT';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedBy: string;
  requestedByName: string;
  requestedAt: string;
  reason?: string;
  newData?: any;
}
