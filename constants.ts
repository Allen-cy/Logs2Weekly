
import { AppConfig, LogEntry, LogType, LogStatus, WeeklySummary } from './types';

export const DEFAULT_LOG_HOTKEY = 'Control+M';
export const DEFAULT_TODO_HOTKEY = 'Control+K';
export const DEFAULT_AI_CONFIG: AppConfig = {
  provider: 'deepseek',
  modelName: 'deepseek-v4-pro',
  apiKey: 'sk-bae9527c7c034fc59109c378d7615c06',
  apiKeyTested: true,
  inboxRetentionDays: 15,
  archiveRetentionDays: 15,
  globalHotkey: DEFAULT_LOG_HOTKEY,
  todoHotkey: DEFAULT_TODO_HOTKEY,
};

export const INITIAL_LOGS: LogEntry[] = [
  {
    id: 'guide-1',
    type: LogType.NOTE,
    content: '### Quick Logger 指南\n\n1. **记录日志**：直接输入内容并回车。\n2. **创建任务**：使用 Markdown 语法 `- [ ] 任务内容`。\n3. **快捷转换**：笔记卡片右下角有“转为任务”按钮。\n4. **任务状态**：默认“进行中”(黄色)，勾选后变为“已完成”(绿色)。\n5. **任务推迟**：点击“推迟到明天”，任务将从今日流中消失，明天准时出现。',
    timestamp: new Date(),
    tags: ['Guide'],
    is_pinned: true,
  }
];

export const INITIAL_SUMMARY: WeeklySummary = {
  executiveSummary: "暂无周报。开始记录你的日志和任务，然后在 Weekly Review 页面点击 **Regenerate Summary**。",
  focusAreas: [{ name: '等待数据', percentage: 100 }],
  pulseStats: {
    completed: 0,
    completedChange: 0,
    deepWorkHours: 0,
    deepWorkAvg: 0
  },
  highlights: []
};
