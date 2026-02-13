import React, { useState, useEffect } from 'react';
import { ViewMode, LogEntry, WeeklySummary, LogType, LogStatus, AppConfig, User } from './types';
import { INITIAL_LOGS, INITIAL_SUMMARY } from './constants';
import DashboardView from './components/DashboardView';
import ReviewView from './components/ReviewView';
import Header from './components/Header';
import SetupView from './components/SetupView';
import ProfileSettingsView from './components/ProfileSettingsView';
import { generateWeeklyReport, fetchLogs, saveLog } from './aiService';

import RegisterView from './components/RegisterView';
import LoginView from './components/LoginView';
import { API_BASE_URL } from './aiService';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('login');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [summary, setSummary] = useState<WeeklySummary>(INITIAL_SUMMARY);
  const [isGenerating, setIsGenerating] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [config, setConfig] = useState<AppConfig>({
    provider: 'gemini',
    modelName: 'gemini-2.5-flash',
    apiKey: '',
    apiKeyTested: false,
  });

  // 1. 登录成功后加载用户配置
  useEffect(() => {
    const loadUserConfig = async () => {
      if (!user) return;
      try {
        const response = await fetch(`${API_BASE_URL}/user/config?user_id=${user.id}`);
        const data = await response.json();
        if (data.success && data.config) {
          setConfig({
            provider: data.config.provider,
            modelName: data.config.model_name,
            apiKey: data.config.api_key_encrypted, // 实际上是解密后的，DB 字段名暂未改
            apiKeyTested: true
          });
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
            api_key: config.apiKey
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
      try {
        const data = await fetchLogs(user.id);
        if (data && data.length > 0) {
          setLogs(data);
        } else {
          setLogs(INITIAL_LOGS);
        }
      } catch (err) {
        console.error("Failed to fetch logs", err);
        setLogs(INITIAL_LOGS);
      }
    };
    loadData();
  }, [user]);

  const handleAddLog = async (content: string) => {
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
      setLogs([saved, ...logs]);
    } catch (err) {
      console.error("Save log failed", err);
      const localLog: LogEntry = { ...newLogData, id: Date.now().toString(), timestamp: new Date() };
      setLogs([localLog, ...logs]);
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

  const handleRegenerate = async () => {
    if (!config.apiKeyTested) {
      setViewMode('setup');
      return;
    }
    setIsGenerating(true);
    try {
      const newSummary = await generateWeeklyReport(logs, config);
      if (newSummary) {
        setSummary(newSummary);
        setViewMode('review');
      }
    } catch (e) {
      console.error(e);
      alert("生成失败，请检查配置或 API 配额。");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setLogs([]);
    setConfig({
      provider: 'gemini',
      modelName: 'gemini-2.5-flash',
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

  return (
    <div className="flex flex-col min-h-screen">
      {user && (
        <Header
          viewMode={viewMode}
          setViewMode={setViewMode}
          onRegenerate={handleRegenerate}
          isGenerating={isGenerating}
          config={config}
        />
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {viewMode === 'register' && (
          <RegisterView
            onRegisterSuccess={(u) => {
              setUser(u);
              setViewMode('login');
            }}
            onSwitchToLogin={() => setViewMode('login')}
          />
        )}

        {viewMode === 'login' && (
          <LoginView
            onLoginSuccess={(u) => {
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
          />
        )}

        {viewMode === 'review' && <ReviewView summary={summary} />}
      </main>

      <footer className="mt-auto py-6 border-t border-slate-800 bg-surface-dark/50">
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
