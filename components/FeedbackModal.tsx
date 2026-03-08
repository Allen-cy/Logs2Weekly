import React, { useState } from 'react';
import { API_BASE_URL } from '../aiService';

interface FeedbackModalProps {
    userId: number;
    onClose: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ userId, onClose }) => {
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        setIsSubmitting(true);
        setStatus('idle');

        try {
            const response = await fetch(`${API_BASE_URL}/api/feedbacks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, content }),
            });

            if (response.ok) {
                setStatus('success');
                setTimeout(() => {
                    onClose();
                }, 2000);
            } else {
                setStatus('error');
            }
        } catch (error) {
            console.error(error);
            setStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 transition-all duration-300">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />
            <div className="relative bg-surface-dark border border-white/10 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden p-8 sm:p-10 z-10">
                <div className="mb-6">
                    <h2 className="text-2xl font-black text-white mb-2 flex items-center gap-2">
                        <span className="material-icons text-primary">campaign</span>意见反馈
                    </h2>
                    <p className="text-slate-400 text-sm">任何好点子、吐槽或是遇到的Bug，都欢迎在这里告诉我。我希望能与您共创更好用的应用！</p>
                </div>

                {status === 'success' ? (
                    <div className="bg-success/10 border border-success/30 rounded-2xl p-6 text-center animate-in zoom-in">
                        <span className="material-icons text-4xl text-success mb-2">check_circle</span>
                        <h3 className="text-green-400 font-bold mb-1">反馈已收到</h3>
                        <p className="text-xs text-green-500/80">非常感谢您的支持，我会尽快查看的！</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="w-full h-32 bg-slate-950/50 border border-slate-800 rounded-2xl py-4 px-6 text-white text-sm focus:border-primary outline-none transition-all resize-none"
                                placeholder="输入您想对我说的话..."
                                required
                            />
                        </div>
                        {status === 'error' && (
                            <p className="text-danger text-xs font-bold text-center">发送失败，请检查网络或稍后再试。</p>
                        )}
                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 bg-white/5 hover:bg-white/10 text-white px-6 py-4 rounded-2xl font-black text-sm transition-all"
                            >
                                取消
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || !content.trim()}
                                className="flex-1 bg-primary hover:bg-primary-hover text-white px-6 py-4 rounded-2xl font-black text-sm shadow-xl shadow-primary/20 transition-all disabled:opacity-50"
                            >
                                {isSubmitting ? '发送中...' : '发送反馈'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default FeedbackModal;
