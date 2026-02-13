import React, { useMemo } from 'react';
import { LogEntry } from '../types';

interface ActivityHeatmapProps {
    logs: LogEntry[];
}

const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ logs }) => {
    // Generate last 28 days (4 weeks)
    const days = useMemo(() => {
        const result = [];
        const today = new Date();
        // Normalize today to start of day
        today.setHours(0, 0, 0, 0);

        for (let i = 27; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const count = logs.filter(l => {
                const ld = new Date(l.timestamp);
                return ld.getDate() === d.getDate() &&
                    ld.getMonth() === d.getMonth() &&
                    ld.getFullYear() === d.getFullYear();
            }).length;
            result.push({ date: d, count });
        }
        return result;
    }, [logs]);

    const getColor = (count: number) => {
        if (count === 0) return 'bg-slate-800/50';
        if (count <= 2) return 'bg-primary/30'; // Light Blue
        if (count <= 5) return 'bg-primary/60';
        if (count <= 8) return 'bg-primary';
        return 'bg-orange-500'; // Intense
    };

    return (
        <div className="bg-surface-dark/90 rounded-xl border border-slate-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="material-icons text-orange-500 text-sm">local_fire_department</span>
                    Recent Intensity
                </h3>
                <span className="text-[10px] text-slate-500 font-medium">Last 28 days</span>
            </div>

            <div className="grid grid-cols-7 gap-2">
                {days.map((day, idx) => (
                    <div
                        key={idx}
                        className={`w-full aspect-square rounded-[4px] ${getColor(day.count)} transition-all hover:scale-110 cursor-help relative group`}
                    >
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10 shadow-lg border border-slate-700">
                            {day.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}: {day.count} logs
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4 flex items-center justify-end gap-2 text-[10px] text-slate-500">
                <span>Less</span>
                <div className="w-2 h-2 rounded-[2px] bg-slate-800/50"></div>
                <div className="w-2 h-2 rounded-[2px] bg-primary/30"></div>
                <div className="w-2 h-2 rounded-[2px] bg-primary/60"></div>
                <div className="w-2 h-2 rounded-[2px] bg-primary"></div>
                <div className="w-2 h-2 rounded-[2px] bg-orange-500"></div>
                <span>More</span>
            </div>
        </div>
    );
};

export default ActivityHeatmap;
