# Logs2Weekly 项目本地启动指南 (Local Run Guide)

为了确保应用正常运行，您需要分别启动 **后端 API** 和 **前端开发服务器**。

## 1. 启动后端 (Backend - FastAPI)

后端负责用户管理、日志保存及 AI 交互。

1. **进入目录**: `cd api`
2. **激活虚拟环境**: `source .venv/bin/activate`
3. **启动服务**:

   ```bash
   python3 -m uvicorn index:app --reload --port 8000
   ```

   - **成功标志**: 看到 `INFO: Uvicorn running on http://127.0.0.1:8000`。
   - **健康检查**: 访问 `http://localhost:8000/api/health` 确认返回 `{"status":"healthy",...}`。

## 2. 启动前端 (Frontend - Vite)

前端是您直接交互的 Web 界面。

1. **进入根目录**: `cd /Users/allen/Desktop/Vibe\ Coding/项目3-Log2weekly/ai-productivity-hub`
2. **启动开发服务器**:

   ```bash
   npm run dev
   ```

   - **成功标志**: 看到 `VITE v...  ready in ... ms`。
   - **访问入口**: 默认访问 `http://localhost:3000`。

## 💡 常见问题排查

- **端口冲突**: 如果提示端口被占用，请确保没有其他 `uvicorn` 或 `node` 进程运行。
- **依赖冲突**: 如果后端报错 `ImportError`，请执行 `pip install --force-reinstall pydantic-core pydantic fastapi uvicorn`。
- **环境配置**: 确保 `api/.env` 中的 `SUPABASE_URL` 和 `SUPABASE_KEY` 保持配置状态。
