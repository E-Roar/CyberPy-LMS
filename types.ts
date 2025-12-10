
export type UserRole = 'student' | 'teacher' | 'admin';

export interface Profile {
  id: string; // References auth.users id
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  xp: number;
  level: number;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: number;
  sender: 'user' | 'bot' | 'system';
  text: string;
  timestamp: Date;
}

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  active?: boolean;
}

export interface Course {
  id: string;
  title: string;
  progress: number;
  status: 'active' | 'completed' | 'locked';
}

export type ViewMode = 'blocks' | 'text';
export type PanelState = 'collapsed' | 'expanded';

export enum AppSection {
  DASHBOARD = 'DASHBOARD',
  COURSES = 'COURSES',
  FILES = 'FILES',
  GAMIFICATION = 'GAMIFICATION',
  ADMIN = 'ADMIN'
}
