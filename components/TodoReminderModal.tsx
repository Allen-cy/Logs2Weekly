import React from 'react';
import { Todo } from '../types';

interface TodoReminderModalProps {
    overdueTodos: Todo[];
    onClose: () => void;
    onGoToTodos: () => void;
}

const TodoReminderModal: React.FC<TodoReminderModalProps> = ({
    overdueTodos,
    onClose,
    onGoToTodos,
}) => {
    if (overdueTodos.length === 0) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* 背景遮罩 */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* 弹窗主体 */}
            <div className="relative z-10 w-full max-w-md bg-gradient-to-b from-slate-900 to-[#0f1621] border border-white/10 rounded-3xl shadow-2xl shadow-black/40 overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-300">
                {/* 顶部橙色警示条 */}
                <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border-b border-orange-500/20 px-6 pt-6 pb-5">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                            <span className="material-icons text-orange-400 text-2xl">notifications_active</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-white">
                                您有 {overdueTodos.length} 项待办未完成
                            </h2>
                            <p className="text-sm text-orange-300/80 mt-1">
                                以下事项昨日或更早未能完成，请关注！
                            </p>
                        </div>
                    </div>
                </div>

                {/* 待办列表 */}
                <div className="px-6 py-4 max-h-64 overflow-y-auto space-y-2">
                    {overdueTodos.map((todo) => {
                        const createdDate = new Date(todo.createdAt);
                        const daysAgo = Math.floor(
                            (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
                        );
                        return (
                            <div
                                key={todo.id}
                                className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/5"
                            >
                                {/* 未完成圆圈 */}
                                <div className="w-5 h-5 rounded-full border-2 border-orange-400/60 flex-shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-slate-200 leading-snug">{todo.content}</p>
                                    <span className="text-[10px] text-orange-400/80 font-semibold mt-1 block">
                                        {daysAgo === 0 ? '今天创建' : daysAgo === 1 ? '昨天创建' : `${daysAgo} 天前创建`}
                                        {' · '}
                                        {todo.listName}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* 底部按钮 */}
                <div className="flex gap-3 px-6 pb-6 pt-2">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 text-slate-400 text-sm font-bold hover:bg-white/10 transition-all"
                    >
                        稍后处理
                    </button>
                    <button
                        onClick={() => {
                            onGoToTodos();
                            onClose();
                        }}
                        className="flex-1 py-3 rounded-2xl bg-orange-500 text-white text-sm font-black hover:bg-orange-400 transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
                    >
                        <span className="material-icons text-sm">checklist</span>
                        立即查看
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TodoReminderModal;
