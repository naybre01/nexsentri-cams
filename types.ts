export interface FrigateEvent {
  id: string;
  label: string;
  camera: string;
  startTime: number;
  thumbnail: string;
  hasClip: boolean;
  score: number; // Confidence score
}

export interface SystemStats {
  cpuUsage: number;
  memoryUsage: number;
  temp: number;
  storageUsed: number;
  storageTotal: number;
  timestamp: number;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  EVENTS = 'EVENTS',
  SETTINGS = 'SETTINGS',
  AI_INSIGHTS = 'AI_INSIGHTS'
}

export interface NodeRedConfig {
  webhookUrl: string;
  enabled: boolean;
  notifyOnPerson: boolean;
  notifyOnVehicle: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}
