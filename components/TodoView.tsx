import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Todo, TodoList, TodoPriority } from '../types';
import FourQuadrantsView from './FourQuadrantsView';

const PRIORITY_MAP = {
    [TodoPriority.P0]: { label: '重要且紧急', color: 'bg-red-500', text: 'text-red-500', border: 'border-red-500' },
    [TodoPriority.P1]: { label: '重要不紧急', color: 'bg-orange-500', text: 'text-orange-500', border: 'border-orange-500' },
    [TodoPriority.P2]: { label: '紧急不重要', color: 'bg-green-500', text: 'text-green-500', border: 'border-green-500' },
    [TodoPriority.P3]: { label: '不重要不紧急', color: 'bg-slate-500', text: 'text-slate-500', border: 'border-slate-500' }
};

interface TodoViewProps {
    todos: Todo[];
    user: any;
    onAddTodo: (content: string, listName: string, priority?: TodoPriority) => void;
    onToggleTodo: (id: string) => void;
    onDeleteTodo: (id: string) => void;
    onUpdateTodo: (id: string, updates: Partial<Todo>) => void;
}

const TodoView: React.FC<TodoViewProps> = ({
    todos,
    user,
    onAddTodo,
    onToggleTodo,
    onDeleteTodo,
    onUpdateTodo
}) => {
    const [activeList, setActiveList] = useState<TodoList>('all');
    const [newTodoInput, setNewTodoInput] = useState('');
    const [showSidebar, setShowSidebar] = useState(false);
    const [viewType, setViewType] = useState<'list' | 'quadrant'>('list');
    const [selectedPriority, setSelectedPriority] = useState<TodoPriority>(TodoPriority.P3);
    const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [editList, setEditList] = useState('');
    const [editPriority, setEditPriority] = useState<TodoPriority>(TodoPriority.P3);
    const [justCompletedIds, setJustCompletedIds] = useState<Set<string>>(new Set());

    // 新增状态：替换 prompt 以避免闪退
    const [isAddingList, setIsAddingList] = useState(false);
    const [newListNameInput, setNewListNameInput] = useState('');
    const [renamingListName, setRenamingListName] = useState<string | null>(null);
    const [renameListInput, setRenameListInput] = useState('');

    // 自定义列表状态
    const [customLists, setCustomLists] = useState<string[]>(() => {
        const saved = localStorage.getItem(`custom_todo_lists`);
        try {
            const parsed = saved ? JSON.parse(saved) : null;
            return Array.isArray(parsed) ? parsed : ['工作', '学习', '健康', '临时待办'];
        } catch (e) {
            return ['工作', '学习', '健康', '临时待办'];
        }
    });

    useEffect(() => {
        localStorage.setItem(`custom_todo_lists`, JSON.stringify(customLists));
    }, [customLists]);

    // 开始编辑待办
    const startEditing = (todo: Todo) => {
        setEditingTodoId(todo.id);
        setEditContent(todo.content);
        setEditList(todo.listName);
        setEditPriority(todo.priority || TodoPriority.P3);
    };

    // 保存编辑
    const saveEdit = () => {
        if (editingTodoId && editContent.trim()) {
            onUpdateTodo(editingTodoId, {
                content: editContent,
                listName: editList,
                priority: editPriority
            });
            setEditingTodoId(null);
        }
    };

    // 新增列表
    const handleAddListSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        const name = newListNameInput.trim();
        if (name && !customLists.includes(name)) {
            setCustomLists([...customLists, name]);
        }
        setNewListNameInput('');
        setIsAddingList(false);
    };

    // 修改列表名
    const handleRenameListSubmit = (oldName: string, e?: React.FormEvent) => {
        e?.preventDefault();
        const newName = renameListInput.trim();
        if (newName && newName !== oldName && !customLists.includes(newName)) {
            setCustomLists(customLists.map(l => l === oldName ? newName : l));
            // 更新所有属于旧列表的待办
            todos.forEach(t => {
                if (t.listName === oldName) {
                    onUpdateTodo(t.id, { listName: newName });
                }
            });
            if (activeList === oldName) {
                setActiveList(newName);
            }
        }
        setRenamingListName(null);
    };

    // 删除列表
    const handleDeleteList = (name: string) => {
        if (window.confirm(`确定要删除列表 "${name}" 吗？该列表下的待办将移至 "临时待办"。`)) {
            setCustomLists(customLists.filter(l => l !== name));
            todos.forEach(t => {
                if (t.listName === name) {
                    onUpdateTodo(t.id, { listName: '临时待办' });
                }
            });
            if (activeList === name) {
                setActiveList('all');
            }
        }
    };

    // 恢复草稿
    useEffect(() => {
        if (user?.id) {
            const draft = localStorage.getItem(`draft_todo_${user.id}`);
            if (draft) setNewTodoInput(draft);
        }
    }, [user?.id]);

    // 自动保存草稿
    useEffect(() => {
        if (user?.id) {
            localStorage.setItem(`draft_todo_${user.id}`, newTodoInput);
        }
    }, [newTodoInput, user?.id]);

    // 归档核心逻辑：非"已完成"视图自动隐藏已完成的待办
    const filteredTodos = useMemo(() => {
        if (activeList === 'completed') {
            // 「已完成」视图：只显示已完成的待办，按完成时间倒序
            return todos
                .filter(t => t.completed)
                .sort((a, b) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime());
        }

        // 其他视图：只显示未完成的待办（已完成自动归档隐藏）
        let result = todos.filter(t => !t.completed);

        if (activeList === 'today') {
            const today = new Date().toDateString();
            result = result.filter(t => new Date(t.createdAt).toDateString() === today);
        } else if (activeList === 'planned') {
            result = result.filter(t => !!t.dueDate);
        } else if (activeList !== 'all') {
            result = result.filter(t => t.listName === activeList);
        }

        return result.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }, [todos, activeList]);

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTodoInput.trim()) return;
        const list = activeList === 'all' || activeList === 'completed' || activeList === 'planned' || activeList === 'today'
            ? '临时待办'
            : (activeList as string);
        onAddTodo(newTodoInput, list, selectedPriority);
        setNewTodoInput('');
        if (user?.id) {
            localStorage.removeItem(`draft_todo_${user.id}`);
        }
    };

    // 标记完成时的归档动画处理
    const handleToggleWithAnimation = useCallback((id: string) => {
        const todo = todos.find(t => t.id === id);
        if (todo && !todo.completed) {
            // 即将标记完成 -> 播放归档淡出动画
            setJustCompletedIds(prev => new Set(prev).add(id));
            setTimeout(() => {
                onToggleTodo(id);
                setJustCompletedIds(prev => {
                    const next = new Set(prev);
                    next.delete(id);
                    return next;
                });
            }, 500);
        } else {
            // 取消完成 -> 直接 toggle
            onToggleTodo(id);
        }
    }, [todos, onToggleTodo]);

    const listCounts = useMemo(() => {
        const today = new Date().toDateString();
        const activeTodos = todos.filter(t => !t.completed);
        return {
            all: activeTodos.length,
            today: activeTodos.filter(t => new Date(t.createdAt).toDateString() === today).length,
            planned: activeTodos.filter(t => !!t.dueDate).length,
            completed: todos.filter(t => t.completed).length,
        };
    }, [todos]);

    const SidebarContent = () => (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 lg:grid-cols-2 gap-3">
                <button
                    onClick={() => { setActiveList('today'); setShowSidebar(false); }}
                    className={`p-3 rounded-2xl flex flex-col gap-1 transition-all ${activeList === 'today' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activeList === 'today' ? 'bg-white/20' : 'bg-blue-500/20 text-blue-500'}`}>
                        <span className="material-icons text-lg">calendar_today</span>
                    </div>
                    <span className="text-xl font-black mt-1">{listCounts.today}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">今天</span>
                </button>

                <button
                    onClick={() => { setActiveList('planned'); setShowSidebar(false); }}
                    className={`p-3 rounded-2xl flex flex-col gap-1 transition-all ${activeList === 'planned' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activeList === 'planned' ? 'bg-white/20' : 'bg-red-500/20 text-red-500'}`}>
                        <span className="material-icons text-lg">event</span>
                    </div>
                    <span className="text-xl font-black mt-1">{listCounts.planned}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">计划</span>
                </button>

                <button
                    onClick={() => { setActiveList('all'); setShowSidebar(false); }}
                    className={`p-3 rounded-2xl flex flex-col gap-1 transition-all ${activeList === 'all' ? 'bg-slate-700 text-white shadow-lg shadow-black/20' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activeList === 'all' ? 'bg-white/20' : 'bg-slate-500/20 text-slate-400'}`}>
                        <span className="material-icons text-lg">all_inbox</span>
                    </div>
                    <span className="text-xl font-black mt-1">{listCounts.all}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">全部</span>
                </button>

                <button
                    onClick={() => { setActiveList('completed'); setShowSidebar(false); }}
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
                <div className="flex items-center justify-between mb-4 ml-2 mr-2">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">我的列表</h3>
                    <button onClick={() => { setIsAddingList(true); setNewListNameInput(''); }} className="text-slate-400 hover:text-white transition-all bg-white/5 hover:bg-white/10 w-6 h-6 rounded-md flex items-center justify-center" title="新增列表">
                        <span className="material-icons text-sm">add</span>
                    </button>
                </div>

                {isAddingList && (
                    <form onSubmit={handleAddListSubmit} className="mb-2 flex items-center gap-2 px-2">
                        <input
                            type="text"
                            value={newListNameInput}
                            onChange={(e) => setNewListNameInput(e.target.value)}
                            placeholder="新列表名..."
                            className="flex-1 bg-black/30 border border-primary/50 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary w-full"
                            autoFocus
                        />
                        <button type="button" onClick={() => setIsAddingList(false)} className="text-slate-400 hover:text-white p-1">
                            <span className="material-icons text-[14px]">close</span>
                        </button>
                    </form>
                )}

                <div className="space-y-1">
                    {customLists.map(name => (
                        <div key={name} className="group relative">
                            {renamingListName === name ? (
                                <form onSubmit={(e) => handleRenameListSubmit(name, e)} className="flex items-center gap-2 px-2 py-2 mb-1 bg-white/5 rounded-xl border border-primary/30">
                                    <input
                                        type="text"
                                        value={renameListInput}
                                        onChange={(e) => setRenameListInput(e.target.value)}
                                        className="flex-1 bg-black/40 border border-transparent rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-primary/50"
                                        autoFocus
                                    />
                                    <button type="submit" className="text-primary hover:text-blue-400 p-1">
                                        <span className="material-icons text-[14px]">check</span>
                                    </button>
                                    <button type="button" onClick={() => setRenamingListName(null)} className="text-slate-500 hover:text-white p-1">
                                        <span className="material-icons text-[14px]">close</span>
                                    </button>
                                </form>
                            ) : (
                                <>
                                    <button
                                        onClick={() => { setActiveList(name); setShowSidebar(false); }}
                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${activeList === name ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="material-icons text-lg opacity-70">list</span>
                                            <span className="text-sm font-bold">{name}</span>
                                        </div>
                                        <span className="text-[10px] opacity-50 block group-hover:hidden border border-white/10 px-1.5 py-0.5 rounded-md min-w-[20px] text-center">{todos.filter(t => t.listName === name && !t.completed).length}</span>
                                    </button>
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-white/10 shadow-lg z-10">
                                        <button onClick={(e) => { e.stopPropagation(); setRenameListInput(name); setRenamingListName(name); }} className="p-1 text-slate-400 hover:text-primary transition-colors" title="重命名">
                                            <span className="material-icons text-[14px]">edit</span>
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteList(name); }} className="p-1 text-slate-400 hover:text-danger transition-colors" title="删除">
                                            <span className="material-icons text-[14px]">delete</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col lg:flex-row bg-black/20 backdrop-blur-xl rounded-3xl border border-white/5 overflow-hidden min-h-[600px] animate-in fade-in zoom-in-95 duration-500">
            <aside className={`
                ${showSidebar ? 'fixed inset-0 z-50 bg-slate-950 p-6 flex' : 'hidden'} 
                lg:relative lg:flex lg:w-72 lg:bg-slate-900/40 lg:border-r lg:border-white/5 lg:p-6 flex-col gap-6
            `}>
                <div className="flex items-center justify-between lg:hidden mb-4">
                    <span className="text-lg font-black text-white">列表</span>
                    <button onClick={() => setShowSidebar(false)} className="text-slate-400"><span className="material-icons">close</span></button>
                </div>
                <SidebarContent />
            </aside>

            <main className="flex-1 bg-surface-dark/40 flex flex-col min-w-0">
                <div className="p-6 lg:p-8 pb-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setShowSidebar(true)} className="lg:hidden text-primary">
                            <span className="material-icons">menu_open</span>
                        </button>
                        <h2 className="text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center gap-4">
                            {activeList === 'all' ? '全部' : activeList === 'today' ? '今天' : activeList === 'planned' ? '计划' : activeList === 'completed' ? '已完成' : activeList}
                            <span className="text-slate-600 text-xl">{filteredTodos.length}</span>
                        </h2>
                    </div>

                    <div className="flex bg-white/5 rounded-full p-1 border border-white/5 flex-shrink-0">
                        <button
                            onClick={() => setViewType('list')}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all flex items-center gap-2 ${viewType === 'list' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                        >
                            <span className="material-icons text-xs">list</span> 列表
                        </button>
                        <button
                            onClick={() => setViewType('quadrant')}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all flex items-center gap-2 ${viewType === 'quadrant' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                        >
                            <span className="material-icons text-xs">grid_view</span> 四象限
                        </button>
                    </div>
                </div>

                {viewType === 'quadrant' ? (
                    <FourQuadrantsView
                        todos={filteredTodos}
                        onToggleTodo={handleToggleWithAnimation}
                        onDeleteTodo={onDeleteTodo}
                        onUpdateTodo={onUpdateTodo}
                        onAddTodo={onAddTodo}
                    />
                ) : (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex-1 overflow-y-auto px-6 lg:px-8 space-y-px">
                            {filteredTodos.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                                    <span className="material-icons text-5xl mb-4 opacity-30">
                                        {activeList === 'completed' ? 'task_alt' : 'inbox'}
                                    </span>
                                    <p className="text-sm font-bold">
                                        {activeList === 'completed' ? '暂无已完成的待办' : '当前没有待办事项'}
                                    </p>
                                    <p className="text-xs mt-1 opacity-60">
                                        {activeList === 'completed' ? '完成的待办会自动归档到这里' : '在下方添加新的待办吧'}
                                    </p>
                                </div>
                            )}
                            {filteredTodos.map((todo) => (
                                <div
                                    key={todo.id}
                                    className={`group flex items-start gap-4 py-3 border-b border-white/5 transition-all duration-500 ${justCompletedIds.has(todo.id) ? 'opacity-0 translate-x-8 scale-95' : ''} ${todo.completed ? 'opacity-60' : ''}`}
                                >
                                    <div className="relative flex items-start gap-4 flex-1">
                                        <div className={`absolute -left-4 top-1 bottom-1 w-1 rounded-full ${PRIORITY_MAP[todo.priority || TodoPriority.P3].color}`}></div>

                                        <button
                                            onClick={() => handleToggleWithAnimation(todo.id)}
                                            className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${todo.completed ? 'bg-primary border-primary text-white' : 'border-slate-700 hover:border-primary/50'}`}
                                        >
                                            {todo.completed && <span className="material-icons text-[14px]">check</span>}
                                        </button>

                                        <div className="flex-1 min-w-0">
                                            {editingTodoId === todo.id ? (
                                                <div className="flex flex-col gap-2 p-3 bg-white/5 rounded-xl border border-white/10 mt-1">
                                                    <input
                                                        type="text"
                                                        value={editContent}
                                                        onChange={(e) => setEditContent(e.target.value)}
                                                        className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary w-full"
                                                        placeholder="待办内容..."
                                                        autoFocus
                                                    />
                                                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                                                        <select
                                                            value={editList}
                                                            onChange={(e) => setEditList(e.target.value)}
                                                            className="bg-black/20 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-primary"
                                                        >
                                                            {customLists.map(l => <option key={l} value={l}>{l}</option>)}
                                                            {!customLists.includes(editList) && <option value={editList}>{editList}</option>}
                                                        </select>
                                                        <div className="flex items-center gap-1 bg-black/20 rounded-lg p-1 border border-white/10">
                                                            {(Object.entries(PRIORITY_MAP) as [TodoPriority, any][]).map(([p, info]) => (
                                                                <button
                                                                    key={p}
                                                                    onClick={() => setEditPriority(p)}
                                                                    className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${editPriority === p ? 'bg-white/10' : 'hover:bg-white/5'}`}
                                                                    title={info.label}
                                                                >
                                                                    <div className={`w-2 h-2 rounded-full ${info.color} ${editPriority === p ? 'scale-125' : 'opacity-50'}`}></div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                        <div className="flex-1"></div>
                                                        <button onClick={() => setEditingTodoId(null)} className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-transparent hover:border-white/10 hover:bg-white/5 transition-all">取消</button>
                                                        <button onClick={saveEdit} className="text-xs text-white bg-primary hover:brightness-110 px-4 py-1.5 rounded-lg shadow-lg shadow-primary/20 transition-all font-bold">保存</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <p className={`text-sm text-white font-medium break-words mt-0.5 ${todo.completed ? 'line-through text-slate-500' : ''}`}>
                                                        {todo.content}
                                                    </p>
                                                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-500 font-bold flex-wrap">
                                                        {todo.completed && todo.completedAt ? (
                                                            <>
                                                                <span className="flex items-center gap-1 text-green-500/70">
                                                                    <span className="material-icons text-[11px]">check_circle</span>
                                                                    {new Date(todo.completedAt).toLocaleDateString()} 完成
                                                                </span>
                                                                <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5">{todo.listName}</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span className="flex items-center gap-1">
                                                                    <span className="material-icons text-[11px]">calendar_today</span>
                                                                    {new Date(todo.createdAt).toLocaleDateString()}
                                                                </span>
                                                                <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5">{todo.listName}</span>
                                                                <span className={`px-1.5 py-0.5 rounded bg-white/5 border border-white/5 flex items-center gap-1 ${PRIORITY_MAP[todo.priority || TodoPriority.P3].text}`}>
                                                                    <div className={`w-1.5 h-1.5 rounded-full ${PRIORITY_MAP[todo.priority || TodoPriority.P3].color}`}></div>
                                                                    {PRIORITY_MAP[todo.priority || TodoPriority.P3].label}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {editingTodoId !== todo.id && (
                                            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 flex-shrink-0 transition-opacity">
                                                <button
                                                    onClick={() => startEditing(todo)}
                                                    className="p-2 text-slate-500 hover:text-primary transition-all rounded-lg hover:bg-primary/10"
                                                    title="编辑待办属性"
                                                >
                                                    <span className="material-icons text-sm">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => onDeleteTodo(todo.id)}
                                                    className="p-2 text-slate-500 hover:text-danger transition-all rounded-lg hover:bg-danger/10"
                                                    title="删除待办"
                                                >
                                                    <span className="material-icons text-sm">delete</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-6 lg:px-8 border-t border-white/5 bg-slate-900/20">
                            <form onSubmit={handleAdd}>
                                <div className="flex flex-col gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 focus-within:border-primary/30 transition-all shadow-xl">
                                    <div className="flex items-center gap-3">
                                        <span className="material-icons text-slate-600">add</span>
                                        <input
                                            type="text"
                                            placeholder="在此添加新待办..."
                                            value={newTodoInput}
                                            onChange={(e) => setNewTodoInput(e.target.value)}
                                            className="flex-1 bg-transparent border-none focus:ring-0 text-sm p-0 placeholder-slate-600 text-white font-medium shadow-none"
                                        />
                                    </div>

                                    <div className="flex flex-wrap items-center justify-between border-t border-white/5 pt-3 gap-y-3">
                                        <div className="flex items-center gap-2">
                                            {(Object.entries(PRIORITY_MAP) as [TodoPriority, any][]).map(([p, info]) => (
                                                <button
                                                    key={p}
                                                    type="button"
                                                    onClick={() => setSelectedPriority(p)}
                                                    className={`group/p relative w-7 h-7 rounded-lg flex items-center justify-center transition-all ${selectedPriority === p ? 'bg-white/10 ring-1 ring-white/20' : 'hover:bg-white/5 opacity-40 hover:opacity-100'}`}
                                                    title={info.label}
                                                >
                                                    <div className={`w-3 h-3 rounded-full ${info.color} ${selectedPriority === p ? 'scale-125' : ''} transition-transform`}></div>
                                                </button>
                                            ))}
                                            <span className="text-[10px] text-slate-400 font-bold ml-2 uppercase tracking-tight hidden sm:inline-block">
                                                {PRIORITY_MAP[selectedPriority].label}
                                            </span>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={!newTodoInput.trim()}
                                            className="px-6 py-2 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:brightness-110 disabled:opacity-30 transition-all shadow-lg shadow-primary/20"
                                        >
                                            保存待办
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default TodoView;
