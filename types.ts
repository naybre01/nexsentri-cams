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

export interface CameraConfig {
  mode: 'local' | 'stream';
  streamUrl: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

declare global {
  interface Window {
    GEMINI_KEY: string;
    env: {
      API_KEY: string;
    }
  }

  interface ImportMetaEnv {
    readonly VITE_API_KEY: string;
    readonly VITE_DEFAULT_WEBHOOK_URL: string;
    readonly VITE_DEFAULT_STREAM_URL: string;
    readonly [key: string]: string | boolean | undefined;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }

  // Fix: Augment NodeJS namespace to add API_KEY to ProcessEnv
  namespace NodeJS {
    interface ProcessEnv {
      API_KEY: string;
      [key: string]: string | undefined;
    }
  }
}