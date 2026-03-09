import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../aiService';
import { User } from '../types';
import ReactMarkdown from 'react-markdown';

interface MessagesViewProps {
    user: User;
    onBack: () => void;
    onOpenFeedback: () => void;
}

interface FeedbackItem {
    id: number | string;
    content: string;
    timestamp: string;
    type: string;
    status: string;
    tags: string[];
    parent_id?: string | number;
}

const MessagesView: React.FC<MessagesViewProps> = ({ user, onBack, onOpenFeedback }) => {
    const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
    const [notifications, setNotifications] = useState<FeedbackItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'notifications' | 'feedbacks'>('notifications');

    useEffect(() => {
        loadMessages();
    }, []);

    const loadMessages = async () => {
        setIsLoading(true);
        try {
            // 获取用户自己的所有日志，包含 feedback 和 notification
            const res = await fetch(`${API_BASE_URL}/messages?user_id=${user.id}`);
            if (res.ok) {
                const data = await res.json();
                setFeedbacks(data.feedbacks || []);
                setNotifications(data.notifications || []);

                // 标记所有通知为已读
                if (data.notifications?.length > 0) {
                    const unreadIds = data.notifications
                        .filter((n: FeedbackItem) => n.status === 'unread')
                        .map((n: FeedbackItem) => n.id);
                    if (unreadIds.length > 0) {
                        await fetch(`${API_BASE_URL}/messages/mark-read?user_id=${user.id}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ ids: unreadIds })
                        });
                    }
                }
            }
        } catch (e) {
            console.error('Load messages failed', e);
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = (ts: string) => {
        const d = new Date(ts);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        if (diff < 60000) return '刚刚';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`;
        return d.toLocaleDateString();
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* 头部 */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="lg:hidden w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                        <span className="material-icons">arrow_back</span>
                    </button>
                    <div>
                        <h2 className="text-2xl font-black text-white flex items-center gap-2">
                            <span className="material-icons text-primary">forum</span>消息管理
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">查看系统通知和你提交的反馈记录</p>
                    </div>
                </div>
                <button
                    onClick={onOpenFeedback}
                    className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg shadow-primary/20 transition-all flex items-center gap-1.5"
                >
                    <span className="material-icons text-sm">edit</span>写反馈
                </button>
            </div>

            {/* Tab 切换 */}
            <div className="flex bg-slate-900/50 p-1 rounded-2xl border border-slate-800">
                <button
                    onClick={() => setActiveTab('notifications')}
                    className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'notifications' ? 'bg-primary/20 text-primary shadow-lg' : 'text-slate-500 hover:text-white'}`}
                >
                    <span className="material-icons text-sm">notifications</span>
                    系统通知
                    {notifications.filter(n => n.status === 'unread').length > 0 && (
                        <span className="bg-red-500 text-white text-[9px] rounded-full w-5 h-5 flex items-center justify-center font-black">
                            {notifications.filter(n => n.status === 'unread').length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('feedbacks')}
                    className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'feedbacks' ? 'bg-primary/20 text-primary shadow-lg' : 'text-slate-500 hover:text-white'}`}
                >
                    <span className="material-icons text-sm">campaign</span>
                    我的反馈
                    {feedbacks.length > 0 && (
                        <span className="bg-slate-700 text-slate-300 text-[9px] rounded-full w-5 h-5 flex items-center justify-center font-black">
                            {feedbacks.length}
                        </span>
                    )}
                </button>
            </div>

            {/* 内容区域 */}
            {isLoading ? (
                <div className="text-center text-slate-500 py-20">
                    <span className="material-icons text-4xl animate-spin mb-2">sync</span>
                    <p className="text-sm">加载中...</p>
                </div>
            ) : activeTab === 'notifications' ? (
                <div className="space-y-4">
                    {notifications.length === 0 ? (
                        <div className="text-center text-slate-500 py-20">
                            <span className="material-icons text-5xl mb-3 opacity-30">mark_email_read</span>
                            <p className="text-sm font-bold">暂无通知</p>
                            <p className="text-xs mt-1 opacity-70">当开发者回复了你的反馈，你会在这里收到消息</p>
                        </div>
                    ) : (
                        notifications.map(n => (
                            <div key={n.id} className={`glass-panel rounded-2xl p-6 relative overflow-hidden transition-all ${n.status === 'unread' ? 'border-amber-500/30 bg-amber-500/5' : 'border-white/5'}`}>
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${n.status === 'unread' ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-slate-700'}`}></div>
                                <div className="flex items-start gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${n.status === 'unread' ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-800 text-slate-500'}`}>
                                        <span className="material-icons text-lg">mark_email_unread</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">开发者回复</span>
                                            {n.status === 'unread' && (
                                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                            )}
                                            <span className="text-[10px] text-slate-600 ml-auto">{formatTime(n.timestamp)}</span>
                                        </div>
                                        <div className="prose prose-invert prose-sm text-white/90">
                                            <ReactMarkdown>{n.content}</ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {feedbacks.length === 0 ? (
                        <div className="text-center text-slate-500 py-20">
                            <span className="material-icons text-5xl mb-3 opacity-30">feedback</span>
                            <p className="text-sm font-bold">还没有提交过反馈</p>
                            <p className="text-xs mt-1 opacity-70">点击右上角"写反馈"来分享你的想法</p>
                        </div>
                    ) : (
                        feedbacks.map(f => {
                            const replyNotification = notifications.find(n => n.parent_id == f.id);
                            return (
                                <div key={f.id} className="glass-panel rounded-2xl p-6 relative overflow-hidden">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center flex-shrink-0">
                                            <span className="material-icons text-lg">campaign</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">我的反馈</span>
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${f.status === 'pending' ? 'text-amber-500 bg-amber-500/10 border-amber-500/20' :
                                                        f.status === 'adopted' ? 'text-green-500 bg-green-500/10 border-green-500/20' :
                                                            'text-blue-500 bg-blue-500/10 border-blue-500/20'
                                                    }`}>
                                                    {f.status === 'pending' ? '待回复' : f.status === 'adopted' ? '已采纳' : '已回复'}
                                                </span>
                                                <span className="text-[10px] text-slate-600 ml-auto">{formatTime(f.timestamp)}</span>
                                            </div>
                                            <div className="text-sm text-white/80 leading-relaxed">
                                                {f.content}
                                            </div>

                                            {replyNotification && (
                                                <div className="mt-4 pt-4 border-t border-white/5 pl-4 ml-2 border-l-2 border-l-amber-500/50">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="material-icons text-amber-500 text-sm">subdirectory_arrow_right</span>
                                                        <span className="text-[10px] text-amber-500 font-black tracking-widest uppercase">开发者回复</span>
                                                        <span className="text-[10px] text-slate-500 ml-auto">{formatTime(replyNotification.timestamp)}</span>
                                                    </div>
                                                    <div className="prose prose-invert prose-sm text-amber-100/90 leading-relaxed">
                                                        <ReactMarkdown>{replyNotification.content}</ReactMarkdown>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            )}
        </div>
    );
};

export default MessagesView;
