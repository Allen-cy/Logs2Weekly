import React from 'react';

interface UserManualModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const UserManualModal: React.FC<UserManualModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 font-sans">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="relative bg-[#0f172a] border border-slate-700 w-full max-w-4xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/80 bg-slate-900/90 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <span className="material-icons text-primary text-xl">menu_book</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white leading-tight">用户使用手册</h2>
                            <p className="text-xs text-slate-400">Log2Weekly 交互指南</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors group">
                        <span className="material-icons group-hover:rotate-90 transition-transform">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-10 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent bg-[#0f172a]">

                    {/* Section 1: Intro */}
                    <section className="space-y-4">
                        <div className="bg-gradient-to-r from-primary/10 to-transparent border-l-4 border-primary p-4 rounded-r-lg">
                            <h3 className="text-lg font-bold text-white mb-1">🚀 核心理念</h3>
                            <p className="text-sm text-slate-300 leading-relaxed">
                                **无压记录，自动聚合。** Log2Weekly 旨在帮助您随时捕捉碎片化想法、任务和工作进度。您无需担心整理，只需记录。每晚或每周，AI 将帮您把这些碎片转化为结构化的周报和洞察。
                            </p>
                        </div>
                    </section>

                    {/* Section 2: Features Grid */}
                    <section>
                        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                            <span className="material-icons text-primary text-sm">grid_view</span>
                            主要功能模块
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-primary/30 transition-colors">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="material-icons text-amber-400 text-sm">bolt</span>
                                    <h4 className="font-bold text-slate-200 text-sm">多模型 AI 引擎</h4>
                                </div>
                                <p className="text-xs text-slate-400">
                                    支持 Google Gemini, Moonshot Kimi, 智谱 GLM 及通义千问。您可以根据任务需求，在“助手配置”中随时切换最适合的模型。
                                </p>
                            </div>
                            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-primary/30 transition-colors">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="material-icons text-blue-400 text-sm">analytics</span>
                                    <h4 className="font-bold text-slate-200 text-sm">数据洞察仪表盘</h4>
                                </div>
                                <p className="text-xs text-slate-400">
                                    自动分析工作负载与专注领域。通过环形图和趋势图，直观展现您的生产力波动，帮助您科学调整工作节奏。
                                </p>
                            </div>
                            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-primary/30 transition-colors">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="material-icons text-purple-400 text-sm">history</span>
                                    <h4 className="font-bold text-slate-200 text-sm">周报历史归档</h4>
                                </div>
                                <p className="text-xs text-slate-400">
                                    每一份生成的周报都可以一键保存至云端历史库。您可以随时回溯过去的工作表现，作为绩效回顾或个人复盘的重要依据。
                                </p>
                            </div>
                            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-primary/30 transition-colors">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="material-icons text-green-400 text-sm">reorder</span>
                                    <h4 className="font-bold text-slate-200 text-sm">甘特图时间轴</h4>
                                </div>
                                <p className="text-xs text-slate-400">
                                    任务进度的可视化排列。清晰展现各项工作的起止时间与当前状态（进行中/已完成），让项目进度尽在掌握。
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Section 3: Shortcuts */}
                    <section>
                        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                            <span className="material-icons text-primary text-sm">keyboard</span>
                            快捷键指南
                        </h3>
                        <div className="overflow-hidden rounded-xl border border-slate-700/50">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-slate-800 text-slate-400 font-medium">
                                    <tr>
                                        <th className="px-4 py-3">操作</th>
                                        <th className="px-4 py-3">快捷键</th>
                                        <th className="px-4 py-3">说明</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/50 bg-slate-900/30 text-slate-300">
                                    <tr>
                                        <td className="px-4 py-3">提交记录</td>
                                        <td className="px-4 py-3"><kbd className="bg-slate-700 px-1.5 py-0.5 rounded text-[10px] text-white font-mono">Cmd/Ctrl + Enter</kbd></td>
                                        <td className="px-4 py-3 text-slate-500">在输入框焦点时生效</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3">聚焦搜索</td>
                                        <td className="px-4 py-3"><kbd className="bg-slate-700 px-1.5 py-0.5 rounded text-[10px] text-white font-mono">Cmd/Ctrl + K</kbd></td>
                                        <td className="px-4 py-3 text-slate-500">快速唤起顶部搜索栏</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3">创建任务</td>
                                        <td className="px-4 py-3">输入 <code className="bg-slate-800 px-1 rounded">- [ ] </code></td>
                                        <td className="px-4 py-3 text-slate-500">行首输入，自动标记为待办任务</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3">已完成任务</td>
                                        <td className="px-4 py-3">输入 <code className="bg-slate-800 px-1 rounded">- [x] </code></td>
                                        <td className="px-4 py-3 text-slate-500">行首输入，直接存为 Done 状态</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Section 4: Tips */}
                    <section className="bg-blue-500/5 rounded-xl p-5 border border-blue-500/10">
                        <h3 className="text-sm font-bold text-blue-400 mb-2 flex items-center gap-2">
                            <span className="material-icons text-sm">lightbulb</span>
                            Pro Tips
                        </h3>
                        <ul className="list-disc list-inside space-y-1 text-xs text-slate-400 ml-1">
                            <li>您可以点击任意 Log 卡片右上角的 "转为任务" 将其转化为待办事项。</li>
                            <li>在 "助手配置" 中设置您的 AI 模型偏好 (Kimi 或 Gemini)，以获得最佳生成效果。</li>
                            <li>每日 18:00 后，收纳盒中的内容会被 AI 建议聚合（需点击 "立即生成周报" 按钮）。</li>
                        </ul>
                    </section>

                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 text-center">
                    <p className="text-[10px] text-slate-500">
                        Log2Weekly v1.1.0 • Built with ❤️ for Productivity
                    </p>
                </div>
            </div>
        </div>
    );
};

export default UserManualModal;
