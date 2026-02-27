
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
  searchQuery
}) => {
  const [input, setInput] = useState('');
  const [isAggregating, setIsAggregating] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [vizMode, setVizMode] = useState<'heatmap' | 'gantt'>('heatmap');
  const [timeView, setTimeView] = useState<'day' | 'week' | 'month'>('day');

  useEffect(() => {
    const hasClosed = localStorage.getItem('hasClosedGuide');
    if (hasClosed === 'true') {
      setShowGuide(false);
    }
  }, []);

  const handleCloseGuide = () => {
    setShowGuide(false);
    localStorage.setItem('hasClosedGuide', 'true');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onAddLog(input);
    setInput('');
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

  // 排序逻辑：置顶记录置于最顶端，其余按时间倒序
  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [logs]);

  // 收纳盒：仅展示未处理的碎片记录，排除置顶记录
  const inboxLogs = useMemo(() => {
    return sortedLogs.filter(l =>
      !l.is_processed &&
      !l.is_pinned &&
      l.type !== LogType.AI_SUGGESTION &&
      (l.type as any) !== 'summary'
    );
  }, [sortedLogs]);

  // 主区域：隐藏已处理的琐碎记录，仅展示未处理记录和“日报(Summary)”
  const mainLogs = useMemo(() => {
    let filtered = sortedLogs;

    // 搜索模式
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(l =>
        l.content.toLowerCase().includes(q) ||
        l.tags.some(t => t.toLowerCase().includes(q))
      );
    } else {
      // 正常模式：过滤掉【已处理】且【不是日报】的记录
      filtered = filtered.filter(l => {
        const isSummary = (l.type as any) === 'summary';
        // 如果是已处理的普通记录，隐藏它
        if (l.is_processed && !isSummary) return false;
        return true;
      });

      // 时间维度过滤
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

  // 统计
  const stats = useMemo(() => {
    const completed = logs.filter(l => l.status === LogStatus.DONE).length;
    const tasks = logs.filter(l => l.type === LogType.TASK).length;
    const completionRate = tasks > 0 ? Math.round((completed / tasks) * 100) : 0;

    return { completed, completionRate };
  }, [logs]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-24 lg:pb-0">
      <div className="lg:col-span-8 space-y-8">
        <GreetingSection username={user?.username || 'User'} />


        {/* Pinned User Guide */}
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

        {/* 无压快记输入 */}
        <section>
          <div className="glass-panel rounded-2xl p-1 transition-all group focus-within:ring-2 focus-within:ring-primary/50">
            <div className="bg-surface-dark rounded-xl overflow-hidden">
              <form onSubmit={handleSubmit}>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit(e);
                  }}
                  className="w-full bg-transparent border-0 text-lg p-5 text-white placeholder-slate-500 focus:ring-0 resize-none min-h-[100px]"
                  placeholder="随时捕捉您的想法、进度或灵感... (按 Cmd+Enter 快速记录)"
                />
                <div className="px-4 py-3 bg-[#131b25] border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-500 text-xs italic">
                    <span className="material-icons text-sm">edit_note</span>
                    记录将暂存进右侧收纳盒
                  </div>
                  <button
                    type="submit"
                    className="bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                  >
                    <span className="material-icons text-[18px]">bolt</span>
                    快速捕捉
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* 主看板 */}
        <section className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="material-icons text-primary">auto_awesome</span>
                {searchQuery ? `搜索结果 (${mainLogs.length})` : "汇总看板"}
              </h2>

              {!searchQuery && (
                <div className="flex bg-slate-900/40 p-1 rounded-xl border border-white/5">
                  <button
                    onClick={() => setTimeView('day')}
                    className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${timeView === 'day' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    今日
                  </button>
                  <button
                    onClick={() => setTimeView('week')}
                    className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${timeView === 'week' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    本周
                  </button>
                  <button
                    onClick={() => setTimeView('month')}
                    className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${timeView === 'month' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    本月
                  </button>
                </div>
              )}
            </div>

            {inboxLogs.length > 0 && (
              <button
                onClick={handleManualAggregate}
                disabled={isAggregating}
                className="text-xs text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 hover:bg-primary/20 transition-all flex items-center gap-1 disabled:opacity-50"
              >
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
              <LogCard
                key={log.id}
                log={log}
                onToggleStatus={() => onToggleStatus(log.id)}
                onDelete={() => onDeleteLog(log.id)}
                onEdit={(content) => onEditLog(log.id, content)}
                onPostpone={() => onPostponeLog(log.id)}
                onConvertToTask={() => onConvertToTask(log.id)}
                onRevertToNote={() => onRevertToNote(log.id)}
              />
            ))
          )}
        </section>
      </div>

      <aside className="lg:col-span-4 space-y-6">
        {/* 收纳盒 (Inbox) */}
        <div className="bg-surface-dark rounded-xl border border-slate-800 p-5 shadow-sm max-h-[500px] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 cursor-pointer hover:text-primary transition-colors" onClick={onViewInbox}>
              <span className="material-icons text-amber-500 text-sm">inventory_2</span>
              收纳盒 (Inbox)
            </h3>
            <button className="text-[10px] text-slate-500 font-bold hover:text-white" onClick={onViewInbox}>
              查看全部
            </button>
            <span className="bg-amber-500/20 text-amber-500 text-[10px] px-2 py-0.5 rounded-full font-bold ml-2">
              {inboxLogs.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
            {inboxLogs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xs text-slate-600 italic">空空如也，捕捉点什么？</p>
              </div>
            ) : (
              inboxLogs.map(log => (
                <div key={log.id} className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/50 group hover:border-slate-700 transition-all">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] text-slate-500 font-bold">
                      {(() => {
                        const date = new Date(log.timestamp);
                        const now = new Date();
                        const isToday = date.toDateString() === now.toDateString();
                        return isToday
                          ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : `${date.getMonth() + 1}-${date.getDate().toString().padStart(2, '0')} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                      })()}
                    </span>
                    <button onClick={() => onDeleteLog(log.id)} className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-danger">
                      <span className="material-icons text-[14px]">delete</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">{log.content}</p>
                </div>
              ))
            )}
          </div>
          <p className="mt-4 text-[10px] text-slate-500 text-center italic">
            碎片会在此堆积，每日 18:00 定时清理聚合
          </p>
        </div>

        {/* 已归档便捷入口 */}
        <button
          onClick={onViewArchive}
          className="w-full bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-xl p-4 flex items-center justify-between group hover:bg-slate-800 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-primary/20 group-hover:text-primary transition-all">
              <span className="material-icons">inventory_2</span>
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-white">已归档空间</p>
              <p className="text-[10px] text-slate-500">回顾已处理的原始碎片</p>
            </div>
          </div>
          <span className="material-icons text-slate-600 group-hover:text-primary transition-all">chevron_right</span>
        </button>

        {/* 数据进度 */}
        <div className="bg-surface-dark rounded-xl border border-slate-800 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-white mb-4">本周进度</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-background-dark border border-slate-800 text-center">
              <p className="text-2xl font-bold text-white">{stats.completed}</p>
              <p className="text-[10px] text-slate-500 uppercase font-bold mt-1">已完成</p>
            </div>
            <div className="p-4 rounded-xl bg-background-dark border border-slate-800 text-center">
              <p className="text-2xl font-bold text-primary">{stats.completionRate}%</p>
              <p className="text-[10px] text-slate-500 uppercase font-bold mt-1">完成率</p>
            </div>
          </div>
        </div>

        {/* Multi-dimension Visualization */}
        <div className="space-y-4">
          <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setVizMode('heatmap')}
              className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${vizMode === 'heatmap' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <span className="material-icons text-[14px]">calendar_view_month</span>
              活跃热力图
            </button>
            <button
              onClick={() => setVizMode('gantt')}
              className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${vizMode === 'gantt' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <span className="material-icons text-[14px]">reorder</span>
              时间轴
            </button>
          </div>

          {vizMode === 'heatmap' ? (
            <ActivityHeatmap logs={logs} />
          ) : (
            <GanttView logs={logs} />
          )}
        </div>

        {/* Top Contexts */}
        <div className="bg-surface-dark rounded-xl border border-slate-800 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-white mb-4">专注领域</h3>
          <div className="space-y-3">
            {useMemo(() => {
              const tagCounts: Record<string, number> = {};
              logs.forEach(log => {
                log.tags.forEach(tag => {
                  tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                });
              });
              return Object.entries(tagCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);
            }, [logs]).map(([tag, count], index) => (
              <div key={tag} className="flex items-center justify-between text-xs group cursor-pointer hover:bg-white/5 p-1 -mx-1 rounded">
                <span className="flex items-center gap-2 text-slate-300 group-hover:text-primary transition-colors">
                  <span className={`w-2 h-2 rounded-full ${['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500', 'bg-green-500'][index % 5]}`}></span>
                  #{tag}
                </span>
                <span className="text-slate-500 font-mono group-hover:text-white transition-colors">{count} 条记录</span>
              </div>
            ))}
            {logs.length === 0 && <p className="text-slate-600 italic text-xs">暂无标签。在日志中使用 #打标签 ！</p>}
          </div>
        </div>
      </aside>

    </div>
  );
};

export default DashboardView;
