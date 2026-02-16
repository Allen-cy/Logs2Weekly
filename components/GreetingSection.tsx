import React, { useState, useEffect } from 'react';

interface GreetingSectionProps {
    username: string;
}

const GreetingSection: React.FC<GreetingSectionProps> = ({ username }) => {
    const [greeting, setGreeting] = useState('');
    const [dateString, setDateString] = useState('');

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            const hour = now.getHours();

            let greet = '早上好';
            if (hour >= 12 && hour < 18) greet = '下午好';
            else if (hour >= 18) greet = '晚上好';

            setGreeting(greet);

            // 格式: 2024年10月24日 星期三
            const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            setDateString(now.toLocaleDateString('zh-CN', options));
        };

        updateTime();
        // Update every minute to keep date/greeting fresh
        const timer = setInterval(updateTime, 60000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <div>
                <h1 className="text-3xl md:text-4xl font-black text-white drop-shadow-lg mb-2">
                    {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">{username}</span>
                </h1>
                <div className="flex items-center gap-2 text-xs md:text-sm text-slate-400 font-medium bg-slate-800/50 w-fit px-3 py-1 rounded-full border border-slate-700/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
                    系统就绪 • 随时记录
                </div>
            </div>

            <div className="text-left md:text-right bg-surface-dark/40 p-3 rounded-xl border border-white/5 backdrop-blur-sm">
                <div className="text-xl md:text-2xl font-bold text-slate-200 font-mono">{dateString}</div>
                <div className="text-[10px] text-primary font-bold uppercase tracking-widest mt-1 opacity-80">今日愿景</div>
            </div>
        </div>
    );
};

export default GreetingSection;
