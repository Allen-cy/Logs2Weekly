import React from 'react';
import { LogEntry, LogType, LogStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface GanttViewProps {
    logs: LogEntry[];
}

const GanttView: React.FC<GanttViewProps> = ({ logs }) => {
    // Filter only tasks for Gantt view
    const tasks = logs.filter(l => l.type === LogType.TASK);

    const data = tasks.map(task => {
        const date = new Date(task.timestamp);
        return {
            name: task.content.length > 20 ? task.content.substring(0, 20) + '...' : task.content,
            fullName: task.content,
            start: date.getTime(),
            // For a simple Gantt, we use 1 hour duration if no end date
            end: date.getTime() + 3600000,
            status: task.status,
            dateStr: date.toLocaleDateString()
        };
    }).sort((a, b) => a.start - b.start).slice(0, 10); // Show latest 10 tasks

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl text-xs">
                    <p className="font-bold text-white mb-1">{data.fullName}</p>
                    <p className="text-slate-400">日期: {data.dateStr}</p>
                    <p className="text-slate-400">状态: <span className={data.status === LogStatus.DONE ? 'text-success' : 'text-warning'}>{data.status === LogStatus.DONE ? '已完成' : '进行中'}</span></p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-surface-dark/90 rounded-xl border border-slate-800 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="material-icons text-primary text-sm">reorder</span>
                    任务时间轴 (甘特图)
                </h3>
                <span className="text-[10px] text-slate-500 font-medium">最近10项任务</span>
            </div>

            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                        <XAxis
                            type="number"
                            hide
                            domain={['dataMin', 'dataMax']}
                        />
                        <YAxis
                            dataKey="name"
                            type="category"
                            width={100}
                            stroke="#64748b"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                        <Bar
                            dataKey="end"
                            radius={[4, 4, 4, 4]}
                            barSize={12}
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.status === LogStatus.DONE ? '#10b981' : '#3b82f6'}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 flex items-center gap-4 text-[10px]">
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <span className="text-slate-400">进行中</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-success"></div>
                    <span className="text-slate-400">已完成</span>
                </div>
            </div>
        </div>
    );
};

export default GanttView;
