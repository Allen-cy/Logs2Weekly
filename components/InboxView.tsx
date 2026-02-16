import React, { useState } from 'react';
import { LogEntry, LogStatus, LogType } from '../types';
import LogCard from './LogCard';

interface InboxViewProps {
    logs: LogEntry[];
    onDeleteLog: (id: string) => void;
    onUpdateLogStatus: (id: string, status: LogStatus) => void;
    onEditLog: (id: string, content: string) => void;
    onBack: () => void;
    retentionDays: number;
}

const InboxView: React.FC<InboxViewProps> = ({
    logs,
    onDeleteLog,
    onUpdateLogStatus,
    onEditLog,
    onBack,
    retentionDays
}) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredLogs = logs.filter(log =>
        !log.is_processed &&
        log.type !== LogType.AI_SUGGESTION && // 排除建议
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
                            收纳盒
                            <span className="px-3 py-1 bg-primary/20 text-primary text-xs rounded-full border border-primary/20">
                                {logs.length} 条记录
                            </span>
                        </h1>
                        <p className="text-slate-500 text-sm font-medium mt-1">
                            记录您的所有灵感与碎片。默认保留 {retentionDays} 天记录。
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
                        placeholder="搜索碎片记录..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-slate-900/40 border border-white/5 rounded-2xl py-3 pl-12 pr-6 text-sm text-white focus:outline-none focus:border-primary/50 focus:bg-slate-900/60 transition-all w-64 md:w-80"
                    />
                </div>
            </div>

            {/* Logs Grid/List */}
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
                        <span className="material-icons text-slate-600 text-3xl">inbox</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">
                        {searchQuery ? '未找到匹配结果' : '收纳盒空空如也'}
                    </h3>
                    <p className="text-slate-500 text-sm max-w-xs mx-auto">
                        {searchQuery ? '请尝试更换搜索词再次查找' : '捕获的琐事、灵感或任务将出现在这里'}
                    </p>
                </div>
            )}

            {/* Footer / Tip */}
            <div className="mt-12 p-6 bg-slate-900/40 border border-white/5 rounded-3xl flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-icons text-xl">auto_delete</span>
                </div>
                <div className="flex-1">
                    <h4 className="text-sm font-bold text-white">智慧留存策略</h4>
                    <p className="text-xs text-slate-500">
                        系统将根据您的设置，在 {retentionDays} 天后自动清理已处理的旧记录。您可以在个人中心随时调整。
                    </p>
                </div>
            </div>
        </div>
    );
};

export default InboxView;
