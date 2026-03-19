# 开发功能清单 (Development Checklist)

## 1. 基础架构 (Infrastructure)

- [x] 项目初始化 (React + Vite + Tailwind)
- [x] 后端环境搭建 (FastAPI + Uvicorn)
- [x] 数据库连接 (Supabase Client)
- [ ] 环境变量配置 (.env handling)
- [x] **生产环境部署配置 (Vercel)**
- [x] Phase 1.1: 智能周报预测 (AI Suggestions)
- [x] Phase 1.2: 多维度视图 (Heatmap/Gantt)
- [x] Phase 1.3: 真实邮箱校验 (SMTP Verification)
- [x] Phase 2.1: GitHub OAuth 集成
- [x] Phase 2.2: PWA 功能实现
- [x] **V4.0: 全局搜索与待办系统**
  - [x] 导航栏搜索重构 (State Lifting)
  - [x] 仿苹果 Reminders 待办模块
  - [x] 待办勾选同步日志记录
  - [x] 未完成待办次日弹窗提醒
- [x] **V5.0: 待办事项四象限看板**
  - [x] 优先级 P0-P3 四级标记实现
  - [x] 列表页优先级指示灯显示
  - [x] 艾森豪威尔矩阵 (Eisenhower Matrix) 象限视图
  - [x] 象限视图 CRUD 与状态同步
- [x] **V6.0: 跨平台桌面客户端 (Electron)**
  - [x] macOS ARM64 深度适配 (Apple Silicon M1/M2/M3)
  - [x] 桌面版独立环境变量与寻址逻辑封装
  - [x] 构建脚本解耦 (Web build vs Desktop build)
  - [x] 解决 Vercel 环境下的生产部署路径寻址报错
- [x] **V3.2.0: 桌面端原生深度集成 (Desktop Native Integration)**
  - [x] 全局秒开快捷键 (Global Hotkey: `Alt+Space`)
  - [x] 系统托盘菜单 (System Tray & Context Menu)
  - [x] 置顶模式 (Always on Top Mode & UI Pin)
  - [x] 自定义快捷键设置与云端同步 (Custom Hotkey & Sync)
  - [x] 手动检查更新机制 (Manual Update Check)
  - [x] 数据库架构 v8 升级 (Schema Migration)
  - [x] AI 智能标签推荐 (AI Tag Suggestion)
  - [x] 周报 Markdown 文件下载 (Report Download)
  - [x] **V3.2.1 桌面端增强与 Bug 修复 (Dragging, Responsive, Quit Fix)**
- [x] **V3.2.0 桌面端安装包构建 (Custom Naming & Packaging)**

## 2. 鉴权模块 (Authentication)

- [x] 注册页面 (RegisterView)
- [x] 登录页面 (LoginView)
- [x] 用户配置管理 (ProfileSettingsView)
- [x] **登录状态持久化 (LocalStorage)**

## 3. 日志管理 (Log Management)

- [x] 日志列表展示 (DashboardView)
- [x] 添加日志 (Add Log)
- [x] 状态切换 (To-Do/Done)
- [x] **日志搜索 (Search Bar)**
- [x] **标签统计 (Top Contexts)**

## 4. AI 服务 (AI Services)

- [x] Gemini API 集成
- [x] Kimi (Moonshot) API 集成
- [x] 周报生成逻辑 (Weekly Report Generation)
- [x] API Key 安全存储 (Basic Encryption)

## 5. UI/UX 体验

- [x] **动态头部 (Dynamic Greeting)**
- [x] **活跃度热力图 (Activity Heatmap)**
- [x] **用户指南弹窗 (User Manual Modal)**
- [x] 暗黑模式适配 (Dark Mode)
- [x] 移动端响应式 (Responsive Design)

## 6. 文档与规范

- [x] 用户手册 (User Manual)
- [x] 技术路线图 (Roadmap)
- [x] 项目总结报告 (Phase Summary)
- [x] **全景交互历史记录 (Interaction History)**


- [x] [2026-03-19 19:35:06] 修复待办列表的重复合并与状态响应延迟 Bug
- [x] **v3.4.0 发版**: 生成自动同步和优化呈现内容，并打最终包发布 GitHub (2026-03-19)
