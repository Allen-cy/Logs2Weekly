import React, { useState, useEffect } from 'react';

export const APP_VERSION = '3.4.0';

export const UPDATE_HISTORY = [
    {
        version: '3.4.0',
        date: '2026-03-19',
        features: [
            { icon: 'auto_awesome', title: '智能后台周报归档', desc: '新增全自动周报引擎。每逢周五下午及周末，应用将在后台无感生成周报并云端存档，彻底解决只在本地且忘记存的历史痛点。' },
            { icon: 'sync', title: '多端全域同步', desc: '当任意端触发周报生成后，其他所有设备（Web/App/桌面）将直接在历史记录中获得更新，无需再手动操作保存。' },
            { icon: 'content_paste_go', title: '细节交互优化', desc: '在周报执行摘要下增加全新 Markdown 专属渲染代码区，并提供快捷按钮，实现一键完美拷贝汇报至第三方平台。' },
            { icon: 'bug_report', title: '顽固缺陷抹杀', desc: '彻底修复待办列表重载时异常堆叠出现重复项，以及打钩标记完成时偶现的界面卡死不响应问题，重获极致丝滑流畅。' }
        ]
    },
    {
        version: '3.3.0',
        date: '2026-03-10',
        features: [
            { icon: 'speed', title: '极速记录双模式', desc: '新增独立的无干扰沉浸式透明小窗，直接呼出即可输入，不渲染整个主页面，轻量流畅。' },
            { icon: 'keyboard', title: '独立快捷键分流', desc: '支持 Control/Command+M 呼出日志输入框，Control/Command+J 呼出待办输入框，两组快捷键互不干扰。' },
            { icon: 'hub', title: '主界面状态解耦', desc: '极速输入窗口提交内容后，将利用跨进程 IPC 在后台自动添加数据到主窗口并处理存储请求。' }
        ]
    },
    {
        version: '3.2.2',
        date: '2026-03-09',
        features: [
            { icon: 'tune', title: '默认热键调整', desc: '全局唤起热键默认值改为 Option+M (Alt+M)，单手即可完成盲操，效率与肌肉记忆兼得。' },
            { icon: 'phone_iphone', title: '移动端布局精修', desc: '全面优化了小屏幕下的导航栏、底部标签页、输入区域和卡片间距，手机端体验更丝滑。' },
            { icon: 'desktop_windows', title: '桌面端宽屏适配', desc: '进一步精调了 13 寸到 27 寸屏幕的控件尺寸比例，让每一寸空间都物尽其用。' }
        ]
    },
    {
        version: '3.2.1',
        date: '2026-03-09',
        features: [
            { icon: 'open_with', title: '窗口拖拽支持', desc: '修复了桌面端无法通过顶部导航栏移动窗口的问题，现在可以像原生应用一样自由拖动。' },
            { icon: 'aspect_ratio', title: '自适应宽屏优化', desc: '深度优化了从 13 寸笔记本到 27 寸超宽屏的显示效果，消除两侧多余留白，提升空间利用率。' },
            { icon: 'exit_to_app', title: '退出逻辑修复', desc: '解决了 macOS 下无法正常彻底退出程序的问题，支持 Cmd+Q 与托盘菜单的一键秒退。' }
        ]
    },
    {
        version: '3.2.0',
        date: '2026-03-09',
        features: [
            { icon: 'keyboard', title: '自定义全局热键', desc: '支持在设置页自定义呼出应用的快捷键，修改立即生效，指尖流畅度再进化。' },
            { icon: 'sync_alt', title: '桌面原生偏好同步', desc: '热键设置与功能偏好现已支持云端同步，多台设备间无缝切换工作流。' },
            { icon: 'database', title: '数据库架构升级', desc: '引入 v8 版本数据库模式支持，原生兼容更多桌面端个性化配置项。' }
        ]
    },
    {
        version: '3.1.2',
        date: '2026-03-09',
        features: [
            { icon: 'download', title: '桌面安装包更新', desc: '下载地址已更新为夸克网盘：https://pan.quark.cn/s/a69f3effb41c (内含 M 系列芯片专用版)' },
            { icon: 'history_edu', title: '版本详情同步', desc: '修正了历史版本演进在个人中心的显示延迟，确保多端版本信息实时对齐。' }
        ]
    },
    {
        version: '3.1.1',
        date: '2026-03-09',
        features: [
            { icon: 'desktop_mac', title: 'macOS 桌面客户端', desc: '正式支持 Apple M 系列芯片，提供原生窗口体验与更稳定的性能表现。' },
            { icon: 'auto_mode', title: '任务自动归档', desc: '待办事项完成后将自动移至归档区，配合优雅消失动画，让您的看板始终清爽。' },
            { icon: 'save', title: '视图持久化增强', desc: '智能记忆您最后停留的功能模块，无论是刷新页面还是跨次登录，都能无缝衔接。' },
            { icon: 'settings_ethernet', title: '构建流程优化', desc: '网页版与桌面版构建逻辑解耦，完美兼容 Vercel 自动化部署。' }
        ]
    },
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
    },
    {
        version: '2.1.0',
        date: '2026-02-27',
        features: [
            { icon: 'checklist', title: '苹果风格待办中心', desc: '采用 Apple Reminders 视觉设计，重构待办分类，支持独立收纳与打卡。' },
            { icon: 'smartphone', title: '移动端体验全面革新', desc: '引入移动端专属底部导航 AppBar 与折叠侧边栏，让多设备办公体验起飞。' },
            { icon: 'manage_search', title: '全局级搜索升级', desc: '搜索框提权至顶部导航栏，大幅减少响应链路，任意界面一触即搜。' },
            { icon: 'undo', title: '交互撤回增强', desc: '补齐待办任务的状态回溯能力，消除误操作产生的多余日志数据。' }
        ]
    },
    {
        version: '2.0.0',
        date: '2026-02-16',
        features: [
            { icon: 'account_circle', title: '多用户数据隔离体系', desc: '建立基于邮箱防篡改的用户注册与鉴权，保护个人生产力数据的绝对隐私。' },
            { icon: 'extension', title: '时间管理四象限', desc: '引入轻量化核心四象限法则，按轻重缓急高效分类管理任务。' },
            { icon: 'blur_on', title: '高端毛玻璃暗黑 UI', desc: '全面升级为深色赛博调性视觉规范，极致降噪，让你专注于记录本身。' }
        ]
    },
    {
        version: '1.0.0',
        date: '2026-02-14',
        features: [
            { icon: 'celebration', title: '核心引擎初代上线', desc: '首发支持多模态 AI，建立碎片化日志 -> 周报智能摘要的生产力基建。' },
            { icon: 'format_paint', title: '极简深色主题确立', desc: '明确了产品少即是多的原则设计框架，减少视觉干扰，提高效率。' }
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
