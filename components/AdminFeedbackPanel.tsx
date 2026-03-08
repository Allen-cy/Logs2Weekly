import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../aiService';
import { User, LogEntry } from '../types';

interface AdminFeedbackPanelProps {
    user: User;
    onClose: () => void;
}

export const AdminFeedbackPanel: React.FC<AdminFeedbackPanelProps> = ({ user, onClose }) => {
    const [feedbacks, setFeedbacks] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [replyingTo, setReplyingTo] = useState<number | null>(null);

    useEffect(() => {
        loadFeedbacks();
    }, []);

    const loadFeedbacks = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/feedbacks?user_id=${user.id}`);
            if (res.ok) {
                const data = await res.json();
                setFeedbacks(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReply = async (targetUserId: number) => {
        if (!replyContent.trim()) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/reply?user_id=${user.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ target_user_id: targetUserId, content: replyContent })
            });
            if (res.ok) {
                alert('系统消息发送成功！');
                setReplyContent('');
                setReplyingTo(null);
            } else {
                alert('发送失败，请重试');
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose}></div>
            <div className="relative bg-surface-dark border border-amber-500/20 w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden">
                <div className="p-8 border-b border-white/5 flex items-center justify-between sticky top-0 bg-surface-dark z-10">
                    <div>
                        <h2 className="text-2xl font-black text-amber-500 flex items-center gap-2">
                            <span className="material-icons">admin_panel_settings</span>反馈管理后台
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">专属上帝视角：处理用户建议并发送定向触达</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors text-slate-400">
                        <span className="material-icons">close</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                    {isLoading ? (
                        <div className="text-center text-slate-500 py-10">加载中...</div>
                    ) : feedbacks.length === 0 ? (
                        <div className="text-center text-slate-500 py-10">目前还没有任何反馈</div>
                    ) : (
                        feedbacks.map(fb => (
                            <div key={fb.id} className="bg-slate-900/50 border border-white/5 rounded-2xl p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="text-xs text-primary font-bold">{fb.users?.email || 'Unknown User'}</div>
                                        <div className="text-[10px] text-slate-500 mt-1">{new Date(fb.timestamp).toLocaleString()}</div>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${fb.status === 'pending' ? 'bg-amber-500/10 text-amber-500' : 'bg-green-500/10 text-green-500'}`}>
                                        {fb.status === 'pending' ? '待回复' : '已处理'}
                                    </span>
                                </div>
                                <div className="text-white text-sm bg-slate-950/50 p-4 rounded-xl mb-4 leading-relaxed">
                                    {fb.content}
                                </div>

                                {replyingTo === fb.user_id ? (
                                    <div className="space-y-3 mt-4 border-t border-white/5 pt-4">
                                        <textarea
                                            value={replyContent}
                                            onChange={e => setReplyContent(e.target.value)}
                                            className="w-full bg-black/30 border border-amber-500/30 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-amber-500 resize-none h-24"
                                            placeholder={`发送系统消息给 ${fb.users?.email}...`}
                                        />
                                        <div className="flex justify-end gap-3">
                                            <button onClick={() => setReplyingTo(null)} className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors">取消</button>
                                            <button
                                                onClick={() => handleReply(fb.user_id)}
                                                disabled={!replyContent.trim()}
                                                className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
                                            >
                                                发送触达
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex justify-end mt-2">
                                        <button
                                            onClick={() => { setReplyingTo(fb.user_id); setReplyContent(''); }}
                                            className="text-xs text-amber-500 font-bold hover:text-amber-400 flex items-center gap-1"
                                        >
                                            <span className="material-icons text-[14px]">reply</span>
                                            回复用户
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminFeedbackPanel;
