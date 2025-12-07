export enum UserRole {
  ADMIN = 'ADMIN',
  RESPONSABLE = 'RESPONSABLE',
  ELEVE = 'ELEVE'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string; // Added password for authentication
  avatar?: string;
  classGroup?: string; // e.g., "Terminale A"
}

export interface Announcement {
  id: string;
  title: string;
  meetLink?: string;
  subject: string;
  date: Date;
  isUrgent: boolean;
  authorId: string;
  authorName: string;
  targetClass?: string; // If undefined/null, visible to all
}

export interface Exam {
  id: string;
  subject: string;
  date: Date;
  startTime: string; // HH:mm
  durationMinutes: number;
  room: string;
  notes?: string;
  createdById: string;
  targetClass?: string; // If undefined/null, visible to all
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  title: string;
  description?: string;
  options: PollOption[];
  isAnonymous: boolean;
  createdAt: Date;
  expiresAt: Date;
  createdById: string;
  votedUserIds: string[]; // Track who voted to prevent duplicates
  targetClass?: string; // If undefined/null, visible to all
}

export interface Resource {
  id: string;
  title: string;
  type: 'LINK' | 'BOOK' | 'FILE';
  content: string; // URL for LINK/FILE, Author/Ref for BOOK
  description?: string;
  subject: string;
  targetClass?: string;
  createdAt: Date;
}

export type ViewState = 'DASHBOARD' | 'INFOS' | 'DS' | 'POLLS' | 'RESOURCES' | 'USERS' | 'SETTINGS';

export interface AppNotification {
  id: string;
  type: 'alert' | 'info' | 'success';
  title: string;
  message: string;
  linkTo: ViewState;
  timestamp: Date;
}

export interface SchoolSettings {
  schoolName: string;
  themeColor: string;
}

export interface ClassGroup {
  id: string;
  name: string;
}