
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
  user_id?: number;
  is_processed?: boolean;
  is_pinned?: boolean;
  parent_id?: number | string;
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
  nextWeekSuggestions?: string[];
}

export interface Report {
  id: number;
  user_id: number;
  title: string;
  content: WeeklySummary;
  start_date?: string;
  end_date?: string;
  created_at: string;
}

export interface User {
  id: number;
  username: string;
  phone: string;
  email?: string;
  email_verified?: boolean;
}

export type ViewMode = 'dashboard' | 'review' | 'setup' | 'login' | 'register' | 'profile' | 'insights' | 'history' | 'inbox' | 'archive';

export type ModelProvider = 'gemini' | 'kimi' | 'glm' | 'qwen';

export interface AppConfig {
  provider: ModelProvider;
  modelName: string;
  apiKey: string;
  apiKeyTested: boolean;
  inboxRetentionDays?: number;
  archiveRetentionDays?: number;
}
