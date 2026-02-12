
import React, { useState, useEffect } from 'react';
import { ViewMode, LogEntry, WeeklySummary, LogType, LogStatus, AppConfig } from './types';
import { INITIAL_LOGS, INITIAL_SUMMARY } from './constants';
import DashboardView from './components/DashboardView';
import ReviewView from './components/ReviewView';
import Header from './components/Header';
import SetupView from './components/SetupView';
import { generateWeeklyReport, fetchLogs, saveLog } from './aiService';

import RegisterView from './components/RegisterView';
import LoginView from './components/LoginView';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('register');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [summary, setSummary] = useState<WeeklySummary>(INITIAL_SUMMARY);
  const [isGenerating, setIsGenerating] = useState(false);
  const [user, setUser] = useState<any>(null); // Store user info
  const [config, setConfig] = useState<AppConfig>({
    provider: 'gemini',
    modelName: 'gemini-2.5-flash',
    apiKey: '',
    apiKeyTested: false,
  });

  // 初始化加载日志
  useEffect(() => {
    // Only load logs if user is logged in? 
    // For now, let's keep it simple. Maybe clear logs on logout.
    const loadData = async () => {
      const data = await fetchLogs();
      if (data.length > 0) {
        setLogs(data);
      } else {
        setLogs(INITIAL_LOGS);
      }
    };
    if (user) {
      loadData();
    }
  }, [user]);

  const handleAddLog = async (content: string) => {
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
      const saved = await saveLog(newLogData);
      setLogs([saved, ...logs]);
    } catch (err) {
      console.error("Save log failed", err);
      // Fallback to local if backend fails
      const localLog: LogEntry = { ...newLogData, id: Date.now().toString() };
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
      alert("生成失败，请检查后端连接或 API Key 配额。");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Only show header if logged in */}
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
              setViewMode('login'); // Requirement says: register -> login
              // Actually requirement says "returning to user login page after successful registration"
            }}
            onSwitchToLogin={() => setViewMode('login')}
          />
        )}

        {viewMode === 'login' && (
          <LoginView
            onLoginSuccess={(u) => {
              setUser(u);
              setViewMode('setup');
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

        {viewMode === 'dashboard' && (
          <DashboardView
            logs={logs}
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
              {config.apiKeyTested ? '已授权' : '待连接'}
            </span>
            <span className="opacity-50">|</span>
            <span className="text-primary font-black uppercase">{config.provider}: {config.modelName}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
