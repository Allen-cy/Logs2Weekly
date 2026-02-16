import React, { useState } from 'react';
import { LogEntry, LogStatus, LogType } from '../types';
import LogCard from './LogCard';

interface ArchiveViewProps {
    logs: LogEntry[];
    onDeleteLog: (id: string) => void;
    onUpdateLogStatus: (id: string, status: LogStatus) => void;
    onEditLog: (id: string, content: string) => void;
    onBack: () => void;
    retentionDays: number;
}

const ArchiveView: React.FC<ArchiveViewProps> = ({
    logs,
    onDeleteLog,
    onUpdateLogStatus,
    onEditLog,
    onBack,
    retentionDays
}) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredLogs = logs.filter(log =>
        log.is_processed && // 必须是已处理的
        log.type !== LogType.AI_SUGGESTION && // 排除建议（因为日报在主界面展示）
        (l => (l.type as any) !== 'summary')(log) &&
        (log.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
    );

    return (
        <div className="max-w-5xl mx-auto px-6 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Area */}
            <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-6">
                    <button
                        onClick={onBack}
                        className="w-12 h-12 rounded-2xl bg-slate-800/50 hover:bg-slate-700/50 text-white flex items-center justify-center transition-all group"
                    >
                        <span className="material-icons group-hover:-translate-x-1 transition-transform">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                            已归档空间
                            <span className="px-3 py-1 bg-slate-800/50 text-slate-400 text-xs rounded-full border border-white/5">
                                {filteredLogs.length} 条已处理
                            </span>
                        </h1>
                        <p className="text-slate-500 text-sm font-medium mt-1">
                            此处存放已聚合的原始记录。默认保留 {retentionDays} 天以供查阅。
                        </p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <span className="material-icons text-slate-500 text-base group-focus-within:text-primary transition-colors">search</span>
                    </div>
                    <input
                        type="text"
                        placeholder="搜索归档记录..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-slate-900/40 border border-white/5 rounded-2xl py-3 pl-12 pr-6 text-sm text-white focus:outline-none focus:border-primary/50 focus:bg-slate-900/60 transition-all w-64 md:w-80"
                    />
                </div>
            </div>

            {/* Logs List */}
            {filteredLogs.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                    {filteredLogs.map(log => (
                        <LogCard
                            key={log.id}
                            log={log}
                            onDelete={() => onDeleteLog(log.id)}
                            onToggleStatus={() => onUpdateLogStatus(log.id, log.status === LogStatus.DONE ? LogStatus.IN_PROGRESS : LogStatus.DONE)}
                            onEdit={(content) => onEditLog(log.id, content)}
                            onPostpone={() => { }}
                            onConvertToTask={() => onUpdateLogStatus(log.id, LogStatus.IN_PROGRESS)}
                            onRevertToNote={() => onUpdateLogStatus(log.id, LogStatus.PENDING)}
                        />
                    ))}
                </div>
            ) : (
                <div className="py-32 text-center bg-slate-900/20 rounded-[2.5rem] border border-dashed border-white/5">
                    <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <span className="material-icons text-slate-600 text-3xl">inventory_2</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">
                        {searchQuery ? '未找到匹配结果' : '暂无归档数据'}
                    </h3>
                    <p className="text-slate-500 text-sm max-w-xs mx-auto">
                        {searchQuery ? '请尝试更换搜索词' : '当碎片记录完成聚合后，它们将安全地存放到这里'}
                    </p>
                </div>
            )}

            {/* Safety Tip */}
            <div className="mt-12 p-6 bg-slate-900/40 border border-white/5 rounded-3xl flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <span className="material-icons text-xl">verified_user</span>
                </div>
                <div className="flex-1">
                    <h4 className="text-sm font-bold text-white">长效数据资产保护</h4>
                    <p className="text-xs text-slate-500">
                        聚合后的日报（Summary）和归档记录将按您的设定长期保留。我们不会清理任何未处理的原始碎片记录。
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ArchiveView;
