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
                            <p className="text-xs text-slate-400">Log2Weekly User Guide</p>
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
                                    <span className="material-icons text-amber-400 text-sm">edit_note</span>
                                    <h4 className="font-bold text-slate-200 text-sm">无压快记 (Quick Log)</h4>
                                </div>
                                <p className="text-xs text-slate-400">
                                    支持 Markdown 语法。输入 <code className="bg-slate-700 px-1 rounded">- [ ]</code> 自动识别为任务。快捷键 <kbd className="bg-slate-700 px-1.5 py-0.5 rounded text-[10px] text-white font-mono">Cmd/Ctrl + Enter</kbd> 快速提交。
                                </p>
                            </div>
                            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-primary/30 transition-colors">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="material-icons text-blue-400 text-sm">inventory_2</span>
                                    <h4 className="font-bold text-slate-200 text-sm">智能收纳盒 (Inbox)</h4>
                                </div>
                                <p className="text-xs text-slate-400">
                                    所有新记录默认进入右侧收纳盒。AI 会定期（或手动触发）将其聚合整理，归类到主看板中。
                                </p>
                            </div>
                            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-primary/30 transition-colors">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="material-icons text-purple-400 text-sm">auto_awesome</span>
                                    <h4 className="font-bold text-slate-200 text-sm">AI 周报生成</h4>
                                </div>
                                <p className="text-xs text-slate-400">
                                    在 "Weekly Review" 页面，AI (Gemini/Kimi) 会根据您本周的所有记录，自动生成包含执行摘要、重点回顾和下周建议的完整周报。
                                </p>
                            </div>
                            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-primary/30 transition-colors">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="material-icons text-green-400 text-sm">analytics</span>
                                    <h4 className="font-bold text-slate-200 text-sm">进度追踪</h4>
                                </div>
                                <p className="text-xs text-slate-400">
                                    自动统计任务完成率。右侧 "Recent Intensity" 热力图可视化展示您的每日活跃度。
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
                            <li>您可以点击任意 Log 卡片右上角的 "Convert to Task" 将其转化为待办事项。</li>
                            <li>在 "Profile" 中设置您的 AI 模型偏好 (Kimi 或 Gemini)，以获得最佳生成效果。</li>
                            <li>每日 18:00 后，Inbox 中的内容会被 AI 建议聚合（需点击 "立即聚合" 按钮）。</li>
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
