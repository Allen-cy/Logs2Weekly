import React, { useState, useEffect } from 'react';
import { Report, User, WeeklySummary } from '../types';
import { API_BASE_URL } from '../aiService';
import ReviewView from './ReviewView';

interface ReportHistoryViewProps {
    user: User;
}

const ReportHistoryView: React.FC<ReportHistoryViewProps> = ({ user }) => {
    const [reports, setReports] = useState<Report[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/reports?user_id=${user.id}`);
                const data = await response.json();
                setReports(data || []);
            } catch (err) {
                console.error("Failed to fetch reports", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchReports();
    }, [user.id]);

    const handleDelete = async (id: number) => {
        if (!window.confirm("确定要删除这份周报存档吗？")) return;
        try {
            const response = await fetch(`${API_BASE_URL}/reports/${id}?user_id=${user.id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                setReports(prev => prev.filter(r => r.id !== id));
            }
        } catch (err) {
            console.error("Delete failed", err);
        }
    };

    if (selectedReport) {
        return (
            <div className="space-y-6">
                <button
                    onClick={() => setSelectedReport(null)}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
                >
                    <div className="bg-slate-800 p-2 rounded-xl group-hover:bg-slate-700">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="15 19l-7-7 7-7" />
                        </svg>
                    </div>
                    <span className="font-bold uppercase tracking-wider text-sm">返回历史列表</span>
                </button>
                <ReviewView summary={selectedReport.content} />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight">周报归档 <span className="text-primary">ARCHIVE</span></h2>
                    <p className="text-slate-400 mt-1 font-medium">查看并管理你的过往生产力沉淀</p>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-bold animate-pulse">正在调取档案库...</p>
                </div>
            ) : reports.length === 0 ? (
                <div className="bg-surface-dark/50 border border-slate-800/50 rounded-3xl p-16 text-center">
                    <div className="bg-slate-800/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.168.477-4.5 1.253" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">历史依然空白</h3>
                    <p className="text-slate-500 max-w-sm mx-auto">生成并保存第一份周报，它将出现在这里作为你的成长印记。</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reports.map((report) => (
                        <div
                            key={report.id}
                            className="group bg-surface-dark/50 border border-slate-800 rounded-3xl p-6 hover:border-primary/50 hover:bg-surface-dark transition-all duration-300 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-500"></div>

                            <div className="relative">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="bg-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                                        {new Date(report.created_at).toLocaleDateString('zh-CN')}
                                    </span>
                                    <button
                                        onClick={() => handleDelete(report.id)}
                                        className="text-slate-600 hover:text-danger p-1 transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>

                                <h3 className="text-lg font-bold text-white mb-3 line-clamp-1 group-hover:text-primary transition-colors">
                                    {report.title}
                                </h3>

                                <p className="text-slate-500 text-sm line-clamp-2 mb-6 leading-relaxed">
                                    {report.content.executiveSummary}
                                </p>

                                <button
                                    onClick={() => setSelectedReport(report)}
                                    className="w-full bg-slate-800 py-3 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2 group-hover:bg-primary transition-all duration-300"
                                >
                                    查看详情库
                                    <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ReportHistoryView;
