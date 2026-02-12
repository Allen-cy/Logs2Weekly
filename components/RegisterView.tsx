import React, { useState } from 'react';
import { User } from '../types';

interface RegisterViewProps {
    onRegisterSuccess: (user: User) => void;
    onSwitchToLogin: () => void;
}

const RegisterView: React.FC<RegisterViewProps> = ({ onRegisterSuccess, onSwitchToLogin }) => {
    const [username, setUsername] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const validatePhone = (phone: string) => {
        return /^1[3-9]\d{9}$/.test(phone);
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!username || !phone || !password) {
            setError('所有字段都为必填项');
            return;
        }

        if (!validatePhone(phone)) {
            setError('请输入有效的中国大陆手机号码');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('http://localhost:8000/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, phone, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || '注册失败');
            }

            onRegisterSuccess(data.user);
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
                    <span className="material-icons text-8xl">person_add</span>
                </div>

                <div className="relative z-10">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl font-black text-white mb-2">创建账户</h2>
                        <p className="text-slate-500 text-sm">开启您的 AI 生产力之旅</p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-6">
                        <div>
                            <input
                                type="text"
                                placeholder="用户名"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl py-3.5 px-5 text-white text-sm focus:border-primary focus:outline-none transition-all"
                            />
                        </div>

                        <div>
                            <input
                                type="text"
                                placeholder="手机号码 (中国大陆)"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl py-3.5 px-5 text-white text-sm focus:border-primary focus:outline-none transition-all"
                            />
                        </div>

                        <div>
                            <input
                                type="password"
                                placeholder="设置密码"
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
                            {loading ? '注册中...' : '立即注册'}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-slate-500 text-xs">
                            已有账户？{' '}
                            <button
                                onClick={onSwitchToLogin}
                                className="text-primary font-bold hover:underline"
                            >
                                直接登录
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterView;
