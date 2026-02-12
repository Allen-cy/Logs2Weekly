
import React, { useState, useMemo } from 'react';
import { LogEntry, LogType, LogStatus } from '../types';
import LogCard from './LogCard';
import { BarChart, Bar, ResponsiveContainer, XAxis, Cell } from 'recharts';

interface DashboardViewProps {
  logs: LogEntry[];
  onAddLog: (content: string) => void;
  onToggleStatus: (id: string) => void;
  onDeleteLog: (id: string) => void;
  onEditLog: (id: string, content: string) => void;
  onPostponeLog: (id: string) => void;
  onConvertToTask: (id: string) => void;
  onRevertToNote: (id: string) => void;
  availableTags: string[];
}

const DashboardView: React.FC<DashboardViewProps> = ({
  logs,
  onAddLog,
  onToggleStatus,
  onDeleteLog,
  onEditLog,
  onPostponeLog,
  onConvertToTask,
  onRevertToNote,
  availableTags
}) => {
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onAddLog(input);
    setInput('');
  };

  // 搜索过滤逻辑
  const filteredLogs = useMemo(() => {
    if (!searchQuery) return logs;
    const q = searchQuery.toLowerCase();
    return logs.filter(l =>
      l.content.toLowerCase().includes(q) ||
      l.tags.some(t => t.toLowerCase().includes(q))
    );
  }, [logs, searchQuery]);

  // 按日期和搜索结果过滤
  const todayLogs = useMemo(() => {
    const now = new Date();
    return filteredLogs.filter(l => {
      const d = new Date(l.timestamp);
      return d <= now;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [filteredLogs]);

  // Dynamic statistics
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
        {/* Search Bar */}
        <div className="relative group">
          <span className="material-icons absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">search</span>
          <input
            type="text"
            placeholder="搜索您的记录、任务或灵感..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] py-5 pl-14 pr-6 text-white text-sm focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-xl"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
            >
              <span className="material-icons text-sm">close</span>
            </button>
          )}
        </div>

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
                  placeholder="记录您的想法或任务 (例如: - [ ] 新任务)..."
                />
                <div className="px-4 py-3 bg-[#131b25] border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-500 text-xs italic">
                    <span className="material-icons text-sm">markdown</span>
                    支持 Markdown 格式
                  </div>
                  <button
                    type="submit"
                    className="bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                  >
                    <span className="material-icons text-[18px]">add_circle</span>
                    记录
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="material-icons text-primary">analytics</span>
              {searchQuery ? `搜索结果 (${todayLogs.length})` : "今日动态"}
            </h2>
          </div>
          {todayLogs.length === 0 ? (
            <div className="text-center py-20 bg-surface-dark/30 rounded-2xl border border-dashed border-slate-800">
              <p className="text-slate-500">No activities recorded for today yet.</p>
            </div>
          ) : (
            todayLogs.map((log) => (
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
        <div className="bg-surface-dark rounded-xl border border-slate-800 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-white mb-4">Weekly Progress</h3>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-background-dark border border-slate-800 text-center">
              <p className="text-2xl font-bold text-white">{stats.completed}</p>
              <p className="text-[10px] text-slate-500 uppercase font-bold mt-1">Done</p>
            </div>
            <div className="p-4 rounded-xl bg-background-dark border border-slate-800 text-center">
              <p className="text-2xl font-bold text-primary">{stats.completionRate}%</p>
              <p className="text-[10px] text-slate-500 uppercase font-bold mt-1">Rate</p>
            </div>
          </div>
          <div className="h-20 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartData}>
                <Bar dataKey="val">
                  {stats.chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 6 ? '#137fec' : '#137fec33'} />
                  ))}
                </Bar>
                <XAxis dataKey="day" hide />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surface-dark rounded-xl border border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Focus Tags</h3>
            <button className="text-slate-500 hover:text-white transition-colors"><span className="material-icons text-sm">settings</span></button>
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
