import React, { useState } from 'react';
import { User } from '../types';

interface LoginViewProps {
    onLoginSuccess: (user: User) => void;
    onSwitchToRegister: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, onSwitchToRegister }) => {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!phone || !password) {
            setError('请输入手机号和密码');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('http://localhost:8000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ phone, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || '登录失败');
            }

            onLoginSuccess(data.user);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-20 px-4">
            <div className="bg-surface-dark rounded-[2rem] border border-slate-800 p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none select-none">
                    <span className="material-icons text-8xl">login</span>
                </div>

                <div className="relative z-10">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl font-black text-white mb-2">欢迎回来</h2>
                        <p className="text-slate-500 text-sm">登录以访问您的工作台</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <input
                                type="text"
                                placeholder="手机号码"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl py-3.5 px-5 text-white text-sm focus:border-primary focus:outline-none transition-all"
                            />
                        </div>

                        <div>
                            <input
                                type="password"
                                placeholder="密码"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl py-3.5 px-5 text-white text-sm focus:border-primary focus:outline-none transition-all"
                            />
                        </div>

                        {error && (
                            <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs font-bold flex items-center gap-2">
                                <span className="material-icons text-base">error_outline</span>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 rounded-2xl bg-primary text-white font-black shadow-lg shadow-primary/20 hover:bg-primary-hover active:scale-95 transition-all text-base disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? '登录中...' : '登录'}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-slate-500 text-xs">
                            还没有账户？{' '}
                            <button
                                onClick={onSwitchToRegister}
                                className="text-primary font-bold hover:underline"
                            >
                                立即注册
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginView;
