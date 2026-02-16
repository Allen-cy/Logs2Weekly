import React, { useMemo } from 'react';
import { LogEntry, LogType, LogStatus } from '../types';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

interface InsightsViewProps {
    logs: LogEntry[];
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const InsightsView: React.FC<InsightsViewProps> = ({ logs }) => {
    // 1. 标签分布统计 (基于 Done 的任务或所有日志)
    const tagData = useMemo(() => {
        const counts: Record<string, number> = {};
        logs.forEach(log => {
            if (log.tags && log.tags.length > 0) {
                log.tags.forEach(tag => {
                    counts[tag] = (counts[tag] || 0) + 1;
                });
            } else {
                counts['未分类'] = (counts['未分类'] || 0) + 1;
            }
        });

        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6);
    }, [logs]);

    // 2. 最近 7 天趋势统计
    const trendData = useMemo(() => {
        const last7Days = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
        });

        const stats = last7Days.reduce((acc, date) => {
            acc[date] = { date, completed: 0, total: 0 };
            return acc;
        }, {} as Record<string, any>);

        logs.forEach(log => {
            const dateStr = new Date(log.timestamp).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
            if (stats[dateStr]) {
                stats[dateStr].total += 1;
                if (log.type === LogType.TASK && log.status === LogStatus.DONE) {
                    stats[dateStr].completed += 1;
                }
            }
        });

        return Object.values(stats);
    }, [logs]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight">数据洞察 <span className="text-primary">INSIGHTS</span></h2>
                    <p className="text-slate-400 mt-1 font-medium">透视你的生产力规律与精力分配</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 标签分布 (Pie Chart) */}
                <div className="bg-surface-dark/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <span className="w-2 h-6 bg-primary rounded-full"></span>
                        领域平衡 (标签分布)
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={tagData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {tagData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 生产力趋势 (Bar Chart) */}
                <div className="bg-surface-dark/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <span className="w-2 h-6 bg-success rounded-full"></span>
                        产出活力 (最近7天)
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    cursor={{ fill: '#1e293b', opacity: 0.4 }}
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff' }}
                                />
                                <Bar dataKey="completed" name="已完成任务" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar dataKey="total" name="总记录数" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} opacity={0.3} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* 建议卡片 (可以根据数据生成一些简单的 Insight) */}
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-3xl p-6">
                <div className="flex items-start gap-4">
                    <div className="bg-indigo-500 p-3 rounded-2xl shadow-lg shadow-indigo-500/20">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <div>
                        <h4 className="text-xl font-bold text-white">智能建议</h4>
                        <p className="text-slate-400 mt-2 leading-relaxed">
                            基于过去一周的数据分析，你在 <span className="text-primary font-bold">{tagData[0]?.name || '默认'}</span> 领域的投入最活跃。
                            建议在本周末进行一次深度复盘，看看哪些重复性的任务可以被进一步自动化。
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InsightsView;
