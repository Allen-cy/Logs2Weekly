
import React, { useMemo } from 'react';
import { WeeklySummary, LogEntry, LogStatus } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface ReviewViewProps {
  summary: WeeklySummary;
}

const COLORS = ['#137fec', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'];

const ReviewView: React.FC<ReviewViewProps> = ({ summary }) => {
  // 确保周报看板能反映真实数据的骨架（实际内容仍由AI生成）
  return (
    <div className="space-y-8 pb-20">
      <section className="bg-surface-dark rounded-2xl border border-slate-800 p-8 shadow-2xl relative overflow-hidden group">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-1000"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-lg shadow-primary/30">
              <span className="material-icons text-white text-2xl">auto_awesome</span>
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">AI Executive Summary</h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Calculated dynamically</p>
            </div>
          </div>

          <div className="prose prose-invert max-w-none">
            <p className="text-lg md:text-xl leading-relaxed text-slate-300 font-medium">
              {summary.executiveSummary.split('**').map((part, i) => 
                i % 2 === 1 ? <span key={i} className="text-primary font-black">{part}</span> : part
              )}
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-dark p-6 rounded-2xl border border-slate-800">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Items Completed</p>
          <h3 className="text-3xl font-black text-white">{summary.pulseStats.completed}</h3>
        </div>
        <div className="bg-surface-dark p-6 rounded-2xl border border-slate-800">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Deep Work Estimate</p>
          <h3 className="text-3xl font-black text-white">{summary.pulseStats.deepWorkHours}h</h3>
        </div>
        <div className="bg-surface-dark p-6 rounded-2xl border border-slate-800">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Growth Score</p>
          <h3 className="text-3xl font-black text-primary">A+</h3>
        </div>
        <div className="bg-surface-dark p-6 rounded-2xl border border-slate-800">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Streak</p>
          <div className="flex items-center gap-1 mt-2 text-warning">
             <span className="material-icons">local_fire_department</span>
             <span className="font-bold">4 Days</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 bg-surface-dark rounded-2xl border border-slate-800 p-6">
          <h3 className="text-lg font-bold text-white mb-6">Focus Areas</h3>
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
            <span className="material-icons text-primary">insights</span> Performance Highlights
          </h3>
          {summary.highlights.length === 0 ? (
            <div className="bg-surface-dark/50 border border-dashed border-slate-800 p-10 rounded-2xl text-center text-slate-500 italic">
              Record more meaningful logs to see AI-powered highlights here.
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
    </div>
  );
};

export default ReviewView;
