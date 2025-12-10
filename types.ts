export interface User {
  id: string;
  name: string;
  role: 'student' | 'teacher' | 'admin';
  xp: number;
  level: number;
  avatarUrl: string;
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