import React, { useState, useMemo, useEffect } from 'react';
import { LogEntry, LogType, LogStatus } from '../types';
import LogCard from './LogCard';
import { manualAggregate } from '../aiService';
import GreetingSection from './GreetingSection';
import ActivityHeatmap from './ActivityHeatmap';
import GanttView from './GanttView';

interface DashboardViewProps {
  logs: LogEntry[];
  user: any;
  onAddLog: (content: string) => void;
  onToggleStatus: (id: string) => void;
  onDeleteLog: (id: string) => void;
  onEditLog: (id: string, content: string) => void;
  onPostponeLog: (id: string) => void;
  onConvertToTask: (id: string) => void;
  onRevertToNote: (id: string) => void;
  onRefresh: () => void;
  availableTags: string[];
  onViewInbox: () => void;
  onViewArchive: () => void;
  retentionDays?: number;
  searchQuery: string;
  onSuggestTags?: (content: string) => Promise<string[]>;
}

const DashboardView: React.FC<DashboardViewProps> = ({
  logs,
  user,
  onAddLog,
  onToggleStatus,
  onDeleteLog,
  onEditLog,
  onPostponeLog,
  onConvertToTask,
  onRevertToNote,
  onRefresh,
  availableTags,
  onViewInbox,
  onViewArchive,
  retentionDays,
  searchQuery,
  onSuggestTags
}) => {
  const [input, setInput] = useState('');
  const [isAggregating, setIsAggregating] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [vizMode, setVizMode] = useState<'heatmap' | 'gantt'>('heatmap');
  const [timeView, setTimeView] = useState<'day' | 'week' | 'month'>('day');
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  // 桌面端全局快捷键唤起后自动聚焦
  useEffect(() => {
    if ((window as any).ipcRenderer) {
      const cleanup = (window as any).ipcRenderer.on('focus-add-log', () => {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      });
      return () => {
        if (typeof cleanup === 'function') cleanup();
      };
    }
  }, []);

  // 恢复草稿和指南状态
  useEffect(() => {
    const hasClosed = localStorage.getItem('hasClosedGuide');
    if (hasClosed === 'true') {
      setShowGuide(false);
    }
    if (user?.id) {
      const draft = localStorage.getItem(`draft_log_${user.id}`);
      if (draft) setInput(draft);
    }
  }, [user?.id]);

  // 自动保存草稿
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`draft_log_${user.id}`, input);
    }
  }, [input, user?.id]);

  const handleCloseGuide = () => {
    setShowGuide(false);
    localStorage.setItem('hasClosedGuide', 'true');
  };

  const handleSuggestTags = async () => {
    if (!input.trim() || !onSuggestTags) return;
    setIsSuggesting(true);
    try {
      const tags = await onSuggestTags(input);
      if (tags && tags.length > 0) {
        const tagStr = tags.map(t => `#${t}`).join(' ');
        setInput(prev => `${prev}\n\n${tagStr}`);
      }
    } catch (err) {
      console.error("Suggest tags failed", err);
    } finally {
      setIsSuggesting(false);
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onAddLog(input);
    setInput('');
    if (user?.id) {
      localStorage.removeItem(`draft_log_${user.id}`);
    }
  };

  const handleManualAggregate = async () => {
    if (!user?.id) return;
    setIsAggregating(true);
    try {
      const res = await manualAggregate(user.id);
      if (res.success) {
        alert("聚合成功！快去看看新鲜出炉的日报吧。");
        onRefresh();
      } else {
        alert(res.message || "聚合失败");
      }
    } catch (err) {
      alert("聚合请求出错");
    } finally {
      setIsAggregating(false);
    }
  };

  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [logs]);

  const inboxLogs = useMemo(() => {
    return sortedLogs.filter(l =>
      !l.is_processed &&
      !l.is_pinned &&
      l.type !== LogType.AI_SUGGESTION &&
      (l.type as any) !== 'summary'
    );
  }, [sortedLogs]);

  const mainLogs = useMemo(() => {
    let filtered = sortedLogs;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(l =>
        l.content.toLowerCase().includes(q) ||
        l.tags.some(t => t.toLowerCase().includes(q))
      );
    } else {
      filtered = filtered.filter(l => {
        const isSummary = (l.type as any) === 'summary';
        if (l.is_processed && !isSummary) return false;
        return true;
      });
      const now = new Date();
      if (timeView === 'day') {
        const today = new Date().toDateString();
        filtered = filtered.filter(l => new Date(l.timestamp).toDateString() === today);
      } else if (timeView === 'week') {
        const lastWeek = new Date();
        lastWeek.setDate(now.getDate() - 7);
        filtered = filtered.filter(l => new Date(l.timestamp) >= lastWeek);
      } else if (timeView === 'month') {
        const lastMonth = new Date();
        lastMonth.setMonth(now.getMonth() - 1);
        filtered = filtered.filter(l => new Date(l.timestamp) >= lastMonth);
      }
    }
    return filtered;
  }, [sortedLogs, searchQuery, timeView]);

  const stats = useMemo(() => {
    const completed = logs.filter(l => l.status === LogStatus.DONE).length;
    const tasks = logs.filter(l => l.type === LogType.TASK).length;
    const completionRate = tasks > 0 ? Math.round((completed / tasks) * 100) : 0;
    return { completed, completionRate };
  }, [logs]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 pb-24 lg:pb-0">
      <div className="lg:col-span-8 space-y-6 lg:space-y-8">
        <GreetingSection username={user?.username || 'User'} />

        {showGuide && !searchQuery && (
          <div className="bg-gradient-to-r from-blue-900/40 to-primary/20 border border-primary/30 rounded-2xl p-6 relative animate-in fade-in slide-in-from-top-4">
            <button
              onClick={handleCloseGuide}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              title="Don't show this again"
            >
              <span className="material-icons text-sm">close</span>
            </button>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/20 rounded-xl">
                <span className="material-icons text-primary text-2xl">auto_awesome</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">欢迎使用 AI 生产力中心！</h3>
                <p className="text-sm text-slate-300 mb-4 max-w-xl">
                  Log2Weekly 助您轻松捕捉灵感，并将其转化为结构化的洞察。
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-400 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-800 px-1.5 py-0.5 rounded text-white font-mono border border-slate-700">Cmd+Enter</span>
                    <span>快速提交</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-800 px-1.5 py-0.5 rounded text-white font-mono border border-slate-700">- [ ] 任务</span>
                    <span>创建待办</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-icons text-[14px] text-amber-500">inventory_2</span>
                    <span>每日 18:00 自动聚合</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <section>
          <div className="glass-panel rounded-2xl p-1 transition-all group focus-within:ring-2 focus-within:ring-primary/50">
            <div className="bg-surface-dark rounded-xl overflow-hidden">
              <form onSubmit={handleSubmit}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit(e);
                  }}
                  className="w-full bg-transparent border-0 text-base sm:text-lg p-4 sm:p-5 text-white placeholder-slate-500 focus:ring-0 resize-none min-h-[80px] sm:min-h-[100px]"
                  placeholder="随时捕捉您的想法、进度或灵感... (按 Cmd+Enter 快速记录)"
                />
                <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-[#131b25] border-t border-slate-800 flex items-center justify-between">
                  <div className="hidden sm:flex items-center gap-2 text-slate-500 text-xs italic">
                    <span className="material-icons text-sm">edit_note</span>
                    记录将暂存进右侧收纳盒
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleSuggestTags}
                      disabled={isSuggesting || !input.trim() || !onSuggestTags}
                      className="text-slate-400 hover:text-primary transition-all flex items-center gap-1 text-xs font-bold disabled:opacity-30"
                      title="AI 智能分析并提取标签"
                    >
                      <span className={`material-icons text-sm ${isSuggesting ? 'animate-spin' : ''}`}>{isSuggesting ? 'sync' : 'psychology'}</span>
                      {isSuggesting ? '分析中...' : 'AI 标签'}
                    </button>
                    <button
                      type="submit"
                      className="bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                    >
                      <span className="material-icons text-[18px]">bolt</span>
                      快速捕捉
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="material-icons text-primary">auto_awesome</span>
                {searchQuery ? `搜索结果 (${mainLogs.length})` : "汇总看板"}
              </h2>

              {!searchQuery && (
                <div className="flex bg-slate-900/40 p-1 rounded-xl border border-white/5">
                  <button onClick={() => setTimeView('day')} className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${timeView === 'day' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-slate-300'}`}>今日</button>
                  <button onClick={() => setTimeView('week')} className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${timeView === 'week' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-slate-300'}`}>本周</button>
                  <button onClick={() => setTimeView('month')} className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${timeView === 'month' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-slate-300'}`}>本月</button>
                </div>
              )}
            </div>
            {inboxLogs.length > 0 && (
              <button onClick={handleManualAggregate} disabled={isAggregating} className="text-xs text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 hover:bg-primary/20 transition-all flex items-center gap-1 disabled:opacity-50">
                <span className="material-icons text-sm">{isAggregating ? 'sync' : 'auto_fix_high'}</span>
                {isAggregating ? '正在生成汇报...' : '立即聚合收纳盒'}
              </button>
            )}
          </div>
          {mainLogs.length === 0 ? (
            <div className="text-center py-20 bg-surface-dark/30 rounded-2xl border border-dashed border-slate-800">
              <span className="material-icons text-4xl text-slate-700 mb-2">auto_stories</span>
              <p className="text-slate-500">今日暂无日报。去右侧“收纳盒”记录碎片想法？</p>
            </div>
          ) : (
            mainLogs.map((log) => (
              <LogCard key={log.id} log={log} onToggleStatus={() => onToggleStatus(log.id)} onDelete={() => onDeleteLog(log.id)} onEdit={(content) => onEditLog(log.id, content)} onPostpone={() => onPostponeLog(log.id)} onConvertToTask={() => onConvertToTask(log.id)} onRevertToNote={() => onRevertToNote(log.id)} />
            ))
          )}
        </section>
      </div>

      <aside className="lg:col-span-4 space-y-6">
        <div className="bg-surface-dark rounded-xl border border-slate-800 p-4 sm:p-5 shadow-sm max-h-[400px] lg:max-h-[500px] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 cursor-pointer hover:text-primary transition-colors" onClick={onViewInbox}>
              <span className="material-icons text-amber-500 text-sm">inventory_2</span>
              收纳盒 (Inbox)
            </h3>
            <button className="text-[10px] text-slate-500 font-bold hover:text-white" onClick={onViewInbox}>查看全部</button>
            <span className="bg-amber-500/20 text-amber-500 text-[10px] px-2 py-0.5 rounded-full font-bold ml-2">{inboxLogs.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
            {inboxLogs.length === 0 ? (
              <div className="text-center py-8"><p className="text-xs text-slate-600 italic">空空如也，捕捉点什么？</p></div>
            ) : (
              inboxLogs.map(log => (
                <div key={log.id} className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/50 group hover:border-slate-700 transition-all">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] text-slate-500 font-bold">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <button onClick={() => onDeleteLog(log.id)} className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-danger"><span className="material-icons text-[14px]">delete</span></button>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">{log.content}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <button onClick={onViewArchive} className="w-full bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-xl p-4 flex items-center justify-between group hover:bg-slate-800 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-primary/20 group-hover:text-primary transition-all"><span className="material-icons">inventory_2</span></div>
            <div className="text-left"><p className="text-xs font-bold text-white">已归档空间</p><p className="text-[10px] text-slate-500">回顾已处理的原始碎片</p></div>
          </div>
          <span className="material-icons text-slate-600 group-hover:text-primary transition-all">chevron_right</span>
        </button>

        <div className="bg-surface-dark rounded-xl border border-slate-800 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-white mb-4">本周进度</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-background-dark border border-slate-800 text-center"><p className="text-2xl font-bold text-white">{stats.completed}</p><p className="text-[10px] text-slate-500 uppercase font-bold mt-1">已完成</p></div>
            <div className="p-4 rounded-xl bg-background-dark border border-slate-800 text-center"><p className="text-2xl font-bold text-primary">{stats.completionRate}%</p><p className="text-[10px] text-slate-500 uppercase font-bold mt-1">完成率</p></div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800">
            <button onClick={() => setVizMode('heatmap')} className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${vizMode === 'heatmap' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}><span className="material-icons text-[14px]">calendar_view_month</span>活跃热力图</button>
            <button onClick={() => setVizMode('gantt')} className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${vizMode === 'gantt' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}><span className="material-icons text-[14px]">reorder</span>时间轴</button>
          </div>
          {vizMode === 'heatmap' ? <ActivityHeatmap logs={logs} /> : <GanttView logs={logs} />}
        </div>
      </aside>
    </div>
  );
};

export default DashboardView;
