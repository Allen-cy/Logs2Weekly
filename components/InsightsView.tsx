import React, { useMemo } from 'react';
import { LogEntry, LogType, LogStatus } from '../types';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Radar, RadarChart, PolarGrid, PolarAngleAxis
} from 'recharts';

interface InsightsViewProps {
    logs: LogEntry[];
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const InsightsView: React.FC<InsightsViewProps> = ({ logs }) => {
    // 1. 标签分布统计
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

    // 3. 领域雷达图 (Domain Balance)
    const radarData = useMemo(() => {
        const categories: Record<string, number> = {};
        logs.forEach(log => {
            log.tags.forEach(tag => {
                categories[tag] = (categories[tag] || 0) + 1;
            });
        });

        const topTags = Object.entries(categories)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        const max = Math.max(...topTags.map(t => t[1]), 1);
        return topTags.map(([subject, count]) => ({
            subject,
            A: Math.round((count / max) * 100),
            fullMark: 100
        }));
    }, [logs]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight">数据洞察 <span className="text-primary">INSIGHTS</span></h2>
                    <p className="text-slate-400 mt-1 font-medium">透视你的生产力规律与精力分配</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 标签分布 (Pie Chart) */}
                <div className="bg-surface-dark/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
                    <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-4 bg-primary rounded-full"></span>
                        领域平衡 (分布)
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
                    <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-4 bg-success rounded-full"></span>
                        产出活力 (趋势)
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip
                                    cursor={{ fill: '#1e293b', opacity: 0.4 }}
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff' }}
                                />
                                <Bar dataKey="completed" name="已完成" fill="#10b981" radius={[4, 4, 0, 0]} barSize={15} />
                                <Bar dataKey="total" name="总数" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={15} opacity={0.3} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 生产力画像 (Radar Chart) */}
                <div className="bg-surface-dark/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
                    <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-4 bg-purple-500 rounded-full"></span>
                        效率平衡 (雷达)
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                <PolarGrid stroke="#334155" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                <Radar
                                    name="强度"
                                    dataKey="A"
                                    stroke="#8b5cf6"
                                    fill="#8b5cf6"
                                    fillOpacity={0.6}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff' }}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="bg-primary/10 border border-primary/20 rounded-3xl p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                    <span className="material-icons text-7xl text-primary">auto_awesome</span>
                </div>
                <div className="flex items-start gap-6 relative z-10">
                    <div className="bg-primary p-4 rounded-2xl shadow-xl shadow-primary/20">
                        <span className="material-icons text-white">psychology</span>
                    </div>
                    <div>
                        <h4 className="text-xl font-bold text-white">AI 效能洞察</h4>
                        <p className="text-slate-400 mt-2 leading-relaxed max-w-2xl">
                            基于最近 7 天的分析，您的生产力高峰主要集中在 <span className="text-primary font-bold">{radarData[0]?.subject || '记录'}</span> 领域。
                            整体任务完成率为 <span className="text-success font-bold">{Math.round((logs.filter(l => l.status === LogStatus.DONE).length / (logs.length || 1)) * 100)}%</span>。
                            保持这种节奏，并关注薄弱环节。
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InsightsView;
