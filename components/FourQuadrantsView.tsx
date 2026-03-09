import React from 'react';
import { Todo, TodoPriority } from '../types';

interface FourQuadrantsViewProps {
    todos: Todo[];
    onToggleTodo: (id: string) => void;
    onDeleteTodo: (id: string) => void;
    onUpdateTodo: (id: string, updates: Partial<Todo>) => void;
    onAddTodo: (content: string, listName: string, priority: TodoPriority) => void;
    justCompletedIds?: Set<string>;
}

const PRIORITY_MAP = {
    [TodoPriority.P0]: { label: '重要且紧急', color: 'bg-red-500', border: 'border-red-500', text: 'text-red-500' },
    [TodoPriority.P1]: { label: '重要不紧急', color: 'bg-orange-500', border: 'border-orange-500', text: 'text-orange-500' },
    [TodoPriority.P2]: { label: '紧急不重要', color: 'bg-green-500', border: 'border-green-500', text: 'text-green-500' },
    [TodoPriority.P3]: { label: '不重要不紧急', color: 'bg-slate-500', border: 'border-slate-500', text: 'text-slate-500' }
};

const FourQuadrantsView: React.FC<FourQuadrantsViewProps> = ({
    todos,
    onToggleTodo,
    onDeleteTodo,
    onUpdateTodo,
    onAddTodo,
    justCompletedIds = new Set()
}) => {
    const quadrants = [
        { id: TodoPriority.P0, priority: TodoPriority.P0 },
        { id: TodoPriority.P1, priority: TodoPriority.P1 },
        { id: TodoPriority.P2, priority: TodoPriority.P2 },
        { id: TodoPriority.P3, priority: TodoPriority.P3 }
    ];

    const handleQuickAdd = (priority: TodoPriority) => {
        const content = window.prompt(`在 [${PRIORITY_MAP[priority].label}] 象限添加待办:`);
        if (content && content.trim()) {
            onAddTodo(content, '临时待办', priority);
        }
    };

    return (
        <div className="flex-1 p-4 lg:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 bg-slate-950/20">
            {quadrants.map((quad) => {
                const info = PRIORITY_MAP[quad.priority];
                const quadTodos = todos.filter(t => t.priority === quad.priority);

                return (
                    <div key={quad.id} className="flex flex-col bg-white/5 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden shadow-2xl transition-all hover:border-white/10 group/quad">
                        <div className="px-5 py-4 flex items-center justify-between border-b border-white/5 bg-white/5 relative overflow-hidden">
                            {/* 颜色条指示器 */}
                            <div className={`absolute top-0 left-0 bottom-0 w-1 ${info.color}`}></div>

                            <div className="flex items-center gap-2">
                                <h3 className={`text-sm font-black tracking-widest uppercase ${info.text}`}>
                                    {info.label}
                                </h3>
                                <span className="bg-white/10 text-white/40 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                    {quadTodos.length}
                                </span>
                            </div>

                            <button
                                onClick={() => handleQuickAdd(quad.priority)}
                                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all flex items-center justify-center group"
                            >
                                <span className="material-icons text-lg group-hover:scale-110 transition-transform">add</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-[200px] max-h-[400px] scrollbar-hide">
                            {quadTodos.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-20 py-10">
                                    <span className="material-icons text-4xl mb-2">assignment_turned_in</span>
                                    <span className="text-xs font-bold uppercase tracking-widest text-white">暂无事项</span>
                                </div>
                            ) : (
                                quadTodos.map((todo) => (
                                    <div
                                        key={todo.id}
                                        className={`group relative flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-500 ${justCompletedIds.has(todo.id) ? 'opacity-0 scale-90 translate-y-4' : ''} ${todo.completed ? 'opacity-40 grayscale' : ''}`}
                                    >
                                        <button
                                            onClick={() => onToggleTodo(todo.id)}
                                            className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${todo.completed ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'border-slate-700 hover:border-primary/50 bg-slate-900/50'}`}
                                        >
                                            {todo.completed && <span className="material-icons text-[12px] font-black">check</span>}
                                        </button>

                                        <div className="flex-1 min-w-0">
                                            <p className={`text-xs text-white font-medium break-words leading-relaxed ${todo.completed ? 'line-through text-slate-500' : ''}`}>
                                                {todo.content}
                                            </p>
                                        </div>

                                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all">
                                            <button
                                                onClick={() => onDeleteTodo(todo.id)}
                                                className="p-1.5 text-slate-500 hover:text-red-500 transition-colors"
                                            >
                                                <span className="material-icons text-sm">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default FourQuadrantsView;
