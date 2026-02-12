
export enum LogType {
  TASK = 'task',
  NOTE = 'note',
  AI_SUGGESTION = 'ai_suggestion'
}

export enum LogStatus {
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
  PENDING = 'pending'
}

export interface LogEntry {
  id: string;
  type: LogType;
  status?: LogStatus;
  content: string;
  timestamp: Date;
  tags: string[];
  category?: string;
}

export interface WeeklySummary {
  executiveSummary: string;
  focusAreas: { name: string; percentage: number }[];
  pulseStats: {
    completed: number;
    completedChange: number;
    deepWorkHours: number;
    deepWorkAvg: number;
  };
  highlights: {
    title: string;
    description: string;
    icon: string;
    category: string;
    timestamp: string;
  }[];
}

export interface User {
  username: string;
  phone: string;
}

export type ViewMode = 'dashboard' | 'review' | 'setup' | 'login' | 'register';

export type ModelProvider = 'gemini' | 'kimi';

export interface AppConfig {
  provider: ModelProvider;
  modelName: string;
  apiKey: string;
  apiKeyTested: boolean;
}
