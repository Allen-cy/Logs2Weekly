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

---

## 🛡️ 战役四：模型配置与 API Key 验证的交互设计

### 1. 问题的起点 (Backstory)
>
> **背景**：“用户有了账号，但如何确保他们填写的 API Key 是真正可用的？如果填错了，等到生成周报时再报错，挫败感太强。”

### 2. 设计目标 (Design Goals)

1. **即时反馈**：在用户保存配置前，必须验证 Key 的有效性。
2. **引导性强**：针对 Gemini 和 Kimi 不同厂商的特性提供明确指引。
3. **容错性**：从后端捕获具体的错误码（如 429 配额不足），而不是笼统报错。

### 3.深度分析与实现 (Implementation Details)

#### A. 前端交互策略 (SetupView.tsx)

采用 **Wizard（向导式）** 步骤设计，降低认知负荷：

1. **步骤一：选择引擎**：
    - 展示 Gemini (Google) 和 Kimi (Moonshot) 选项。
    - 清晰标注各自特点（如 Gemini 免费额度，Kimi 中文优势）。
2. **步骤二：验证连接**：
    - **自动去空**：用户复制 Key 时常带空格，前端/后端需自动 `strip()`。
    - **强制验证**：只有点击“立即开始验证”并通过后，“开启工作台”按钮才会亮起。
    - **直达链接**：输入框旁直接提供跳转到 Google AI Studio 或 Moonshot Console 的链接。

#### B. 后端验证逻辑 (models_service.py)

不仅仅是 `ping` 通网络，更是对“服务可用性”的深度检测。

- **Gemini 验证**：
  - 使用 `google.genai` SDK。
  - 生成极简内容（如 "ping"）来探测。
  - **精细化错误处理**：
    - `429 Quota Exceeded`: 明确告知用户配额已满，建议切换 Key。
    - `404 Not Found`: 甚至尝试列出当前 Key 可用的模型列表，辅助调试模型名错误（如 `gemini-1.5-flash` vs `models/gemini-1.5-flash`）。

- **Kimi 验证**：
  - 使用 `openai` 标准 SDK（兼容接口）。
  - 配置 `base_url="https://api.moonshot.cn/v1"`。

#### C. 状态同步 (App.tsx)

- **云端同步**：验证通过的配置（`apiKeyTested: true`）会自动同步到后端数据库 (`/user/config`)。
- **无缝漫游**：用户在手机端配置好，回家电脑端打开即用，无需重复输入。

### 4. 经验总结 (Key Takeaways)

1. **Don't Trust User Input**：永远不要假设用户填写的 Key 是对的，必须现场试运行。
2. **Error Messages Matter**：告诉用户“配额满了”比告诉用户“服务器错误 500”有用一万倍。
3. **SDK Isolation**：不同厂商使用其官方/推荐的 SDK（如 Gemini 用 `google-genai`，Kimi 用 `openai`），比强行用一套通用的 HTTP 请求更稳定，也能获取更详细的错误堆栈。

---

## 🛑 战役五：Electron 跨端集成与路径寻址悖论

### 1. 问题的起点 (User Feedback)
>
> **用户反馈**：“开发桌面版后，网页打开黑盘，或者刷新页面后提示无法访问子网站。”

### 2. 问题定义 (Problem Definition)

项目在引入 Electron 桌面环境后，Web 端的“路径寻址逻辑”与桌面端的“本地文件寻址逻辑”产生了根本冲突。

### 3. 深度分析 (Analysis)

- **根路径冲突**：Web 端（如 Vercel）通常部署在 `/` 根路径。而 Electron 在打包后，静态资源是通过 `file://` 协议加载的。Vite 默认生成的绝对路径（如 `/assets/...`）在桌面端会指向系统根目录，导致资源加载 404。
- **构建环境耦合**：原有的 `npm run build` 同时包含了针对网页的优化和针对 Electron 的打包。在 Vercel 这种 Linux/Web 环境下，调用 `electron-builder` 会因为缺少 wine 或桌面环境依赖而报错。
- **刷新失效**：刷新页面时，单页应用 (SPA) 的路由如果不是 `HashRouter`，在没有配置服务器重定向的情况下，浏览器会尝试请求对应的静态路径，导致网页端 404。

### 4. 解决过程 (Solving Process)

1. **动态路径感知**：在 `vite.config.ts` 中通过环境变量 `VITE_ELECTRON` 动态切换 `base` 为 `./` (相对路径) 或 `/` (绝对路径)。
2. **构建脚本分流**：将 `package.json` 中的 `build` 与 `build:electron` 彻底声明式解耦。Vercel 仅执行纯 Web 构建，Electron 仅在本地开发机执行。
3. **路由模式修正**：由于 Electron 不支持 `BrowserRouter` 的 HTML5 PushState，项目在桌面模式下通过动态判断注入了兼容性更强的路由兜底逻辑。

### 5. 最终方案 (The Solution)

- **Vite 配置优化**：

  ```typescript
  // vite.config.ts
  export default defineConfig({
    base: process.env.VITE_ELECTRON ? './' : '/',
    // ...
  })
  ```

- **构建脚本解耦**：

  ```json
  // package.json
  "build": "vite build",
  "build:electron": "vite build && electron-builder"
  ```

### 6. 经验总结 (Key Takeaways)

1. **构建与运行环境必须隔离**：云端部署环境与本地桌面构建环境的依赖池不可混用。
2. **路径必须是动态的**：不要在代码（尤其是 `index.html` 的资源引用）中假设根路径是 `/`。
3. **Electron 打包即修罗场**：打包后的寻址问题（`asar` 内部 vs 外部）应在开发早期就通过环境变量 `is_packaged` 进行分支处理。

---

## 🛑 战役六：Electron 自动化更新与 GitHub Release 草稿陷阱

### 1. 问题的起点 (User Feedback)
>
> **用户反馈**：“客户端更新每次都要重新打包再安装，体验太差了。为什么即使配置了 GitHub Releases，但页面上根本看不到安装包？”

### 2. 问题定义 (Problem Definition)

应用桌面端缺乏有效的 Over-The-Air (OTA) 增量升级方案，迫使所有迭代都必须全量覆盖安装；在初步接入 `electron-updater` 后，执行构建并发布，但由于其内部机制导致了不可见的 Release，阻断了客户端的检测。

### 3. 深度分析 (Analysis)

- **更新机制的空缺**：原本的构建只产出全量的 `dmg`，并没有为内置升级准备底层的二进制补丁和清单。
- **发布状态隐藏**：`electron-builder --publish always` 默认会将产物上传到 GitHub，但在该状态下，为防开发者未撰写 Release Notes，所有的 Release 默认被设为 **"Draft" (草稿)**。
- 草稿状态的 Release 对于未提供鉴权的公共客户端 API 是 404 不可见的，这也同时导致下载按钮和 Updater 都读不到配置文件 (`latest-mac.yml`)。

### 4. 解决过程 (Solving Process)

1. **补全编译产物**：在 `electron-builder` (在 package.json 内的 mac.target) 的构建目标中添加了 `zip`。macOS 上的增量包 (`.blockmap`) 机制高度依赖 zip。保留 dmg 为冷启动下载，zip 供软件内补丁抓取。
2. **主动改变发布属性**：为避开其默认设为草稿的安全机制，在 `publish` 配置对象中精准添加了 `"releaseType": "release"`，这使得 CLI 上传完毕后立刻将其转为对外公海可见。
3. **UI 干预与静默处理**：
   - 禁用自动强制下载并重启避免中断用户的书写流 (`autoUpdater.autoDownload = false`)。
   - 使用 IPC 通道承接 `update-available`, `update-download-progress`, `update-downloaded` 信号，转移到 `App.tsx` 中的渲染层绘制弹窗和真实下载进度条，把决定权完全交给用户。

### 5. 最终方案 (The Solution)

- **构建层**：

  ```json
  "publish": [{
    "provider": "github",
    "owner": "Allen-cy",
    "repo": "Logs2Weekly",
    "releaseType": "release"
  }],
  "mac": {
    "target": [{ "target": "dmg", "arch": ["arm64"] }, { "target": "zip", "arch": ["arm64"] }]
  }
  ```

- **交互层 (App.tsx UI 截取)**：
  主进程发现真时抛出数据，前端根据 `updateStatus` (available / downloading / downloaded) 提供“稍后”、“下载”、“立即重启”的分歧点与进度可视化。

### 6. 经验总结 (Key Takeaways)

1. **自动发布机制并非总是“所见即所得”**：很多 CLI 工具带有“未显式配置时保留草稿”的设定，查阅文档中关于 ReleaseType 的说明是破局点。
2. **打断即为原罪**：对于工具类应用，软件更新绝不能在后台静默强制实施覆盖并导致重启（引发数据丢失与心流终止），把触发门槛下放到前端是尊重 UX 的体现。
