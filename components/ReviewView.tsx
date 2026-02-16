
import React, { useMemo } from 'react';
import { WeeklySummary, LogEntry, LogStatus, User } from '../types';
import { API_BASE_URL } from '../aiService';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface ReviewViewProps {
  summary: WeeklySummary;
  user?: User | null;
  isReadOnly?: boolean;
}

const COLORS = ['#137fec', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'];

const ReviewView: React.FC<ReviewViewProps> = ({ summary, user, isReadOnly = false }) => {
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'success' | 'error'>('idle');

  const handleSaveToHistory = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          title: `${new Date().toLocaleDateString('zh-CN')} 周总结报告`,
          content: summary,
          start_date: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
          end_date: new Date().toISOString().split('T')[0]
        })
      });
      if (response.ok) {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
      }
    } catch (err) {
      console.error("Save failed", err);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyMarkdown = () => {
    const md = `
# AI 执行摘要
${summary.executiveSummary}

## 核心指标
- 已完成任务: ${summary.pulseStats.completed}
- 深度工作时间: ${summary.pulseStats.deepWorkHours}h

## 本周重点
${summary.highlights.map(h => `### ${h.title} (${h.category})\n${h.description}`).join('\n\n')}

## 下周建议
${summary.nextWeekSuggestions?.map(s => `- ${s}`).join('\n')}
    `.trim();

    navigator.clipboard.writeText(md);
    alert("Markdown 已复制到剪贴板");
  };

  return (
    <div className="space-y-8 pb-20">
      {!isReadOnly && !summary.executiveSummary.includes("暂无周报") && (
        <div className="flex justify-end gap-3 mb-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <button
            onClick={handleCopyMarkdown}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-bold border border-slate-700 transition-all"
          >
            <span className="material-icons text-sm">content_copy</span>
            复制 Markdown
          </button>
          <button
            onClick={handleSaveToHistory}
            disabled={isSaving || saveStatus === 'success'}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg ${saveStatus === 'success'
              ? 'bg-success text-white'
              : 'bg-primary hover:bg-primary-hover text-white shadow-primary/20'
              }`}
          >
            <span className="material-icons text-sm">
              {isSaving ? 'sync' : saveStatus === 'success' ? 'check_circle' : 'inventory_2'}
            </span>
            {isSaving ? '正在保存...' : saveStatus === 'success' ? '已存入历史' : '保存到历史'}
          </button>
        </div>
      )}
      <section className="bg-surface-dark rounded-2xl border border-slate-800 p-8 shadow-2xl relative overflow-hidden group">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-1000"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-lg shadow-primary/30">
              <span className="material-icons text-white text-2xl">auto_awesome</span>
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">AI 执行摘要</h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">系统动态计算生成</p>
            </div>
          </div>

          <div className="prose prose-invert max-w-none">
            {(!summary.executiveSummary || summary.executiveSummary.includes("暂无周报")) ? (
              <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-700/50 text-slate-400">
                <p className="mb-4">您还没有生成本周的总结。点击顶部的 <strong>REGENERATE SUMMARY</strong> 按钮即可生成 AI 深度周报。</p>
              </div>
            ) : (
              <p className="text-lg md:text-xl leading-relaxed text-slate-300 font-medium">
                {summary.executiveSummary.split('**').map((part, i) =>
                  i % 2 === 1 ? <span key={i} className="text-primary font-black">{part}</span> : part
                )}
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-dark p-6 rounded-2xl border border-slate-800">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">已完成记录</p>
          <h3 className="text-3xl font-black text-white">{summary.pulseStats.completed}</h3>
        </div>
        <div className="bg-surface-dark p-6 rounded-2xl border border-slate-800">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">深度工作建议</p>
          <h3 className="text-3xl font-black text-white">{summary.pulseStats.deepWorkHours}h</h3>
        </div>
        <div className="bg-surface-dark p-6 rounded-2xl border border-slate-800">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">成长指数</p>
          <h3 className="text-3xl font-black text-primary">A+</h3>
        </div>
        <div className="bg-surface-dark p-6 rounded-2xl border border-slate-800">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">连续打卡</p>
          <div className="flex items-center gap-1 mt-2 text-warning">
            <span className="material-icons">local_fire_department</span>
            <span className="font-bold">4 天</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 bg-surface-dark rounded-2xl border border-slate-800 p-6">
          <h3 className="text-lg font-bold text-white mb-6">专注领域分配</h3>
          <div className="h-64 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={summary.focusAreas}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="percentage"
                >
                  {summary.focusAreas.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#16202c', border: '1px solid #2a3b4d', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <span className="material-icons text-primary">pie_chart</span>
            </div>
          </div>
          <div className="space-y-3 mt-4">
            {summary.focusAreas.map((area, idx) => (
              <div key={area.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                  <span className="text-sm font-medium text-slate-300">{area.name}</span>
                </div>
                <span className="text-sm font-black text-white">{area.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <span className="material-icons text-primary">insights</span> 本周高光表现
          </h3>
          {summary.highlights.length === 0 ? (
            <div className="bg-surface-dark/50 border border-dashed border-slate-800 p-10 rounded-2xl text-center text-slate-500 italic">
              记录更多有意义的日志，AI 将为您在这里提取高光时刻。
            </div>
          ) : (
            summary.highlights.map((item, idx) => (
              <div key={idx} className="glass-panel p-5 rounded-2xl flex gap-4 hover:border-primary/30 transition-all">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-primary border border-slate-700">
                  <span className="material-icons">{item.icon}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{item.category} • {item.timestamp}</span>
                  </div>
                  <h4 className="font-bold text-white mb-1">{item.title}</h4>
                  <p className="text-sm text-slate-400 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {summary.nextWeekSuggestions && summary.nextWeekSuggestions.length > 0 && (
        <section className="bg-gradient-to-r from-surface-dark to-slate-900 rounded-2xl border border-slate-800 p-8 shadow-2xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center text-success">
              <span className="material-icons">rocket_launch</span>
            </div>
            <div>
              <h3 className="text-xl font-black text-white">下周重点建议</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">AI 智能分析预测</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {summary.nextWeekSuggestions.map((suggestion, idx) => (
              <div key={idx} className="bg-slate-800/30 border border-slate-700/50 p-4 rounded-xl flex gap-3 items-start hover:border-success/30 transition-all">
                <div className="mt-1 w-5 h-5 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                </div>
                <p className="text-sm text-slate-300 font-medium leading-relaxed">{suggestion}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ReviewView;
