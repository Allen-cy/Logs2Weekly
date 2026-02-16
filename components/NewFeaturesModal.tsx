import React, { useState, useEffect } from 'react';

interface NewFeaturesModalProps {
    onClose: () => void;
}

const NewFeaturesModal: React.FC<NewFeaturesModalProps> = ({ onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const features = [
        {
            icon: 'translate',
            title: '全量中文化 (V3.0)',
            desc: '告别英文焦虑！现在整个应用（包括设置、图表、周报）已全面支持简体中文。',
            color: 'text-primary',
            bg: 'bg-primary/10'
        },
        {
            icon: 'hub',
            title: '多模型矩阵支持',
            desc: '集成 Google Gemini、Moonshot Kimi、智谱 GLM 和通义千问，支持自主切换引擎。',
            color: 'text-amber-400',
            bg: 'bg-amber-400/10'
        },
        {
            icon: 'insights',
            title: '全新数据洞察看板',
            desc: '通过交互式图表分析您的领域分布、产出趋势，科学量化个人生产力。',
            color: 'text-blue-400',
            bg: 'bg-blue-400/10'
        },
        {
            icon: 'cloud_done',
            title: '周报历史归档系统',
            desc: '每一份总结都值得珍藏。现在您可以一键保存生成的周报至云端历史库。',
            color: 'text-success',
            bg: 'bg-success/10'
        }
    ];

    return (
        <div className={`fixed inset-0 z-[110] flex items-center justify-center p-4 transition-all duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />

            <div className={`relative bg-surface-dark border border-white/5 w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden transition-all duration-700 transform ${isVisible ? 'translate-y-0 scale-100' : 'translate-y-12 scale-95'}`}>
                {/* Header Decoration */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-primary/20 to-transparent pointer-events-none" />

                <div className="relative p-8 sm:p-10">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-4">
                            Major Update
                        </div>
                        <h2 className="text-3xl font-black text-white mb-2">发现新功能</h2>
                        <p className="text-slate-400 text-sm">为您打造更智能、更亲和的生产力中心</p>
                    </div>

                    <div className="space-y-6 mb-10">
                        {features.map((f, i) => (
                            <div key={i} className="flex gap-4 group">
                                <div className={`flex-shrink-0 w-12 h-12 rounded-2xl ${f.bg} ${f.color} flex items-center justify-center shadow-lg transition-transform group-hover:scale-110`}>
                                    <span className="material-icons text-2xl">{f.icon}</span>
                                </div>
                                <div className="pt-1">
                                    <h4 className="text-white font-bold text-base mb-1">{f.title}</h4>
                                    <p className="text-slate-400 text-xs leading-relaxed">{f.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full bg-primary hover:bg-primary-hover text-white font-black py-5 rounded-3xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        立即体验新版本 <span className="material-icons text-sm">rocket_launch</span>
                    </button>

                    <p className="text-center mt-6 text-[10px] text-slate-600 font-medium">
                        Log2Weekly v3.0.0 • 专注于您的每一刻成长
                    </p>
                </div>
            </div>
        </div>
    );
};

export default NewFeaturesModal;
