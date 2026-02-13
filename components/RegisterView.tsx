import { User } from '../types';
import { API_BASE_URL } from '../aiService';

interface RegisterViewProps {
    onRegisterSuccess: (user: User) => void;
    onSwitchToLogin: () => void;
}

const RegisterView: React.FC<RegisterViewProps> = ({ onRegisterSuccess, onSwitchToLogin }) => {
    const [username, setUsername] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    phone,
                    email,
                    password
                }),
            });

            const data = await response.json();
            if (response.ok && data.success) {
                onRegisterSuccess(data.user);
            } else {
                setError(data.detail || '注册失败，请检查输入信息');
            }
        } catch (err) {
            setError('连接服务器失败，请稍后重试');
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
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl"></div>

                    <div className="relative z-10">
                        <div className="text-center mb-10">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-primary/20 text-primary mb-6 shadow-xl shadow-primary/10">
                                <span className="material-icons text-3xl">person_add_alt</span>
                            </div>
                            <h2 className="text-3xl font-black text-white tracking-tight mb-2">创建账户</h2>
                            <p className="text-slate-400 text-sm font-medium">开启您的 AI 生产力之旅</p>
                        </div>

                        {error && (
                            <div className="bg-danger/10 border border-danger/30 text-danger text-xs px-4 py-3 rounded-2xl mb-6 flex items-center gap-2 animate-in fade-in zoom-in-95">
                                <span className="material-icons text-sm">error</span>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleRegister} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">用户名</label>
                                <div className="group relative">
                                    <span className="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg transition-colors group-focus-within:text-primary">person</span>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-6 text-white text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                        placeholder="您的名称"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">手机号码 (中国大陆)</label>
                                <div className="group relative">
                                    <span className="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg transition-colors group-focus-within:text-primary">smartphone</span>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-6 text-white text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                        placeholder="138xxxx8888"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">电子邮箱 (身份验证)</label>
                                <div className="group relative">
                                    <span className="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg transition-colors group-focus-within:text-primary">mail</span>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-6 text-white text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                        placeholder="example@mail.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">设置密码</label>
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
                                    <>立即注册 <span className="material-icons text-sm">arrow_forward</span></>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 text-center">
                            <button
                                onClick={onSwitchToLogin}
                                className="text-xs text-slate-500 hover:text-white transition-colors flex items-center gap-1 mx-auto"
                            >
                                已有账户? <span className="text-primary font-bold">直接登录</span>
                            </button>
                        </div>
                    </div>
                </div>

                <p className="mt-8 text-center text-[10px] text-slate-600 px-6 leading-relaxed">
                    点击注册即代表您同意我们的 <span className="text-slate-400 hover:underline cursor-pointer">服务协议</span> 与 <span className="text-slate-400 hover:underline cursor-pointer">隐私政策</span>
                </p>
            </div>
        </div>
    );
};

export default RegisterView;
