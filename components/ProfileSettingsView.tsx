import React, { useState } from 'react';
import { User, AppConfig } from '../types';
import { API_BASE_URL } from '../aiService';

interface ProfileSettingsViewProps {
    user: User;
    onUpdateUser: (user: User) => void;
    config: AppConfig;
    onUpdateConfig: (config: AppConfig) => void;
    onLogout: () => void;
    onBack: () => void;
}

const ProfileSettingsView: React.FC<ProfileSettingsViewProps> = ({
    user,
    onUpdateUser,
    config,
    onUpdateConfig,
    onLogout,
    onBack
}) => {
    const [username, setUsername] = useState(user.username);
    const [email, setEmail] = useState(user.email || '');
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

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
        <div className="max-w-4xl mx-auto px-6 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 mb-12">
                <button
                    onClick={onBack}
                    className="w-12 h-12 rounded-2xl bg-slate-800/50 hover:bg-slate-700/50 text-white flex items-center justify-center transition-all"
                >
                    <span className="material-icons">arrow_back</span>
                </button>
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">个人中心</h1>
                    <p className="text-slate-500 text-sm font-medium">管理您的账户安全与偏好设置</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Sidebar */}
                <div className="space-y-4">
                    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 text-center shadow-xl">
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

                    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 shadow-xl">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                            <span className="material-icons text-base text-primary">auto_awesome</span>
                            当前 AI 配置
                        </h3>
                        <div className="space-y-4">
                            <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800">
                                <p className="text-[10px] font-black text-slate-600 uppercase mb-1">提供商</p>
                                <p className="text-white text-sm font-bold capitalize">{config.provider}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800">
                                <p className="text-[10px] font-black text-slate-600 uppercase mb-1">模型</p>
                                <p className="text-white text-sm font-bold">{config.modelName || '未设置'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="md:col-span-2 space-y-8">
                    {message.text && (
                        <div className={`p-4 rounded-2xl animate-in zoom-in-95 flex items-center gap-3 text-xs font-bold border ${message.type === 'success' ? 'bg-success/10 border-success/30 text-success' : 'bg-danger/10 border-danger/30 text-danger'
                            }`}>
                            <span className="material-icons text-base">{message.type === 'success' ? 'check_circle' : 'error'}</span>
                            {message.text}
                        </div>
                    )}

                    {/* Profile Form */}
                    <section className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-10 shadow-xl">
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
                                    <label className="text-[10px] font-black text-slate-500 uppercase ml-4">电子邮箱</label>
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
                    <section className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-10 shadow-xl">
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
                </div>
            </div>
        </div>
    );
};

export default ProfileSettingsView;
