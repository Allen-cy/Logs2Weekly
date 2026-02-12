
import React, { useState, useMemo } from 'react';
import { LogEntry, LogType, LogStatus } from '../types';
import LogCard from './LogCard';
import { BarChart, Bar, ResponsiveContainer, XAxis, Cell } from 'recharts';
import { manualAggregate } from '../aiService';

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
  availableTags
}) => {
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAggregating, setIsAggregating] = useState(false);

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

  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [logs]);

  // 收纳盒：未处理的碎片记录
  const inboxLogs = useMemo(() => {
    return sortedLogs.filter(l => !l.is_processed && l.type !== LogType.AI_SUGGESTION && (l.type as any) !== 'summary');
  }, [sortedLogs]);

  // 主区域：日报或历史轨迹
  const mainLogs = useMemo(() => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return sortedLogs.filter(l =>
        l.content.toLowerCase().includes(q) ||
        l.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    // 默认展示日报和已转化的重点
    return sortedLogs.filter(l => l.is_processed || l.type === LogType.AI_SUGGESTION || (l.type as any) === 'summary');
  }, [sortedLogs, searchQuery]);

  // 统计
  const stats = useMemo(() => {
    const completed = logs.filter(l => l.status === LogStatus.DONE).length;
    const tasks = logs.filter(l => l.type === LogType.TASK).length;
    const completionRate = tasks > 0 ? Math.round((completed / tasks) * 100) : 0;

    const chartData = Array.from({ length: 7 }).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dayLabel = ['S', 'M', 'T', 'W', 'T', 'F', 'S'][date.getDay()];
      const count = logs.filter(l => new Date(l.timestamp).toDateString() === date.toDateString()).length;
      return { day: dayLabel, val: Math.max(count, 0.2) };
    });

    return { completed, completionRate, chartData };
  }, [logs]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-8 space-y-8">
        {/* 顶部搜索 */}
        <div className="relative group">
          <span className="material-icons absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">search</span>
          <input
            type="text"
            placeholder="搜索您的记录、日报或关键词..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] py-5 pl-14 pr-6 text-white text-sm focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-xl"
          />
        </div>

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
                    记录将暂存进收纳盒
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="material-icons text-primary">auto_awesome</span>
              {searchQuery ? `搜索结果 (${mainLogs.length})` : "每日洞察 & 已聚合日报"}
            </h2>
            {inboxLogs.length > 0 && (
              <button
                onClick={handleManualAggregate}
                disabled={isAggregating}
                className="text-xs text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 hover:bg-primary/20 transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <span className="material-icons text-sm">{isAggregating ? 'sync' : 'auto_fix_high'}</span>
                {isAggregating ? '正在生成回报...' : '立即聚合收纳盒'}
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
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="material-icons text-amber-500 text-sm">inventory_2</span>
              收纳盒 (Inbox)
            </h3>
            <span className="bg-amber-500/20 text-amber-500 text-[10px] px-2 py-0.5 rounded-full font-bold">
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
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
          {inboxLogs.length > 0 && (
            <p className="mt-4 text-[10px] text-slate-500 text-center italic">会在 18:00 自动整理并将聚合结果存入看板</p>
          )}
        </div>

        {/* 数据进度 */}
        <div className="bg-surface-dark rounded-xl border border-slate-800 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-white mb-4">Weekly Progress</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-background-dark border border-slate-800 text-center">
              <p className="text-2xl font-bold text-white">{stats.completed}</p>
              <p className="text-[10px] text-slate-500 uppercase font-bold mt-1">Done</p>
            </div>
            <div className="p-4 rounded-xl bg-background-dark border border-slate-800 text-center">
              <p className="text-2xl font-bold text-primary">{stats.completionRate}%</p>
              <p className="text-[10px] text-slate-500 uppercase font-bold mt-1">Rate</p>
            </div>
          </div>
        </div>

        {/* 标签 */}
        <div className="bg-surface-dark rounded-xl border border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Focus Tags</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableTags.map(tag => (
              <span key={tag} className="px-2 py-1 rounded-md bg-slate-800 text-slate-400 text-[11px] font-bold border border-slate-700">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
};

export default DashboardView;
