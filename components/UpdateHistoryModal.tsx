import React, { useState, useEffect } from 'react';

export const APP_VERSION = '3.1.0';

export const UPDATE_HISTORY = [
    {
        version: '3.1.0',
        date: '2026-03-08',
        features: [
            { icon: 'format_list_bulleted_add', title: '自定义待办列表', desc: '支持新增、重命名、删除待办列表，分类更自由。' },
            { icon: 'edit_note', title: '内联快捷编辑属性', desc: '快速修改待办事项的优先级与归属，所见即所得。' },
            { icon: 'auto_stories', title: '导入 NotebookLM', desc: '一键导出所有笔记与总结为 Markdown 资料库，年终总结PPT/履历整理神器！' },
            { icon: 'campaign', title: '意见反馈与更新推送', desc: '随时向开发者提交意见与建议，并获取第一时间的新功能通知。' }
        ]
    },
    {
        version: '3.0.0',
        date: '2026-03-07',
        features: [
            { icon: 'translate', title: '全量中文化 (V3.0)', desc: '告别英文焦虑！现在整个应用已全面支持简体中文。' },
            { icon: 'hub', title: '多阶段模型矩阵', desc: '集成 Google Gemini、Moonshot Kimi、智谱 GLM 和通义千问，支持自主切换。' },
            { icon: 'cloud_sync', title: '全端云端双向同步', desc: '移动端与桌面端数据无缝对齐，引入历史记录防丢激进打捞机制。' },
            { icon: 'insights', title: '全新数据洞察看板', desc: '通过交互式图表分析您的领域分布、产出趋势，科学量化指标。' }
        ]
    }
];

interface UpdateHistoryModalProps {
    onClose: () => void;
    autoTriggered?: boolean;
}

const UpdateHistoryModal: React.FC<UpdateHistoryModalProps> = ({ onClose, autoTriggered = false }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    return (
        <div className={`fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 transition-all duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />

            <div className={`relative bg-surface-dark border border-white/10 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all duration-700 transform ${isVisible ? 'translate-y-0 scale-100' : 'translate-y-12 scale-95'}`}>
                <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-primary/20 to-transparent pointer-events-none" />

                <div className="relative p-6 sm:p-10 pb-4 flex-shrink-0 text-center">
                    <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-4">
                        {autoTriggered ? '🎉 新版本发布' : '历史更新记录'}
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
                        {autoTriggered ? `发现 ${APP_VERSION} 新功能` : '版本演进史'}
                    </h2>
                    <p className="text-slate-400 text-xs sm:text-sm">我们持续为您构建更智能、更亲和的生产力中心</p>
                </div>

                <div className="relative p-6 sm:px-10 overflow-y-auto overflow-x-hidden flex-1 scrollbar-hide space-y-10">
                    {UPDATE_HISTORY.map((release, idx) => (
                        <div key={release.version} className={`relative ${idx === 0 ? '' : 'opacity-70 saturate-50'}`}>
                            <div className="flex items-center gap-4 mb-6 sticky top-0 bg-surface-dark pb-2 z-10">
                                <h3 className="text-xl font-black text-white">v{release.version}</h3>
                                <div className="flex-1 h-px bg-white/10"></div>
                                <span className="text-xs text-slate-500 font-bold font-mono bg-black/30 px-2 py-1 rounded-md">{release.date}</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {release.features.map((f, i) => (
                                    <div key={i} className="flex gap-4 p-4 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
                                        <div className={`flex-shrink-0 w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 group-hover:bg-primary/20 group-hover:text-primary`}>
                                            <span className="material-icons text-xl">{f.icon}</span>
                                        </div>
                                        <div className="pt-0.5 min-w-0">
                                            <h4 className="text-white font-bold text-sm mb-1 truncate">{f.title}</h4>
                                            <p className="text-slate-400 text-[11px] leading-relaxed line-clamp-2 md:line-clamp-3">{f.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="relative p-6 sm:p-10 pt-4 flex flex-col gap-4 flex-shrink-0 border-t border-white/5 bg-slate-900/50">
                    <button
                        onClick={onClose}
                        className="w-full bg-primary hover:bg-primary-hover text-white font-black py-4 rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        {autoTriggered ? '立即体验新版本' : '关闭窗口'} <span className="material-icons text-sm">{autoTriggered ? 'rocket_launch' : 'close'}</span>
                    </button>
                    <p className="text-center text-[10px] text-slate-600 font-medium tracking-wide">
                        AI Productivity Hub • 专注于您的每一刻成长
                    </p>
                </div>
            </div>
        </div>
    );
};

export default UpdateHistoryModal;
