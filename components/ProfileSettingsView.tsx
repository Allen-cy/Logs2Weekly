import React, { useState } from 'react';
import { User, AppConfig } from '../types';
import { API_BASE_URL } from '../aiService';
import UpdateHistoryModal, { APP_VERSION } from './UpdateHistoryModal';
import FeedbackModal from './FeedbackModal';
import AdminFeedbackPanel from './AdminFeedbackPanel';

interface ProfileSettingsViewProps {
    user: User;
    onUpdateUser: (user: User) => void;
    config: AppConfig;
    onUpdateConfig: (config: AppConfig) => void;
    onLogout: () => void;
    onBack: () => void;
    onViewMessages?: () => void;
}

const ProfileSettingsView: React.FC<ProfileSettingsViewProps> = ({
    user,
    onUpdateUser,
    config,
    onUpdateConfig,
    onLogout,
    onBack,
    onViewMessages
}) => {
    const [username, setUsername] = useState(user.username);
    const [email, setEmail] = useState(user.email || '');
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [retentionDays, setRetentionDays] = useState(config.archiveRetentionDays || 15);
    const [hotkey, setHotkey] = useState(config.globalHotkey || 'Alt+M');
    const [todoHotkey, setTodoHotkey] = useState(config.todoHotkey || 'Alt+J');
    const [recordingTarget, setRecordingTarget] = useState<'log' | 'todo' | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [showUpdateHistory, setShowUpdateHistory] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [showAdminPanel, setShowAdminPanel] = useState(false);

    const ADMIN_IDENTIFIERS = ['chongzhengchai@gmail.com', '19331651682'];
    const isAuthor = ADMIN_IDENTIFIERS.includes(user.email || '') || ADMIN_IDENTIFIERS.includes(user.username || '') || ADMIN_IDENTIFIERS.includes(user.phone || '');

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdating(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await fetch(`${API_BASE_URL}/user/profile?user_id=${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email }),
            });
            const data = await response.json();
            if (response.ok) {
                onUpdateUser({ ...user, username, email });
                setMessage({ type: 'success', text: '个人资料已更新' });
            } else {
                setMessage({ type: 'error', text: data.detail || '更新失败' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: '连接服务器失败' });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!oldPassword || !newPassword) return;
        setIsUpdating(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await fetch(`${API_BASE_URL}/user/password?user_id=${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
            });
            const data = await response.json();
            if (response.ok) {
                setMessage({ type: 'success', text: '密码修改成功' });
                setOldPassword('');
                setNewPassword('');
            } else {
                setMessage({ type: 'error', text: data.detail || '旧密码不正确' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: '连接服务器失败' });
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-3 sm:px-6 py-8 sm:py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 sm:gap-4 mb-8 sm:mb-12">
                <button
                    onClick={onBack}
                    className="w-12 h-12 rounded-2xl bg-slate-800/50 hover:bg-slate-700/50 text-white flex items-center justify-center transition-all"
                >
                    <span className="material-icons">arrow_back</span>
                </button>
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">个人中心</h1>
                    <p className="text-slate-500 text-sm font-medium">管理您的账户安全与偏好设置</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                {/* Sidebar */}
                <div className="space-y-4">
                    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl sm:rounded-[2rem] p-6 sm:p-8 text-center shadow-xl">
                        <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-tr from-primary to-purple-500 mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-primary/20">
                            <span className="text-4xl font-black text-white">{user.username.charAt(0).toUpperCase()}</span>
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">{user.username}</h2>
                        <p className="text-slate-500 text-xs mb-8">{user.phone}</p>

                        <button
                            onClick={onLogout}
                            className="w-full py-4 rounded-2xl border border-danger/30 text-danger hover:bg-danger/10 font-bold text-sm transition-all flex items-center justify-center gap-2"
                        >
                            <span className="material-icons text-base">logout</span>
                            退出登录
                        </button>
                    </div>

                    <div className="bg-gradient-to-br from-slate-900/60 to-slate-950/60 backdrop-blur-xl border border-white/5 rounded-2xl sm:rounded-[2rem] p-6 sm:p-8 shadow-xl">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                            <span className="material-icons text-base text-primary">info</span>
                            账户状态
                        </h3>
                        <div className="space-y-4">
                            <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800">
                                <p className="text-[10px] font-black text-slate-600 uppercase mb-1">注册时间</p>
                                <p className="text-white text-sm font-bold">已在云端持久化</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800">
                                <div className="flex justify-between items-start mb-1">
                                    <p className="text-[10px] font-black text-slate-600 uppercase">系统版本</p>
                                    <span className="text-[9px] font-bold text-success bg-success/10 px-1.5 py-0.5 rounded cursor-default border border-success/20">Current</span>
                                </div>
                                <p className="text-primary text-sm font-bold mb-3">v{APP_VERSION}</p>
                                <button
                                    onClick={() => {
                                        setIsUpdating(true);
                                        // 模拟查更延迟，实际现在通过 UpdateHistoryModal 静态展示
                                        setTimeout(() => {
                                            setIsUpdating(false);
                                            setShowUpdateHistory(true);
                                            setMessage({ type: 'success', text: '正在获取最新版本信息...' });
                                        }, 600);
                                    }}
                                    disabled={isUpdating}
                                    className="w-full py-2.5 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black hover:bg-white/10 text-slate-400 hover:text-white transition-all flex items-center justify-center gap-2"
                                >
                                    <span className="material-icons text-xs">refresh</span>
                                    {isUpdating ? '检查中...' : '检查更新'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="md:col-span-2 space-y-6 sm:space-y-8">
                    {message.text && (
                        <div className={`p-4 rounded-2xl animate-in zoom-in-95 flex items-center gap-3 text-xs font-bold border ${message.type === 'success' ? 'bg-success/10 border-success/30 text-success' : 'bg-danger/10 border-danger/30 text-danger'
                            }`}>
                            <span className="material-icons text-base">{message.type === 'success' ? 'check_circle' : 'error'}</span>
                            {message.text}
                        </div>
                    )}

                    {/* Profile Form */}
                    <section className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-10 shadow-xl">
                        <h3 className="text-xl font-black text-white mb-8 flex items-center gap-3">
                            <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                            基础资料
                        </h3>
                        <form onSubmit={handleUpdateProfile} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase ml-4">昵称</label>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 px-6 text-white text-sm focus:border-primary outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between ml-4">
                                        <label className="text-[10px] font-black text-slate-500 uppercase">电子邮箱</label>
                                        {user.email && (
                                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${user.email_verified ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}`}>
                                                {user.email_verified ? '已验证' : '待验证'}
                                            </span>
                                        )}
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 px-6 text-white text-sm focus:border-primary outline-none transition-all"
                                        placeholder="尚未绑定邮箱"
                                    />
                                </div>
                            </div>
                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={isUpdating}
                                    className="bg-white text-slate-950 px-8 py-4 rounded-2xl font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-50"
                                >
                                    保存资料修改
                                </button>
                            </div>
                        </form>
                    </section>

                    {/* Password Form */}
                    <section className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-10 shadow-xl">
                        <h3 className="text-xl font-black text-white mb-8 flex items-center gap-3">
                            <span className="w-1.5 h-6 bg-purple-500 rounded-full"></span>
                            安全设置
                        </h3>
                        <form onSubmit={handleChangePassword} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase ml-4">当前密码</label>
                                    <input
                                        type="password"
                                        value={oldPassword}
                                        onChange={(e) => setOldPassword(e.target.value)}
                                        className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 px-6 text-white text-sm focus:border-primary outline-none transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase ml-4">新密码</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 px-6 text-white text-sm focus:border-primary outline-none transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={isUpdating}
                                    className="bg-slate-800 text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-slate-700 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    更新安全密码
                                </button>
                            </div>
                        </form>
                    </section>

                    {/* App Behavior Settings */}
                    <section className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-10 shadow-xl">
                        <h3 className="text-xl font-black text-white mb-8 flex items-center gap-3">
                            <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                            功能偏好
                        </h3>
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center ml-4">
                                    <label className="text-[10px] font-black text-slate-500 uppercase">已归档留存时长 ({retentionDays} 天)</label>
                                    <span className="text-[10px] text-slate-400">聚合后的原始碎片将保留此时长</span>
                                </div>
                                <div className="px-4">
                                    <input
                                        type="range"
                                        min="1"
                                        max="365"
                                        value={retentionDays}
                                        onChange={(e) => setRetentionDays(parseInt(e.target.value))}
                                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                    <div className="flex justify-between text-[9px] text-slate-600 font-bold mt-2 uppercase tracking-tighter">
                                        <span>1 天</span>
                                        <span>15 天 (默认)</span>
                                        <span>90 天</span>
                                        <span>180 天</span>
                                        <span>365 天</span>
                                    </div>
                                </div>
                            </div>

                            {/* 桌面端快捷键设置 - 录制器模式 */}
                            {typeof window !== 'undefined' && (window as any).ipcRenderer && (
                                <div className="space-y-6 pt-6 border-t border-white/5">
                                    {/* Log Hotkey */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end ml-4">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2">
                                                    <span className="material-icons text-xs text-primary">edit_note</span>
                                                    极速记录呼出热键 (Log)
                                                </label>
                                                <p className="text-[10px] text-slate-400 mt-1">当前: {hotkey}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setRecordingTarget('log')}
                                                    className={`px-4 py-2 rounded-xl font-bold text-[10px] transition-all flex items-center gap-1.5 ${recordingTarget === 'log' ? 'bg-primary text-white animate-pulse' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                                                >
                                                    <span className="material-icons text-sm">{recordingTarget === 'log' ? 'stop_circle' : 'fiber_manual_record'}</span>
                                                    {recordingTarget === 'log' ? '正在录制...' : '录制新热键'}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="px-4 relative group">
                                            <div className={`w-full bg-slate-950/60 border-2 rounded-2xl py-6 flex items-center justify-center transition-all ${recordingTarget === 'log' ? 'border-primary ring-4 ring-primary/20 shadow-2xl' : 'border-slate-800 hover:border-slate-700'}`}>
                                                <span className="text-3xl font-black text-white tracking-widest font-mono uppercase">
                                                    {hotkey}
                                                </span>
                                                {recordingTarget === 'log' && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 rounded-2xl z-10">
                                                        <div className="text-center">
                                                            <p className="text-primary font-black text-sm mb-2 animate-bounce">请按下组合键</p>
                                                            <p className="text-slate-500 text-[10px]">支持 Cmd/Alt/Shift/Control + 按键</p>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setRecordingTarget(null); }}
                                                                className="mt-4 text-[10px] text-slate-600 underline"
                                                            >
                                                                取消录制
                                                            </button>
                                                        </div>
                                                        <input
                                                            autoFocus
                                                            className="absolute inset-0 opacity-0 cursor-default"
                                                            onKeyDown={(e) => {
                                                                e.preventDefault();
                                                                const keys = [];
                                                                if (e.metaKey) keys.push('Cmd');
                                                                if (e.ctrlKey) keys.push('Control');
                                                                if (e.altKey) keys.push('Alt');
                                                                if (e.shiftKey) keys.push('Shift');
                                                                const key = e.key === ' ' ? 'Space' : e.key;
                                                                if (!['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
                                                                    const newHotkey = [...keys, key.charAt(0).toUpperCase() + key.slice(1)].join('+');
                                                                    setHotkey(newHotkey);
                                                                    setRecordingTarget(null);
                                                                    (window as any).ipcRenderer.send('set-hotkey', newHotkey);
                                                                    (window as any).ipcRenderer.once('set-hotkey-result', (_: any, res: { success: boolean, hotkey: string }) => {
                                                                        if (res.success) {
                                                                            setMessage({ type: 'success', text: `记录热键已激活: ${res.hotkey}` });
                                                                        } else {
                                                                            setMessage({ type: 'error', text: `注册失败，可能是系统冲突` });
                                                                        }
                                                                    });
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Todo Hotkey */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end ml-4">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2">
                                                    <span className="material-icons text-xs text-success">task_alt</span>
                                                    极速待办呼出热键 (Todo)
                                                </label>
                                                <p className="text-[10px] text-slate-400 mt-1">当前: {todoHotkey}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setRecordingTarget('todo')}
                                                    className={`px-4 py-2 rounded-xl font-bold text-[10px] transition-all flex items-center gap-1.5 ${recordingTarget === 'todo' ? 'bg-success text-white animate-pulse' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                                                >
                                                    <span className="material-icons text-sm">{recordingTarget === 'todo' ? 'stop_circle' : 'fiber_manual_record'}</span>
                                                    {recordingTarget === 'todo' ? '正在录制...' : '录制新热键'}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="px-4 relative group">
                                            <div className={`w-full bg-slate-950/60 border-2 rounded-2xl py-6 flex items-center justify-center transition-all ${recordingTarget === 'todo' ? 'border-success ring-4 ring-success/20 shadow-2xl' : 'border-slate-800 hover:border-slate-700'}`}>
                                                <span className="text-3xl font-black text-white tracking-widest font-mono uppercase">
                                                    {todoHotkey}
                                                </span>
                                                {recordingTarget === 'todo' && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 rounded-2xl z-10">
                                                        <div className="text-center">
                                                            <p className="text-success font-black text-sm mb-2 animate-bounce">请按下组合键</p>
                                                            <p className="text-slate-500 text-[10px]">支持 Cmd/Alt/Shift/Control + 按键</p>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setRecordingTarget(null); }}
                                                                className="mt-4 text-[10px] text-slate-600 underline"
                                                            >
                                                                取消录制
                                                            </button>
                                                        </div>
                                                        <input
                                                            autoFocus
                                                            className="absolute inset-0 opacity-0 cursor-default"
                                                            onKeyDown={(e) => {
                                                                e.preventDefault();
                                                                const keys = [];
                                                                if (e.metaKey) keys.push('Cmd');
                                                                if (e.ctrlKey) keys.push('Control');
                                                                if (e.altKey) keys.push('Alt');
                                                                if (e.shiftKey) keys.push('Shift');
                                                                const key = e.key === ' ' ? 'Space' : e.key;
                                                                if (!['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
                                                                    const newHotkey = [...keys, key.charAt(0).toUpperCase() + key.slice(1)].join('+');
                                                                    setTodoHotkey(newHotkey);
                                                                    setRecordingTarget(null);
                                                                    (window as any).ipcRenderer.send('set-todo-hotkey', newHotkey);
                                                                    (window as any).ipcRenderer.once('set-todo-hotkey-result', (_: any, res: { success: boolean, hotkey: string }) => {
                                                                        if (res.success) {
                                                                            setMessage({ type: 'success', text: `待办热键已激活: ${res.hotkey}` });
                                                                        } else {
                                                                            setMessage({ type: 'error', text: `注册失败，可能是系统冲突` });
                                                                        }
                                                                    });
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-slate-600 ml-4 italic">* 建议使用组合键（如 Ctrl+M / Ctrl+J）避免按键冲突。</p>
                                </div>
                            )}

                            <div className="pt-4">
                                <button
                                    onClick={async () => {
                                        setIsUpdating(true);
                                        try {
                                            const newConfig = { ...config, archiveRetentionDays: retentionDays, globalHotkey: hotkey, todoHotkey: todoHotkey };
                                            // Handle persistence for hotkey separately in localStorage for now
                                            localStorage.setItem('globalHotkey', hotkey);
                                            localStorage.setItem('todoHotkey', todoHotkey);

                                            const response = await fetch(`${API_BASE_URL}/user/config?user_id=${user.id}`, {
                                                method: 'PUT',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    provider: newConfig.provider,
                                                    model_name: newConfig.modelName,
                                                    api_key: newConfig.apiKey,
                                                    archive_retention_days: retentionDays,
                                                    global_hotkey: hotkey,
                                                    todo_hotkey: todoHotkey
                                                }),
                                            });
                                            if (response.ok) {
                                                onUpdateConfig(newConfig);
                                                setMessage({ type: 'success', text: '项偏好设置已保存并同步至云端' });
                                            }
                                        } catch (err) {
                                            setMessage({ type: 'error', text: '保存失败' });
                                        } finally {
                                            setIsUpdating(false);
                                        }
                                    }}
                                    className="bg-primary/20 text-primary border border-primary/30 px-8 py-4 rounded-2xl font-black text-sm hover:bg-primary/30 active:scale-95 transition-all shadow-xl"
                                >
                                    应用所有偏好设置
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* System Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 sm:mt-8">
                        <button
                            onClick={() => setShowUpdateHistory(true)}
                            className="flex-1 bg-slate-900/40 backdrop-blur-xl border border-white/5 hover:bg-white/5 transition-colors rounded-2xl p-6 shadow-xl flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <span className="material-icons">history</span>
                                </div>
                                <div className="text-left">
                                    <h4 className="text-white font-bold text-sm">版本更新历史</h4>
                                    <p className="text-[10px] text-slate-500 mt-0.5">查看我们一步步走来的足迹</p>
                                </div>
                            </div>
                            <span className="material-icons text-slate-600 group-hover:text-primary transition-colors">chevron_right</span>
                        </button>

                        <button
                            onClick={onViewMessages}
                            className="flex-1 bg-slate-900/40 backdrop-blur-xl border border-white/5 hover:bg-white/5 transition-colors rounded-2xl p-6 shadow-xl flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <span className="material-icons">forum</span>
                                </div>
                                <div className="text-left">
                                    <h4 className="text-white font-bold text-sm">消息管理</h4>
                                    <p className="text-[10px] text-slate-500 mt-0.5">查看系统通知与反馈记录</p>
                                </div>
                            </div>
                            <span className="material-icons text-slate-600 group-hover:text-blue-500 transition-colors">chevron_right</span>
                        </button>

                        <button
                            onClick={() => setShowFeedback(true)}
                            className="flex-1 bg-slate-900/40 backdrop-blur-xl border border-white/5 hover:bg-white/5 transition-colors rounded-2xl p-6 shadow-xl flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <span className="material-icons">campaign</span>
                                </div>
                                <div className="text-left">
                                    <h4 className="text-white font-bold text-sm">吐槽与建议</h4>
                                    <p className="text-[10px] text-slate-500 mt-0.5">你的想法是我进步的动力</p>
                                </div>
                            </div>
                            <span className="material-icons text-slate-600 group-hover:text-amber-500 transition-colors">chevron_right</span>
                        </button>
                    </div>

                    {/* Admin Actions */}
                    {isAuthor && (
                        <div className="mt-4">
                            <button
                                onClick={() => setShowAdminPanel(true)}
                                className="w-full bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 hover:bg-amber-500/20 transition-colors rounded-2xl p-6 shadow-xl flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <span className="material-icons text-xl">admin_panel_settings</span>
                                    </div>
                                    <div className="text-left">
                                        <h4 className="text-amber-500 font-bold text-sm">上帝视角：用户反馈后台</h4>
                                        <p className="text-[10px] text-amber-500/70 mt-0.5">查看产品建议并定向推送系统消息</p>
                                    </div>
                                </div>
                                <span className="material-icons text-amber-500/50 group-hover:text-amber-500 transition-colors">chevron_right</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {showUpdateHistory && (
                <UpdateHistoryModal onClose={() => setShowUpdateHistory(false)} autoTriggered={false} />
            )}

            {showFeedback && (
                <FeedbackModal userId={user.id} onClose={() => setShowFeedback(false)} />
            )}

            {showAdminPanel && (
                <AdminFeedbackPanel user={user} onClose={() => setShowAdminPanel(false)} />
            )}
        </div>
    );
};

export default ProfileSettingsView;
