import React, { useState, useMemo } from 'react';
import { Todo, TodoList } from '../types';

interface TodoViewProps {
    todos: Todo[];
    onAddTodo: (content: string, listName: string) => void;
    onToggleTodo: (id: string) => void;
    onDeleteTodo: (id: string) => void;
    onUpdateTodo: (id: string, updates: Partial<Todo>) => void;
}

const TodoView: React.FC<TodoViewProps> = ({
    todos,
    onAddTodo,
    onToggleTodo,
    onDeleteTodo,
    onUpdateTodo
}) => {
    const [activeList, setActiveList] = useState<TodoList>('all');
    const [newTodoInput, setNewTodoInput] = useState('');

    const filteredTodos = useMemo(() => {
        let result = todos;
        if (activeList === 'today') {
            const today = new Date().toDateString();
            result = todos.filter(t => new Date(t.createdAt).toDateString() === today);
        } else if (activeList === 'planned') {
            result = todos.filter(t => !!t.dueDate);
        } else if (activeList === 'completed') {
            result = todos.filter(t => t.completed);
        } else if (activeList !== 'all') {
            result = todos.filter(t => t.listName === activeList);
        }

        // 排序逻辑：未完成的在前（按时间倒序），已完成的在后（按时间倒序）
        const unfinished = result.filter(t => !t.completed).sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        const completed = result.filter(t => t.completed).sort((a, b) =>
            new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime()
        );

        return [...unfinished, ...completed];
    }, [todos, activeList]);

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTodoInput.trim()) return;
        const list = activeList === 'all' || activeList === 'completed' || activeList === 'planned' || activeList === 'today'
            ? '临时待办'
            : activeList;
        onAddTodo(newTodoInput, list);
        setNewTodoInput('');
    };

    const listCounts = useMemo(() => {
        const today = new Date().toDateString();
        return {
            all: todos.length,
            today: todos.filter(t => new Date(t.createdAt).toDateString() === today).length,
            planned: todos.filter(t => !!t.dueDate).length,
            completed: todos.filter(t => t.completed).length,
        };
    }, [todos]);

    return (
        <div className="flex bg-black/20 backdrop-blur-xl rounded-3xl border border-white/5 overflow-hidden min-h-[600px] animate-in fade-in zoom-in-95 duration-500">
            {/* 侧边栏 */}
            <aside className="w-72 bg-slate-900/40 border-r border-white/5 p-6 flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => setActiveList('today')}
                        className={`p-3 rounded-2xl flex flex-col gap-1 transition-all ${activeList === 'today' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activeList === 'today' ? 'bg-white/20' : 'bg-blue-500/20 text-blue-500'}`}>
                            <span className="material-icons text-lg">calendar_today</span>
                        </div>
                        <span className="text-xl font-black mt-1">{listCounts.today}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">今天</span>
                    </button>

                    <button
                        onClick={() => setActiveList('planned')}
                        className={`p-3 rounded-2xl flex flex-col gap-1 transition-all ${activeList === 'planned' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activeList === 'planned' ? 'bg-white/20' : 'bg-red-500/20 text-red-500'}`}>
                            <span className="material-icons text-lg">event</span>
                        </div>
                        <span className="text-xl font-black mt-1">{listCounts.planned}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">计划</span>
                    </button>

                    <button
                        onClick={() => setActiveList('all')}
                        className={`p-3 rounded-2xl flex flex-col gap-1 transition-all ${activeList === 'all' ? 'bg-slate-700 text-white shadow-lg shadow-black/20' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activeList === 'all' ? 'bg-white/20' : 'bg-slate-500/20 text-slate-400'}`}>
                            <span className="material-icons text-lg">all_inbox</span>
                        </div>
                        <span className="text-xl font-black mt-1">{listCounts.all}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">全部</span>
                    </button>

                    <button
                        onClick={() => setActiveList('completed')}
                        className={`p-3 rounded-2xl flex flex-col gap-1 transition-all ${activeList === 'completed' ? 'bg-green-600 text-white shadow-lg shadow-green-500/20' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activeList === 'completed' ? 'bg-white/20' : 'bg-green-500/20 text-green-500'}`}>
                            <span className="material-icons text-lg">check_circle</span>
                        </div>
                        <span className="text-xl font-black mt-1">{listCounts.completed}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">已完成</span>
                    </button>
                </div>

                <div className="mt-4">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 ml-2">我的列表</h3>
                    <div className="space-y-1">
                        {['工作', '学习', '健康', '临时待办'].map(name => (
                            <button
                                key={name}
                                onClick={() => setActiveList(name)}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${activeList === name ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="material-icons text-lg opacity-70">list</span>
                                    <span className="text-sm font-bold">{name}</span>
                                </div>
                                <span className="text-[10px] opacity-50">{todos.filter(t => t.listName === name && !t.completed).length}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </aside>

            {/* 主内容区 */}
            <main className="flex-1 bg-surface-dark/40 flex flex-col">
                <div className="p-8 pb-4 flex items-center justify-between">
                    <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-4">
                        {activeList === 'all' ? '全部' : activeList === 'today' ? '今天' : activeList === 'planned' ? '计划' : activeList === 'completed' ? '已完成' : activeList}
                        <span className="text-slate-600 text-xl">{filteredTodos.length}</span>
                    </h2>
                </div>

                {/* 待办列表 */}
                <div className="flex-1 overflow-y-auto px-8 space-y-px">
                    {filteredTodos.map((todo) => (
                        <div
                            key={todo.id}
                            className={`group flex items-start gap-4 py-3 border-b border-white/5 transition-all ${todo.completed ? 'opacity-40' : ''}`}
                        >
                            <button
                                onClick={() => onToggleTodo(todo.id)}
                                className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${todo.completed ? 'bg-primary border-primary text-white' : 'border-slate-700 hover:border-primary/50'}`}
                            >
                                {todo.completed && <span className="material-icons text-[14px]">check</span>}
                            </button>

                            <div className="flex-1 min-w-0">
                                <p className={`text-sm text-white font-medium break-words ${todo.completed ? 'line-through text-slate-500' : ''}`}>
                                    {todo.content}
                                </p>
                                {!todo.completed && (
                                    <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500 font-bold">
                                        <span className="flex items-center gap-1">
                                            <span className="material-icons text-xs">calendar_today</span>
                                            {new Date(todo.createdAt).toLocaleDateString()}
                                        </span>
                                        <span>·</span>
                                        <span>{todo.listName}</span>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => onDeleteTodo(todo.id)}
                                className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-danger transition-all"
                            >
                                <span className="material-icons text-sm">delete</span>
                            </button>
                        </div>
                    ))}

                    {/* 快速添加 */}
                    <form onSubmit={handleAdd} className="mt-4">
                        <div className="flex items-center gap-4 py-3 group">
                            <span className="material-icons text-slate-600 group-focus-within:text-primary transition-colors">add</span>
                            <input
                                type="text"
                                placeholder="在此添加新提醒..."
                                value={newTodoInput}
                                onChange={(e) => setNewTodoInput(e.target.value)}
                                className="flex-1 bg-transparent border-none focus:ring-0 text-sm p-0 placeholder-slate-600 text-white"
                            />
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default TodoView;
