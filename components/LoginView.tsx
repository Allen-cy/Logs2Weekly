import React, { useState } from 'react';
import { User } from '../types';
import { API_BASE_URL } from '../aiService';

interface LoginViewProps {
    onLoginSuccess: (user: User) => void;
    onSwitchToRegister: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, onSwitchToRegister }) => {
    const [account, setAccount] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ account, password }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                onLoginSuccess(data.user);
            } else {
                setError(data.detail || '登录失败，请检查账号和密码');
            }
        } catch (err: any) {
            console.error('Login error:', err);
            setError(`连接服务器失败: ${err.message || '请检查网络'}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-12">
            <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="bg-slate-900/60 backdrop-blur-3xl rounded-[3rem] border border-white/10 p-10 shadow-2xl relative overflow-hidden">
                    {/* Background Decorative Elements */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>

                    <div className="relative z-10">
                        <div className="text-center mb-10">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-primary/20 text-primary mb-6 shadow-xl shadow-primary/10">
                                <span className="material-icons text-3xl">login</span>
                            </div>
                            <h2 className="text-3xl font-black text-white tracking-tight mb-2">欢迎回来</h2>
                            <p className="text-slate-400 text-sm font-medium">登录以访问您的 AI 助手</p>
                        </div>

                        {error && (
                            <div className="bg-danger/10 border border-danger/30 text-danger text-xs px-4 py-3 rounded-2xl mb-6 flex items-center gap-2 animate-in fade-in zoom-in-95">
                                <span className="material-icons text-sm">error</span>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">账号 (手机号或邮箱)</label>
                                <div className="group relative">
                                    <span className="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg transition-colors group-focus-within:text-primary">account_circle</span>
                                    <input
                                        type="text"
                                        value={account}
                                        onChange={(e) => setAccount(e.target.value)}
                                        className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-6 text-white text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                        placeholder="138... / example@mail.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center px-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">密码</label>
                                    <button type="button" className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline transition-all">忘记密码?</button>
                                </div>
                                <div className="group relative">
                                    <span className="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg transition-colors group-focus-within:text-primary">lock</span>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-6 text-white text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                        placeholder="********"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-primary hover:bg-primary-hover text-white font-black py-5 rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 mt-4"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>立即登录 <span className="material-icons text-sm">arrow_forward</span></>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 text-center">
                            <button
                                onClick={onSwitchToRegister}
                                className="text-xs text-slate-500 hover:text-white transition-colors flex items-center gap-1 mx-auto"
                            >
                                还没有账户? <span className="text-primary font-bold">创建一个</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginView;
