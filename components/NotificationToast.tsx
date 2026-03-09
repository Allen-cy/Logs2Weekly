import React from 'react';

interface NotificationToastProps {
    count: number;
    onView: () => void;
    onDismiss: () => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ count, onView, onDismiss }) => {
    if (count <= 0) return null;

    return (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-8 shadow-2xl max-w-sm w-full relative transform transition-all scale-100">
                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center animate-bounce mb-4">
                        <span className="material-icons text-3xl">notifications_active</span>
                    </div>
                    <h3 className="text-white font-black text-xl mb-2">新的开发者回复</h3>
                    <p className="text-sm text-slate-400 mb-6">您有 {count} 条未读的回复或系统消息，请前往消息中心查看。</p>
                    <div className="flex flex-col w-full gap-3">
                        <button
                            onClick={onView}
                            className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl text-sm font-black shadow-lg shadow-amber-500/20 transition-all"
                        >
                            立即查看
                        </button>
                        <button
                            onClick={onDismiss}
                            className="w-full bg-white/5 hover:bg-white/10 text-slate-400 py-3 rounded-xl text-sm font-bold transition-all"
                        >
                            稍后再看
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationToast;
