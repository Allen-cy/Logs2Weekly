# 📘 深度复盘：Log2Weekly 生产环境部署实战经验教训登记册

**项目**: Log2Weekly (AI Productivity Hub)
**日期**: 2026-02-13
**复盘维度**: 用户反馈 -> 问题定义 -> 深度分析 -> 解决过程 -> 最终方案

---

## 🛑 战役一：Vercel Serverless 部署与 404 路由迷局

### 1. 问题的起点 (User Feedback)
>
> **用户反馈**：“部署到 Vercel 后，访问 API 返回 404 HTML 页面，前端报错 `Unexpected token <`。”

### 2. 问题定义 (Problem Definition)

Vercel 平台无法正确识别并托管我们的 Python FastAPI 后端，导致 API 请求未被路由到 Python 运行时，而是被当
作静态资源（未找到）处理。

### 3. 深度分析 (Analysis)

- **核心矛盾**：本地开发习惯（`backend/main.py`）与 Vercel Serverless 标准（推崇 `api/index.py`）不兼容。
- **机制探究**：Vercel 的零配置（Zero Config）特性会默认扫描 `api/` 目录。如果代码在 `backend/`，Vercel 根本不知道这是后端代码。
- **配置缺失**：原有的 `vercel.json` 缺少明确的 `rewrites` 规则，导致 `/api/login` 这样的路径没有被转发给 Python 脚本处理。

### 4. 解决过程 (Solving Process)

1. **目录重构**：果断放弃 `backend/` 命名，遵循 Vercel 惯例重命名为 `api/`。
2. **入口标准化**：将 `main.py` 重命名为 `index.py`，因为 Vercel 会自动将 `api/index.py` 映射为 `/api` 根路径。
3. **模块补全**：在 Python 子目录中强制添加 `__init__.py`，确保 Serverless 环境能正确解析本地包依赖。

### 5. 最终方案 (The Solution)

- **文件结构**：

  ```text
  /api
    ├── index.py      <-- 统一入口
    ├── services/     <-- 业务逻辑 (含 __init__.py)
    └── requirements.txt
  ```

- **配置 (vercel.json)**：

  ```json
  {
    "rewrites": [{ "source": "/api/(.*)", "destination": "/api/index.py" }]
  }
  ```

---

## 🛑 战役二：前端硬编码与“本地化”残留

### 1. 问题的起点 (User Feedback)
>
> **用户反馈**：“后端修好了，但点击登录还是提示‘连接服务器失败’。”

### 2. 问题定义 (Problem Definition)

前端代码（React 组件）在构建生产包时，仍然试图连接开发者的本地环境（localhost），导致生产环境的网络请求直接被浏览器拒绝（Connection Refused）。

### 3. 深度分析 (Analysis)

- **代码审查**：在 `LoginView.tsx` 等组件中发现了写死的 `http://localhost:8000` 字符串。
- **环境差异**：本地开发因为可以在本机跑后端，所以也是通的；但用户访问 Vercel 公网链接时，浏览器是在用户电脑上运行的，用户的 `localhost` 并没有我们的后端服务。

### 4. 解决过程 (Solving Process)

1. **全局搜索**：扫描所有 `.tsx` 文件中的 `http://` 和 `localhost` 关键字。
2. **抽象封装**：引入 `API_BASE_URL` 常量，禁止在 UI 组件中直接拼接 URL。
3. **动态注入**：利用 Vite 的环境变量机制（`import.meta.env`）来区分环境，但在同域部署（前后端同源）的最佳实践下，方案进化为**相对路径**。

### 5. 最终方案 (The Solution)

- **组件层**：

  ```typescript
  // 错误示范
  fetch('http://localhost:8000/api/login')
  // 正确示范
  import { API_BASE_URL } from '../aiService';
  fetch(`${API_BASE_URL}/login`)
  ```

---

## 🛑 战役三：CORS 跨域隐患与畸形路径

### 1. 问题的起点 (User Feedback)
>
> **用户反馈**：“依然连接失败，但在终端用 curl 测试是通的。”

### 2. 问题定义 (Problem Definition)

这是一个复合型问题：

1. **CORS 策略冲突**：后端虽然允许了所有来源（`*`），但同时也允许了凭证（Credentials），这违反了浏览器的安全规范。
2. **路径畸形**：前端 `alert` 出来的请求地址竟然是 `https://domain.com/domain.com/api`（双重域名）。

### 3. 深度分析 (Analysis)

- **关于 CORS**：`curl` 是非浏览器客户端，不受同源策略限制，所以能通。浏览器在发起 `POST` 请求（带 JSON）前会发 `OPTIONS` 预检。若后端响应头 `Access-Control-Allow-Origin: *` 且 `Access-Control-Allow-Credentials: true`，浏览器会直接拦截请求并报错 `Network Error`。
- **关于路径**：`aiService.ts` 原逻辑是 `(VITE_ENV || "") + "/api"`。在 Vercel 生产环境中，如果环境变量未正确注入或被错误解析，可能导致基准路径变成了“当前页面域名”的相对拼接，最终导致 URL 叠加。

### 4. 解决过程 (Solving Process)

1. **后端降级**：既然暂不需要跨域 Cookie，果断将 `allow_credentials` 设为 `False`，保留 `allow_origins=["*"]` 以确保最大兼容性。
2. **前端归一**：摒弃复杂的环境变量判断，利用 Vercel 单体部署的优势，直接使用**绝对路径** `/api`。

### 5. 最终方案 (The Solution)

- **后端 (FastAPI)**：

  ```python
  app.add_middleware(
      CORSMiddleware,
      allow_origins=["*"],
      allow_credentials=False,  # 关键修正：配合通配符必须为 False
      ...
  )
  ```

- **前端 (aiService.ts)**：

  ```typescript
  // 生产环境最稳妥配置：始终指向当前域名的 /api 根路径
  export const API_BASE_URL = "/api";
  ```

---

## 💡 总结与建议 (Conclusion)

通过本次问题的层层剥洋葱，我们得出了**全链路排查法则**：

1. **先测后端**：用 `curl` 排除代码逻辑和数据库问题。
2. **再看控制台**：浏览器控制台的报错是 CORS 和路径拼写错误的照妖镜。
3. **最后看代码**：硬编码和环境变量配置往往是环境差异问题的罪魁祸首。
