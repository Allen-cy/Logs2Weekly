import React, { useState, useEffect } from 'react';
import { ViewMode, LogEntry, WeeklySummary, LogType, LogStatus, AppConfig, User, Report } from './types';
import { INITIAL_LOGS, INITIAL_SUMMARY } from './constants';
import DashboardView from './components/DashboardView';
import ReviewView from './components/ReviewView';
import Header from './components/Header';
import SetupView from './components/SetupView';
import ProfileSettingsView from './components/ProfileSettingsView';
import { generateWeeklyReport, fetchLogs, saveLog, deleteLog, fetchTodos, saveTodo, updateTodo as apiUpdateTodo, deleteTodo as apiDeleteTodo, suggestTags } from './aiService';

import RegisterView from './components/RegisterView';
import LoginView from './components/LoginView';
import { API_BASE_URL } from './aiService';
import UserManualModal from './components/UserManualModal';
import InsightsView from './components/InsightsView';
import ReportHistoryView from './components/ReportHistoryView';
import UpdateHistoryModal, { APP_VERSION } from './components/UpdateHistoryModal';
import InboxView from './components/InboxView';
import ArchiveView from './components/ArchiveView';
import TodoView from './components/TodoView';
import TodoReminderModal from './components/TodoReminderModal';
import MessagesView from './components/MessagesView';
import FeedbackModal from './components/FeedbackModal';
import NotificationToast from './components/NotificationToast';
import { Todo, TodoPriority } from './types';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    // 基础防御：如果本地没有用户信息，强制重定向到登录页
    const hasUser = localStorage.getItem('user');
    if (!hasUser) return 'login';
    return (localStorage.getItem('viewMode') as ViewMode) || 'dashboard';
  });

  useEffect(() => {
    if (viewMode !== 'login' && viewMode !== 'register') {
      localStorage.setItem('viewMode', viewMode);
    }
  }, [viewMode]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [summary, setSummary] = useState<WeeklySummary>(INITIAL_SUMMARY);
  const [isGenerating, setIsGenerating] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [config, setConfig] = useState<AppConfig>({
    provider: 'gemini',
    modelName: 'gemini-1.5-flash',
    apiKey: '',
    apiKeyTested: false,
    inboxRetentionDays: 15,
    archiveRetentionDays: 15,
    globalHotkey: 'Alt+M'
  });
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [showUpdateHistory, setShowUpdateHistory] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isTodosInitialized, setIsTodosInitialized] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTodoReminder, setShowTodoReminder] = useState(false);
  const [overdueTodos, setOverdueTodos] = useState<Todo[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationToast, setShowNotificationToast] = useState(false);
  const [showFeedbackFromMessages, setShowFeedbackFromMessages] = useState(false);
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(false);

  // 自动更新状态
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'available' | 'downloading' | 'downloaded'>('idle');
  const [updateProgress, setUpdateProgress] = useState({ percent: 0, transferred: 0, total: 0 });
  const [updateInfo, setUpdateInfo] = useState({ version: '', releaseNotes: '' });

  const handleSuggestTags = async (content: string) => {
    return await suggestTags(content, config);
  };

  // 监听桌面端置顶状态变化（来自托盘菜单）
  useEffect(() => {
    if ((window as any).ipcRenderer) {
      const cleanup = (window as any).ipcRenderer.on('always-on-top-changed', (flag: boolean) => {
        setIsAlwaysOnTop(flag);
      });
      return () => {
        if (typeof cleanup === 'function') cleanup();
      };
    }
  }, []);

  const handleToggleAlwaysOnTop = () => {
    const newState = !isAlwaysOnTop;
    setIsAlwaysOnTop(newState);
    if ((window as any).ipcRenderer) {
      (window as any).ipcRenderer.send('toggle-always-on-top', newState);
    }
  };

  // 监听自动更新事件
  useEffect(() => {
    if ((window as any).ipcRenderer) {
      const cleanupAvailable = (window as any).ipcRenderer.on('update-available', (info: any) => {
        setUpdateInfo(info);
        setUpdateStatus('available');
      });
      const cleanupProgress = (window as any).ipcRenderer.on('update-download-progress', (progress: any) => {
        setUpdateProgress(progress);
        setUpdateStatus('downloading');
      });
      const cleanupDownloaded = (window as any).ipcRenderer.on('update-downloaded', () => {
        setUpdateStatus('downloaded');
      });

      return () => {
        if (typeof cleanupAvailable === 'function') cleanupAvailable();
        if (typeof cleanupProgress === 'function') cleanupProgress();
        if (typeof cleanupDownloaded === 'function') cleanupDownloaded();
      };
    }
  }, []);

  const handleLoginSuccess = (loggedInUser: User) => {
    localStorage.setItem('user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    setViewMode('dashboard');
    // 登录时检查未读通知
    checkUnreadNotifications(loggedInUser.id);
  };

  const checkUnreadNotifications = async (userId: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/messages/unread-count?user_id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count || 0);
        if (data.count > 0) {
          setShowNotificationToast(true);
        }
      }
    } catch (e) {
      console.error('Check unread failed', e);
    }
  };

  // 0. 初始化：仅在挂载时从本地存储恢复用户信息
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && parsedUser.id) {
          setUser(parsedUser);

          const savedMode = localStorage.getItem('viewMode') as ViewMode;
          if (savedMode && ['dashboard', 'todos', 'review', 'profile', 'messages', 'inbox', 'archive', 'history', 'insights', 'setup'].includes(savedMode)) {
            setViewMode(savedMode);
          } else {
            setViewMode('dashboard');
          }

          // 检查是否显示新版本更新日志
          const lastSeenVersion = localStorage.getItem('lastSeenVersion');
          if (lastSeenVersion !== APP_VERSION) {
            setShowUpdateHistory(true);
            localStorage.setItem('lastSeenVersion', APP_VERSION);
          }

          // 检查未读通知
          checkUnreadNotifications(parsedUser.id);
        }
      } catch (e) {
        console.error("Failed to parse stored user", e);
        localStorage.removeItem('user');
      }
    }
  }, []);

  // 加载待办事项并检查过期提醒
  useEffect(() => {
    const loadTodos = async () => {
      const userTodosKey = user ? `todos_${user.id}` : 'todos';
      let localStored = localStorage.getItem(userTodosKey);

      // 1. 激进式打捞：无论当前状态如何，都检查 legacy 'todos' (旧全局 Key) 并合并
      const legacy = localStorage.getItem('todos');
      if (legacy) {
        try {
          const legacyParsed: Todo[] = JSON.parse(legacy);
          if (Array.isArray(legacyParsed) && legacyParsed.length > 0) {
            console.log(`Found ${legacyParsed.length} legacy items during scan...`);
            const localParsed: Todo[] = localStored ? JSON.parse(localStored) : [];
            const existingIds = new Set(localParsed.map(t => t.id));
            const newMigrationItems = legacyParsed.filter(t => !existingIds.has(t.id));
            if (newMigrationItems.length > 0) {
              const merged = [...localParsed, ...newMigrationItems];
              localStorage.setItem(userTodosKey, JSON.stringify(merged));
              localStored = JSON.stringify(merged);
            }
          }
          // 彻底迁移并备份，防止后续不断加载这些旧带时间戳 id 的项目导致无限复制
          localStorage.removeItem('todos');
          localStorage.setItem('todos_migrated_backup', legacy);
        } catch (e) { 
          localStorage.removeItem('todos');
        }
      }

      let masterTodos: Todo[] = [];
      if (localStored) {
        try { masterTodos = JSON.parse(localStored); } catch (e) { }
      }

      // 2. 如果已登录，从后端打捞并同步（双向对冲）
      if (user) {
        try {
          const apiData = await fetchTodos(user.id);
          if (apiData && Array.isArray(apiData)) {
            const apiTodos: Todo[] = apiData.map(t => ({
              id: String(t.id),
              content: t.content,
              completed: t.completed,
              completedAt: t.completed_at,
              createdAt: t.created_at,
              dueDate: t.due_date,
              listName: t.list_name,
              priority: (t.priority as TodoPriority) || TodoPriority.P3,
              notes: t.notes
            }));

            // 使用内容+创建时间指纹做去重推送
            const apiFingerprints = new Set(apiTodos.map(t => t.content + t.createdAt));
            const localOnly = masterTodos.filter(t => !apiFingerprints.has(t.content + t.createdAt));

            // 如果本地有云端没有的数据，主动推送
            if (localOnly.length > 0) {
              console.log(`Pushing ${localOnly.length} local items to cloud...`);
              for (const todo of localOnly) {
                try {
                  await saveTodo({
                    content: todo.content,
                    completed: todo.completed,
                    created_at: todo.createdAt,
                    list_name: todo.listName,
                    priority: todo.priority || TodoPriority.P3,
                    user_id: user.id,
                    notes: todo.notes
                  });
                } catch (saveErr) { }
              }
              // 重新抓取
              const freshApiData = await fetchTodos(user.id);
              masterTodos = freshApiData.map((t: any) => ({
                id: String(t.id),
                content: t.content,
                completed: t.completed,
                completedAt: t.completed_at,
                createdAt: t.created_at,
                dueDate: t.due_date,
                listName: t.list_name,
                priority: (t.priority as TodoPriority) || TodoPriority.P3,
                notes: t.notes
              }));
            } else {
              masterTodos = apiTodos;
            }
          }
        } catch (e) {
          console.error("Sync API todos failed", e);
        }
      }

      // 3. 统一迁移优先级格式并设置状态
      const migrated = masterTodos.map(todo => {
        const t = todo as any;
        if (t.priority === 'high') return { ...todo, priority: TodoPriority.P0 };
        if (t.priority === 'medium') return { ...todo, priority: TodoPriority.P1 };
        if (t.priority === 'low') return { ...todo, priority: TodoPriority.P3 };
        return { ...todo, priority: todo.priority || TodoPriority.P3 };
      });

      setTodos(migrated);

      const today = new Date().toDateString();
      const overdue = migrated.filter(t => !t.completed && new Date(t.createdAt).toDateString() !== today);
      if (overdue.length > 0) {
        setOverdueTodos(overdue);
        setShowTodoReminder(true);
      }

      setIsTodosInitialized(true);
    };

    loadTodos();
  }, [user]);

  // 待办事项保存逻辑
  useEffect(() => {
    // 关键：只有在初始加载完成后，才允许将当前的 todos 状态回写到 localStorage
    // 否则，在 todos 为初始值 [] 的瞬时，会把已有的数据覆盖掉
    if (isTodosInitialized) {
      const key = user ? `todos_${user.id}` : 'todos';
      localStorage.setItem(key, JSON.stringify(todos));
    }
  }, [todos, user, isTodosInitialized]);

  // 1. OAuth 回调检测：仅在存在 code 且未登录时触发
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code && !user) {
      const handleOAuthCallback = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/auth/github/callback?code=${code}`);
          const data = await response.json();
          if (response.ok && data.user) {
            handleLoginSuccess(data.user);
            // 清理 URL 参数,防止刷新重复触发
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } catch (err) {
          console.error('OAuth callback failed:', err);
        }
      };
      handleOAuthCallback();
    }
  }, [user]);

  // 1. 登录成功后加载用户配置
  useEffect(() => {
    const loadUserConfig = async () => {
      if (!user) return;
      try {
        const response = await fetch(`${API_BASE_URL}/user/config?user_id=${user.id}`);
        const data = await response.json();
        if (data.success && data.config) {
          const globalHotkey = data.config.global_hotkey || localStorage.getItem('globalHotkey') || 'Alt+M';
          const todoHotkey = data.config.todo_hotkey || localStorage.getItem('todoHotkey') || 'Alt+J';
          
          setConfig({
            provider: data.config.provider,
            modelName: data.config.model_name,
            apiKey: data.config.api_key_encrypted || '',
            apiKeyTested: !!data.config.api_key_encrypted,
            inboxRetentionDays: data.config.inbox_retention_days || 15,
            archiveRetentionDays: data.config.archive_retention_days || 15,
            globalHotkey: globalHotkey,
            todoHotkey: todoHotkey
          });
          // Sync to main process
          if ((window as any).ipcRenderer) {
            (window as any).ipcRenderer.send('set-hotkey', globalHotkey);
            (window as any).ipcRenderer.send('set-todo-hotkey', todoHotkey);
          }
        }
      } catch (err) {
        console.error("Failed to load user config", err);
      }
    };
    loadUserConfig();
  }, [user]);

  // 2. 配置变化时自动保存（仅限已测试通过的 API Key）
  useEffect(() => {
    const saveUserConfig = async () => {
      if (!user || !config.apiKeyTested) return;
      try {
        await fetch(`${API_BASE_URL}/user/config?user_id=${user.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: config.provider,
            model_name: config.modelName,
            api_key: config.apiKey,
            inbox_retention_days: config.inboxRetentionDays || 15,
            archive_retention_days: config.archiveRetentionDays || 15,
            global_hotkey: config.globalHotkey || 'Alt+M',
            todo_hotkey: config.todoHotkey || 'Alt+J'
          }),
        });
      } catch (err) {
        console.error("Failed to save user config", err);
      }
    };
    saveUserConfig();
  }, [config, user]);

  // 3. 加载日志
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      setIsLoadingLogs(true);
      try {
        const data = await fetchLogs(user.id);
        if (data) {
          setLogs(data);
        }
        
        // 获取并加载云端最新周报（实现三端初始化即同步展示）
        try {
          const reportResp = await fetch(`${API_BASE_URL}/reports?user_id=${user.id}`);
          if (reportResp.ok) {
            const reports = await reportResp.json();
            if (reports && reports.length > 0) {
              // reports[0] 是按时间倒序最新的记录
              let rawContent = reports[0].content;
              if (typeof rawContent === 'string') {
                try {
                  rawContent = JSON.parse(rawContent);
                } catch (e) {
                  console.warn("Failed to parse report content string", e);
                }
              }
              // 结构检查防崩溃
              if (rawContent !== null && typeof rawContent === 'object' && rawContent.executiveSummary) {
                // 确保基础的子属性存在，如果缺失就提供保底以免组件中通过 . 操作符导致崩溃白屏
                const safeSummary = {
                  executiveSummary: rawContent.executiveSummary || '暂无内容',
                  pulseStats: rawContent.pulseStats || { completed: 0, completedChange: 0, deepWorkHours: 0, deepWorkAvg: 0 },
                  focusAreas: rawContent.focusAreas || [],
                  highlights: rawContent.highlights || [],
                  nextWeekSuggestions: rawContent.nextWeekSuggestions || []
                };
                setSummary(safeSummary);
              }
            }
          }
        } catch (repErr) {
          console.error("Failed to fetch latest report", repErr);
        }
        
      } catch (err) {
        console.error("Failed to fetch logs", err);
        setLogs([]);
      } finally {
        setIsLoadingLogs(false);
      }
    };
    loadData();
  }, [user]);

  const handleAddLog = async (content: string): Promise<LogEntry | null> => {
    if (!user) return;
    let type = LogType.NOTE;
    let status: LogStatus | undefined = undefined;
    let cleanContent = content;

    if (content.startsWith('- [ ] ')) {
      type = LogType.TASK;
      status = LogStatus.IN_PROGRESS;
      cleanContent = content.substring(6);
    } else if (content.startsWith('- [x] ')) {
      type = LogType.TASK;
      status = LogStatus.DONE;
      cleanContent = content.substring(6);
    }

    const newLogData: Omit<LogEntry, 'id'> = {
      type,
      status,
      content: cleanContent,
      timestamp: new Date(),
      tags: [],
    };

    try {
      const saved = await saveLog({ ...newLogData, user_id: user.id });
      setLogs(prev => [saved, ...prev]);
      return saved;
    } catch (err) {
      console.error("Save log failed", err);
      const localLog: LogEntry = { ...newLogData, id: Date.now().toString(), timestamp: new Date() };
      setLogs(prev => [localLog, ...prev]);
      return localLog;
    }
  };

  const toggleLogStatus = (id: string) => {
    setLogs(prev => prev.map(log => {
      if (log.id === id && log.type === LogType.TASK) {
        return {
          ...log,
          status: log.status === LogStatus.DONE ? LogStatus.IN_PROGRESS : LogStatus.DONE
        };
      }
      return log;
    }));
  };

  const handleUpdateLogStatus = (id: string, status: LogStatus) => {
    setLogs(prev => prev.map(log => log.id === id ? { ...log, status } : log));
  };

  const handleEditLog = (id: string, content: string) => {
    setLogs(prev => prev.map(log => log.id === id ? { ...log, content } : log));
  };

  // 待办事项操作
  const handleAddTodo = async (content: string, listName: string, priority?: TodoPriority) => {
    const newTodo: Todo = {
      id: Date.now().toString(),
      content,
      completed: false,
      createdAt: new Date().toISOString(),
      listName,
      priority: priority || TodoPriority.P3
    };

    setTodos(prev => [newTodo, ...prev]);

    if (user) {
      try {
        const saved = await saveTodo({
          content: newTodo.content,
          completed: newTodo.completed,
          created_at: newTodo.createdAt,
          list_name: newTodo.listName,
          priority: newTodo.priority,
          user_id: user.id
        });
        if (saved && saved.id) {
          // 更新 ID 到真实 ID
          setTodos(prev => prev.map(t => t.id === newTodo.id ? { ...t, id: String(saved.id) } : t));
        }
        
        // 为极速待办添加日志标记，使其在 Dashboard 可见
        await handleAddLog(`- [ ] ${content}${listName !== '临时待办' ? ` (${listName})` : ''}`);
      } catch (err) {
        console.error("Save todo to backend failed", err);
      }
    }
  };

  const handleToggleTodo = async (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    const newCompleted = !todo.completed;
    const now = new Date().toISOString();
    let newRelatedLogId = todo.relatedLogId;

    // 乐观更新 UI：先更新 todo 本身的完成状态，防止因为后面等待 API 卡住从而触发动画闪回或“没反应”
    setTodos(prev => prev.map(t => t.id === id ? {
      ...t,
      completed: newCompleted,
      completedAt: newCompleted ? now : undefined,
    } : t));

    if (newCompleted && user) {
      try {
        const logContent = `[待办完成] ${todo.content} (${todo.listName})`;
        const saved = await handleAddLog(`- [x] ${logContent}`);
        if (saved) newRelatedLogId = saved.id;
      } catch (err) { }
    } else if (!newCompleted && user && todo.relatedLogId) {
      try {
        await deleteLog(todo.relatedLogId, user.id);
        setLogs(prev => prev.filter(l => l.id !== todo.relatedLogId));
        newRelatedLogId = undefined;
      } catch (err) {
        console.error("Undo log failed", err);
      }
    }

    if (newRelatedLogId !== todo.relatedLogId) {
      setTodos(prev => prev.map(t => t.id === id ? {
        ...t,
        relatedLogId: newRelatedLogId
      } : t));
    }

    if (user) {
      try {
        await apiUpdateTodo(id, user.id, {
          completed: newCompleted,
          completed_at: newCompleted ? now : null
        });
      } catch (err) {
        console.error("Update todo status on backend failed", err);
      }
    }
  };

  const handleDeleteTodo = async (id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
    if (user) {
      try {
        await apiDeleteTodo(id, user.id);
      } catch (err) {
        console.error("Delete todo on backend failed", err);
      }
    }
  };

  const handleUpdateTodo = async (id: string, updates: Partial<Todo>) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    if (user) {
      try {
        const backendUpdates: any = {};
        if (updates.content) backendUpdates.content = updates.content;
        if (updates.priority) backendUpdates.priority = updates.priority;
        if (updates.listName) backendUpdates.list_name = updates.listName;
        if (updates.notes) backendUpdates.notes = updates.notes;

        await apiUpdateTodo(id, user.id, backendUpdates);
      } catch (err) {
        console.error("Update todo on backend failed", err);
      }
    }
  };

  const handleRegenerate = async (isAuto = false) => {
    if (!config.apiKeyTested) {
      if (!isAuto) setViewMode('setup');
      return;
    }
    if (isGenerating && isAuto) return; // Prevent concurrent auto runs

    setIsGenerating(true);
    try {
      const newSummary = await generateWeeklyReport(logs, config);
      if (newSummary) {
        setSummary(newSummary);
        if (!isAuto) setViewMode('review');
        
        // 自动保存到后端，确保多端立即可见，解决不同步问题
        if (user) {
          try {
            await fetch(`${API_BASE_URL}/reports`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_id: user.id,
                title: `${new Date().toLocaleDateString('zh-CN')} ${isAuto ? '自动' : ''}总结周报`,
                content: newSummary,
                start_date: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
                end_date: new Date().toISOString().split('T')[0]
              })
            });
          } catch (e) {
            console.error("Auto sync report error", e);
          }
        }
      }
    } catch (e) {
      console.error(e);
      if (!isAuto) alert("生成失败，请检查配置或 API 配额。");
    } finally {
      setIsGenerating(false);
    }
  };

  // 自动监测每周五 18:00 生成周报
  useEffect(() => {
    if (!user || !config.apiKeyTested || logs.length === 0) return;

    const checkAutoReport = () => {
      const now = new Date();
      // 检查：只针对每周五 (getDay() === 5) 且 >= 18 点，或者周末补偿生成
      const isWeekendOrFridayEve = (now.getDay() === 5 && now.getHours() >= 18) || now.getDay() === 6 || now.getDay() === 0;

      if (isWeekendOrFridayEve) {
        // 利用本周某个固定标识，例如今天是周五的日期字符串
        // 不只是单天判定，而是记录最近一次生成的"周数"
        const currentYearWeek = `${now.getFullYear()}-W${Math.ceil((now.getDate() - now.getDay() + 10) / 7)}`;
        const lastStr = localStorage.getItem(`last_auto_report_week_${user.id}`);
        
        if (lastStr !== currentYearWeek) {
          console.log("Triggering Auto Generate Report for this weekend!");
          localStorage.setItem(`last_auto_report_week_${user.id}`, currentYearWeek);
          // 在后台静默生成并同步
          handleRegenerate(true);
        }
      }
    };

    // 初始化时检测一次
    checkAutoReport();
    // 后台长轮询：每小时检测一次防漏
    const timer = setInterval(checkAutoReport, 60 * 60 * 1000);
    return () => clearInterval(timer);
  }, [user, config.apiKeyTested, logs]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    sessionStorage.clear(); // 清理可能的会话缓存
    setUser(null);
    setLogs([]);
    setSummary(INITIAL_SUMMARY);
    setConfig({
      provider: 'gemini',
      modelName: 'gemini-1.5-flash',
      apiKey: '',
      apiKeyTested: false,
    });
    setViewMode('login');
  };

  const handleRefreshLogs = async () => {
    if (!user) return;
    try {
      const data = await fetchLogs(user.id);
      setLogs(data && data.length > 0 ? data : INITIAL_LOGS);
    } catch (err) {
      console.error("Manual refresh failed", err);
    }
  };

  const handleAddLogRef = React.useRef(handleAddLog);
  const handleAddTodoRef = React.useRef(handleAddTodo);
  
  // 保持引用最新，避免闭包陈旧
  handleAddLogRef.current = handleAddLog;
  handleAddTodoRef.current = handleAddTodo;

  useEffect(() => {
    if ((window as any).ipcRenderer) {
      const cleanup = (window as any).ipcRenderer.on('execute-quick-submit', (data: any) => {
        if (data.type === 'log') {
          handleAddLogRef.current(data.content);
        } else if (data.type === 'todo') {
          handleAddTodoRef.current(data.content, "未分类待办", data.priority);
        }
      });
      return () => {
        if (typeof cleanup === 'function') cleanup();
      };
    }
  }, []);

  const handleExportNotebookLM = async () => {
    let reportsData: any[] = [];
    if (user) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/reports?user_id=${user.id}`);
        if (response.ok) {
          const res = await response.json();
          if (res.data) reportsData = res.data;
        }
      } catch (err) {
        console.error("Failed to fetch reports for export", err);
      }
    }

    let content = `# 我的年度记录与待办汇总 (AI Productivity Hub 导出)\n\n`;
    content += `生成时间：${new Date().toLocaleString()}\n\n`;
    content += `> [!NOTE]\n> 请将此文档作为资料库（Source）上传至 Google NotebookLM，接着你就可以让 NotebookLM 帮你基于这些资料撰写你的年度总结 PPT 演讲稿了。\n\n`;

    content += `## 📝 待办事项汇总\n`;
    if (todos.length === 0) content += `暂无待办事项记录。\n`;
    todos.forEach(t => {
      content += `- [${t.completed ? 'x' : ' '}] ${t.content}\n  - 列表归属: ${t.listName}\n  - 优先级: ${t.priority}\n  - 创建时间: ${new Date(t.createdAt).toLocaleDateString()}\n`;
      if (t.completedAt) content += `  - 完成时间: ${new Date(t.completedAt).toLocaleDateString()}\n`;
    });

    content += `\n## 📅 日常日志与笔记\n`;
    if (logs.length === 0) content += `暂无日常日志记录。\n`;
    logs.forEach(l => {
      content += `### [${l.type === 'task' ? '任务' : l.type === 'note' ? '笔记' : 'AI 建议'}] - ${new Date(l.timestamp).toLocaleString()}\n`;
      if (l.status) content += `> 状态: ${l.status === 'done' ? '已完成' : l.status === 'in_progress' ? '进行中' : '待处理'}\n`;
      if (l.tags && l.tags.length > 0) content += `> 标签: ${l.tags.join(', ')}\n`;
      content += `\n${l.content}\n\n`;
    });

    content += `\n## 📊 历史周报汇总\n`;
    if (reportsData.length === 0) content += `暂无历史周报。\n`;
    reportsData.forEach(r => {
      content += `### 周报：${r.title} (${new Date(r.created_at).toLocaleDateString()})\n`;
      content += `**执行摘要：** ${r.content.executiveSummary}\n\n`;
      content += `**主要焦点：**\n`;
      r.content.focusAreas.forEach(fa => content += `- ${fa.name}: ${fa.percentage}%\n`);
      content += `\n**高光时刻：**\n`;
      r.content.highlights.forEach(h => content += `- ${h.title}: ${h.description}\n`);
      content += `\n**下周建议：**\n`;
      r.content.nextWeekSuggestions?.forEach(s => content += `- ${s}\n`);
      content += `\n---\n\n`;
    });

    try {
      const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `notebooklm-export-${new Date().getTime()}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert('✅ 已生成 Markdown 记录档案！\n\n你可以带上这份文件前往 NotebookLM，让它直接帮你起草【年终总结 PPT 演讲稿】等报告。');
    } catch (e) {
      console.error('Export failed', e);
      alert('导出失败，请检查浏览器是否拦截了下载。');
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* 自动更新弹窗 */}
      {updateStatus !== 'idle' && (
        <div className="fixed top-4 right-4 sm:top-24 sm:right-8 z-[200] w-[320px] bg-slate-900/95 backdrop-blur-xl border border-primary/50 shadow-2xl shadow-primary/20 rounded-2xl p-5 animate-in slide-in-from-right-8 fade-in duration-500">
          <div className="flex items-start gap-4">
            <div className={`p-2 rounded-xl flex-shrink-0 ${updateStatus === 'downloaded' ? 'bg-success/20 text-success' : 'bg-primary/20 text-primary'}`}>
              <span className="material-icons">{updateStatus === 'downloaded' ? 'system_update' : 'cloud_download'}</span>
            </div>
            <div className="flex-1">
              <h4 className="text-white font-bold text-sm mb-1">
                {updateStatus === 'available' ? '发现新版本' : updateStatus === 'downloading' ? '正在下载更新' : '更新已准备就绪'}
              </h4>
              <p className="text-slate-400 text-xs mb-3">
                {updateStatus === 'available' ? `版本 ${updateInfo.version} 已发布` : updateStatus === 'downloading' ? '下载完成后将提示您重启安装' : '一键重启完成版本升级'}
              </p>

              {updateStatus === 'available' && (
                <div className="flex gap-2">
                  <button onClick={() => { setUpdateStatus('idle'); (window as any).ipcRenderer?.send('download-update'); }} className="flex-1 py-1.5 bg-primary hover:brightness-110 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-primary/20">
                    立即更新
                  </button>
                  <button onClick={() => setUpdateStatus('idle')} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-all border border-slate-700">
                    稍后
                  </button>
                </div>
              )}

              {updateStatus === 'downloading' && (
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-primary h-1.5 rounded-full transition-all duration-300" style={{ width: `${updateProgress.percent}%` }}></div>
                </div>
              )}

              {updateStatus === 'downloaded' && (
                <div className="flex gap-2">
                  <button onClick={() => (window as any).ipcRenderer?.send('install-update')} className="flex-1 py-1.5 bg-success hover:brightness-110 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-success/20">
                    立即重启安装
                  </button>
                  <button onClick={() => setUpdateStatus('idle')} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-all border border-slate-700">
                    稍后
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {user && (
        <Header
          viewMode={viewMode}
          setViewMode={setViewMode}
          onRegenerate={handleRegenerate}
          isGenerating={isGenerating}
          config={config}
          onOpenGuide={() => setIsGuideOpen(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          todoCount={todos.filter(t => !t.completed).length}
          onExportNotebookLM={handleExportNotebookLM}
          onOpenFeedback={() => setShowFeedbackFromMessages(true)}
          isAlwaysOnTop={isAlwaysOnTop}
          onToggleAlwaysOnTop={handleToggleAlwaysOnTop}
        />
      )}

      <UserManualModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

      {showTodoReminder && (
        <TodoReminderModal
          overdueTodos={overdueTodos}
          onClose={() => setShowTodoReminder(false)}
          onGoToTodos={() => setViewMode('todos')}
        />
      )}

      {showUpdateHistory && (
        <UpdateHistoryModal
          autoTriggered={true}
          onClose={() => setShowUpdateHistory(false)}
        />
      )}

      {showNotificationToast && (
        <NotificationToast
          count={unreadCount}
          onView={() => { setShowNotificationToast(false); setViewMode('messages'); }}
          onDismiss={() => setShowNotificationToast(false)}
        />
      )}

      {showFeedbackFromMessages && user && (
        <FeedbackModal userId={user.id} onClose={() => setShowFeedbackFromMessages(false)} />
      )}

      <main className="flex-1 max-w-[1600px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {viewMode === 'register' && (
          <RegisterView
            onRegisterSuccess={(u) => {
              localStorage.setItem('user', JSON.stringify(u));
              setUser(u);
              setViewMode('dashboard');
            }}
            onSwitchToLogin={() => setViewMode('login')}
          />
        )}

        {viewMode === 'login' && (
          <LoginView
            onLoginSuccess={(u) => {
              localStorage.setItem('user', JSON.stringify(u));
              setUser(u);
              setViewMode('dashboard'); // 登录后直接进入 Dashboard，配置会自动加载
            }}
            onSwitchToRegister={() => setViewMode('register')}
          />
        )}

        {viewMode === 'setup' && (
          <SetupView
            config={config}
            setConfig={setConfig}
            onFinish={() => setViewMode('dashboard')}
          />
        )}

        {viewMode === 'profile' && user && (
          <ProfileSettingsView
            user={user}
            onUpdateUser={setUser}
            config={config}
            onUpdateConfig={setConfig}
            onLogout={handleLogout}
            onBack={() => setViewMode('dashboard')}
            onViewMessages={() => { setViewMode('messages'); setShowNotificationToast(false); }}
          />
        )}

        {viewMode === 'dashboard' && (
          <DashboardView
            logs={logs}
            user={user}
            onAddLog={handleAddLog}
            onToggleStatus={toggleLogStatus}
            onDeleteLog={(id) => setLogs(prev => prev.filter(l => l.id !== id))}
            onEditLog={(id, content) => setLogs(prev => prev.map(l => l.id === id ? { ...l, content } : l))}
            onPostponeLog={(id) => setLogs(prev => prev.map(l => {
              if (l.id === id) {
                const d = new Date(); d.setDate(d.getDate() + 1);
                return { ...l, timestamp: d };
              }
              return l;
            }))}
            onConvertToTask={(id) => setLogs(prev => prev.map(l => l.id === id ? { ...l, type: LogType.TASK, status: LogStatus.IN_PROGRESS } : l))}
            onRevertToNote={(id) => setLogs(prev => prev.map(l => l.id === id ? { ...l, type: LogType.NOTE, status: undefined } : l))}
            onRefresh={handleRefreshLogs}
            availableTags={['工作', '学习', '健康']}
            onViewInbox={() => setViewMode('inbox')}
            onViewArchive={() => setViewMode('archive')}
            retentionDays={config.archiveRetentionDays}
            searchQuery={searchQuery}
            onSuggestTags={handleSuggestTags}
          />
        )}

        {viewMode === 'todos' && (
          <TodoView
            todos={todos}
            user={user}
            onAddTodo={handleAddTodo}
            onToggleTodo={handleToggleTodo}
            onDeleteTodo={handleDeleteTodo}
            onUpdateTodo={handleUpdateTodo}
          />
        )}

        {viewMode === 'inbox' && (
          <InboxView
            logs={logs}
            onDeleteLog={(id) => setLogs(prev => prev.filter(l => l.id !== id))}
            onUpdateLogStatus={handleUpdateLogStatus}
            onEditLog={handleEditLog}
            onBack={() => setViewMode('dashboard')}
            retentionDays={config.inboxRetentionDays || 15}
          />
        )}

        {viewMode === 'archive' && (
          <ArchiveView
            logs={logs}
            onDeleteLog={(id) => setLogs(prev => prev.filter(l => l.id !== id))}
            onUpdateLogStatus={handleUpdateLogStatus}
            onEditLog={handleEditLog}
            onBack={() => setViewMode('dashboard')}
            retentionDays={config.archiveRetentionDays || 15}
          />
        )}

        {viewMode === 'messages' && user && (
          <MessagesView
            user={user}
            onBack={() => setViewMode('profile')}
            onOpenFeedback={() => setShowFeedbackFromMessages(true)}
          />
        )}

        {viewMode === 'review' && <ReviewView summary={summary} user={user} />}

        {viewMode === 'insights' && <InsightsView logs={logs} />}

        {viewMode === 'history' && user && <ReportHistoryView user={user} />}
      </main>

      {/* 移动端底部导航 - 全局统一 */}
      {user && (
        <nav className="fixed bottom-0 left-0 right-0 lg:hidden px-2 sm:px-4 pb-6 sm:pb-8 pt-2 bg-slate-950/90 backdrop-blur-2xl border-t border-white/5 z-[100] flex justify-around items-center safe-area-bottom">
          <button
            onClick={() => setViewMode('dashboard')}
            className={`flex flex-col items-center gap-1 transition-all ${viewMode === 'dashboard' ? 'text-primary scale-110' : 'text-slate-500'}`}
          >
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all ${viewMode === 'dashboard' ? 'bg-primary/20' : ''}`}>
              <span className="material-icons text-lg sm:text-xl">home</span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-tighter">控制台</span>
          </button>

          <button
            onClick={() => setViewMode('todos')}
            className={`flex flex-col items-center gap-1 transition-all ${viewMode === 'todos' ? 'text-primary scale-110' : 'text-slate-500'}`}
          >
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all ${viewMode === 'todos' ? 'bg-primary/20' : ''}`}>
              <span className="material-icons text-lg sm:text-xl">checklist</span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-tighter">待办</span>
          </button>

          <button
            onClick={() => setViewMode('review')}
            className={`flex flex-col items-center gap-1 transition-all ${viewMode === 'review' ? 'text-primary scale-110' : 'text-slate-500'}`}
          >
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all ${viewMode === 'review' ? 'bg-primary/20' : ''}`}>
              <span className="material-icons text-lg sm:text-xl">auto_awesome</span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-tighter">周报</span>
          </button>

          <button
            onClick={() => setViewMode('profile')}
            className={`flex flex-col items-center gap-1 transition-all ${viewMode === 'profile' ? 'text-primary scale-110' : 'text-slate-500'}`}
          >
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all ${viewMode === 'profile' ? 'bg-primary/20' : ''}`}>
              <span className="material-icons text-lg sm:text-xl">person</span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-tighter">我的</span>
          </button>
        </nav>
      )}

      <footer className="mt-auto py-4 sm:py-6 pb-24 sm:pb-28 lg:pb-6 border-t border-slate-800 bg-surface-dark/50">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500 font-medium">
          <p>© 2025 AI Productivity Hub • Multi-Model Powered</p>
          <div className="flex gap-4">
            <span className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${config.apiKeyTested ? 'bg-success' : 'bg-danger'}`}></span>
              {config.apiKeyTested ? '配置同步' : '未授权'}
            </span>
            <span className="opacity-50">|</span>
            <span className="text-primary font-black uppercase">
              {config.apiKeyTested ? `${config.provider}: ${config.modelName}` : '等待配置'}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
