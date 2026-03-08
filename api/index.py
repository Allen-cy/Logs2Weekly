from fastapi import FastAPI, HTTPException, Body, Depends, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
import sys
import os

# 确保当前目录在路径中，适配不同运行环境
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

try:
    from services.models_service import test_gemini_connection, test_kimi_connection, generate_summary, aggregate_daily_logs
    from services.smtp_service import send_verification_email
    from database import get_supabase
except ImportError:
    try:
        from api.services.models_service import test_gemini_connection, test_kimi_connection, generate_summary, aggregate_daily_logs
        from api.services.smtp_service import send_verification_email
        from api.database import get_supabase
    except ImportError:
        # 最后的保底尝试：相对导入
        from .services.models_service import test_gemini_connection, test_kimi_connection, generate_summary, aggregate_daily_logs
        from .services.smtp_service import send_verification_email
        from .database import get_supabase
import json
import bcrypt
import re
import uuid
import asyncio
from datetime import datetime, timedelta, time
from contextlib import asynccontextmanager

# --- 后台任务逻辑 ---

async def perform_user_aggregation(user_id: int):
    client = get_supabase()
    # 1. 获取今天未处理的日志
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    try:
        response = client.table("logs").select("*")\
            .eq("user_id", user_id)\
            .eq("is_processed", False)\
            .gte("timestamp", today_start)\
            .execute()
        
        raw_logs = response.data
        if not raw_logs:
            return None

        # 2. 获取用户配置
        config_resp = client.table("user_configs").select("*").eq("user_id", user_id).execute()
        if not config_resp.data:
            return None
        
        config = config_resp.data[0]
        
        # 3. 调用 AI 聚合
        contents = [l["content"] for l in raw_logs]
        summary_text = await aggregate_daily_logs(
            api_key=config["api_key_encrypted"],
            model_type=config["provider"],
            model_name=config["model_name"],
            logs=contents
        )
        
        if not summary_text:
            return None

        # 4. 创建聚合日报记录
        summary_entry = {
            "user_id": user_id,
            "content": summary_text,
            "type": "summary",
            "tags": ["每日洞察", "自动聚合"],
            "timestamp": datetime.now().isoformat(),
            "is_processed": True
        }
        summary_resp = client.table("logs").insert(summary_entry).execute()
        summary_id = summary_resp.data[0]["id"]
        
        # 5. 更新原始记录状态
        for l in raw_logs:
            client.table("logs").update({"is_processed": True, "parent_id": summary_id}).eq("id", l["id"]).execute()
        
        print(f"✅ 用户 {user_id} 的日报聚合完成 (ID: {summary_id})")
        return summary_id
    except Exception as e:
        print(f"Error in aggregation for user {user_id}: {e}")
        return None

async def perform_inbox_cleanup(user_id: int):
    """
    清理超期的已处理记录
    """
    client = get_supabase()
    if not client: return
    
    try:
        # 1. 获取用户配置的归档留存天数 (默认 15，最高支持 365)
        config_resp = client.table("user_configs").select("archive_retention_days").eq("user_id", user_id).execute()
        retention_days = 15
        if config_resp.data and config_resp.data[0].get("archive_retention_days"):
            retention_days = config_resp.data[0]["archive_retention_days"]
            
        # 2. 计算截止日期
        cutoff_date = (datetime.now() - timedelta(days=retention_days)).isoformat()
        
        # 3. 执行归档删除：仅针对已处理的【普通碎记录】
        # 严格保护：type != 'summary' (永久日报) 和 is_pinned (置顶记录)
        client.table("logs").delete() \
            .eq("user_id", user_id) \
            .eq("is_processed", True) \
            .neq("type", "summary") \
            .eq("is_pinned", False) \
            .lt("timestamp", cutoff_date) \
            .execute()
        
        print(f"🧹 已为用户 {user_id} 完成归档清理 (动态留存: {retention_days}天，已保护永久日报)")
    except Exception as e:
        print(f"Cleanup error for user {user_id}: {e}")

async def daily_aggregation_task():
    while True:
        now = datetime.now()
        target_time = now.replace(hour=18, minute=0, second=0, microsecond=0)
        if now >= target_time:
            target_time += timedelta(days=1)
            
        wait_seconds = (target_time - now).total_seconds()
        print(f"⏰ 下次聚合任务将在 {target_time} 执行，等待 {wait_seconds:.0f} 秒")
        
        try:
            await asyncio.sleep(wait_seconds)
            client = get_supabase()
            if not client: continue
            
            users_resp = client.table("user_configs").select("user_id").execute()
            for row in users_resp.data:
                u_id = row["user_id"]
                # 1. 执行聚合
                await perform_user_aggregation(u_id)
                # 2. 执行收纳盒清理
                await perform_inbox_cleanup(u_id)
        except asyncio.CancelledError:
            break
        except Exception as e:
            print(f"Aggregation task error: {e}")
            await asyncio.sleep(60)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动后台任务
    task = asyncio.create_task(daily_aggregation_task())
    yield
    # 停止后台任务
    task.cancel()

app = FastAPI(title="AI Productivity Hub API", lifespan=lifespan)

# 启用 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 模型定义 ---

class UserRegister(BaseModel):
    username: str
    password: str
    phone: str
    email: EmailStr

class UserLogin(BaseModel):
    account: str  # 手机号或邮箱
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None

class PasswordUpdate(BaseModel):
    old_password: str
    new_password: str

class UserConfigUpdate(BaseModel):
    provider: str
    model_name: str
    api_key: str
    inbox_retention_days: Optional[int] = 15

class LogEntry(BaseModel):
    content: str
    type: str
    status: Optional[str] = None
    tags: List[str] = []
    user_id: Optional[int] = None
    is_processed: bool = False
    is_pinned: bool = False

class ConnectionTest(BaseModel):
    model_type: str
    model_name: str
    api_key: str

class SummaryRequest(BaseModel):
    model_type: str
    model_name: str
    api_key: str
    logs: List[Any]

class ReportEntry(BaseModel):
    user_id: int
    title: str
    content: Dict[str, Any]
    start_date: Optional[str] = None
    end_date: Optional[str] = None

# --- 工具函数 ---

def verify_password(plain_password, hashed_password):
    if isinstance(hashed_password, str):
        hashed_password = hashed_password.encode('utf-8')
    if isinstance(plain_password, str):
        plain_password = plain_password.encode('utf-8')
    return bcrypt.checkpw(plain_password, hashed_password)

def get_password_hash(password):
    if isinstance(password, str):
        password = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password, salt)
    return hashed.decode('utf-8')

def validate_cn_phone(phone: str) -> bool:
    return bool(re.match(r"^1[3-9]\d{9}$", phone))

@app.get("/health")
@app.get("/api/health")
async def health_check():
    supabase_configured = os.getenv("SUPABASE_URL") is not None and os.getenv("SUPABASE_KEY") is not None
    return {
        "status": "healthy",
        "env": {
            "supabase": "configured" if supabase_configured else "missing",
            "python_version": sys.version
        }
    }

# --- API 路由 ---

@app.post("/register")
@app.post("/api/register")
async def register(user: UserRegister, request: Request):
    client = get_supabase()
    if not client:
        raise HTTPException(status_code=500, detail="数据库连接错误")

    if not validate_cn_phone(user.phone):
        raise HTTPException(status_code=400, detail="手机号格式不正确")

    # 检查用户是否已存在
    try:
        existing_phone = client.table("users").select("id").eq("phone", user.phone).execute()
        if existing_phone.data:
            raise HTTPException(status_code=400, detail="手机号已注册")
        
        existing_email = client.table("users").select("id").eq("email", user.email).execute()
        if existing_email.data:
            raise HTTPException(status_code=400, detail="邮箱已注册")
    except Exception as e:
        print(f"Check existing user error: {e}")

    hashed_password = get_password_hash(user.password)
    
    new_user = {
        "username": user.username,
        "password_hash": hashed_password,
        "phone": user.phone,
        "email": user.email,
        "email_verified": False
    }
    
    try:
        response = client.table("users").insert(new_user).execute()
        user_id = response.data[0]["id"]
        
        # 验证码逻辑
        verify_code = str(uuid.uuid4())
        client.table("verification_codes").insert({
            "user_id": user_id,
            "email": user.email,
            "code": verify_code,
            "type": "register",
            "expires_at": (datetime.now() + timedelta(hours=24)).isoformat()
        }).execute()

        # 异步发送验证邮件
        base_url = get_base_url(request)
        asyncio.create_task(send_verification_email(user.email, verify_code, base_url))
        
        return {"success": True, "user": {"id": user_id, "username": user.username, "phone": user.phone, "email": user.email}}
    except Exception as e:
        print(f"Register error: {e}")
        raise HTTPException(status_code=500, detail=f"注册失败: {str(e)}")

@app.get("/verify")
@app.get("/api/verify")
async def verify_email(code: str):
    client = get_supabase()
    # 查找验证码
    resp = client.table("verification_codes").select("*").eq("code", code).execute()
    if not resp.data:
        raise HTTPException(status_code=400, detail="验证链接无效或已过期")
    
    verify_data = resp.data[0]
    user_id = verify_data["user_id"]
    
    # 检查过期
    if datetime.fromisoformat(verify_data["expires_at"].replace("Z", "+00:00")) < datetime.now():
         raise HTTPException(status_code=400, detail="验证链接已过期")
    
    # 更新用户状态
    client.table("users").update({"email_verified": True}).eq("id", user_id).execute()
    # 删除使用的验证码
    client.table("verification_codes").delete().eq("id", verify_data["id"]).execute()
    
    return {"success": True, "message": "邮箱验证成功！您现在可以享受完整服务。"}

@app.post("/login")
@app.post("/api/login")
async def login(req: UserLogin):
    client = get_supabase()
    if not client:
        raise HTTPException(status_code=500, detail="数据库连接错误")

    try:
        # 同时支持手机号和邮箱登录
        is_email = "@" in req.account
        field = "email" if is_email else "phone"
        
        response = client.table("users").select("*").eq(field, req.account).execute()
        if not response.data:
            raise HTTPException(status_code=401, detail="账号或密码错误")
        
        db_user = response.data[0]
        if not verify_password(req.password, db_user["password_hash"]):
            raise HTTPException(status_code=401, detail="账号或密码错误")
            
        return {
            "success": True, 
            "user": {
                "id": db_user["id"],
                "username": db_user["username"], 
                "phone": db_user["phone"],
                "email": db_user.get("email")
            }
        }
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        print(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="登录失败")

GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")

def get_base_url(request):
    # 动态获取当前请求的 host
    host = request.headers.get("host", "localhost:8000")
    proto = "https" if "chunyu2026.dpdns.org" in host or request.headers.get("x-forwarded-proto") == "https" else "http"
    return f"{proto}://{host}"

@app.get("/auth/github")
@app.get("/api/auth/github")
async def github_login(request: Request):
    if not GITHUB_CLIENT_ID:
        raise HTTPException(status_code=500, detail="GitHub Login not configured")
    redirect_uri = f"{get_base_url(request)}/api/auth/github/callback"
    return {
        "url": f"https://github.com/login/oauth/authorize?client_id={GITHUB_CLIENT_ID}&redirect_uri={redirect_uri}&scope=user"
    }

@app.get("/auth/github/callback")
@app.get("/api/auth/github/callback")
async def github_callback(code: str, request: Request):
    redirect_uri = f"{get_base_url(request)}/api/auth/github/callback"
    async with httpx.AsyncClient() as client:
        # 1. 换取 Access Token
        token_resp = await client.post(
            "https://github.com/login/oauth/access_token",
            params={
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "code": code,
                "redirect_uri": redirect_uri
            },
            headers={"Accept": "application/json"}
        )
        token_data = token_resp.json()
        access_token = token_data.get("access_token")
        
        if not access_token:
             raise HTTPException(status_code=400, detail="Failed to get GitHub access token")
        
        # 2. 获取用户信息
        user_resp = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"token {access_token}"}
        )
        gh_user = user_resp.json()
        gh_id = str(gh_user.get("id"))
        gh_login = gh_user.get("login")
        gh_avatar = gh_user.get("avatar_url")
        gh_email = gh_user.get("email")

        # 3. 数据库操作 (查找或创建用户)
        sb = get_supabase()
        # 尝试通过 github_id 查找
        existing = sb.table("users").select("*").eq("github_id", gh_id).execute()
        
        if existing.data:
            user_data = existing.data[0]
        else:
            # 创建新用户
            new_user = {
                "username": gh_login,
                "phone": f"github_{gh_id}", # 默认占位
                "email": gh_email,
                "github_id": gh_id,
                "avatar_url": gh_avatar,
                "email_verified": True # OAuth 来源默认信任
            }
            resp = sb.table("users").insert(new_user).execute()
            user_data = resp.data[0]

        # 4. 返回用户数据
        return {
            "success": True,
            "user": {
                "id": user_data["id"],
                "username": user_data["username"],
                "phone": user_data["phone"],
                "email": user_data.get("email"),
                "avatar_url": user_data.get("avatar_url"),
                "email_verified": user_data.get("email_verified")
            }
        }

@app.put("/api/user/password")
async def update_password(user_id: int, req: PasswordUpdate):
    client = get_supabase()
    response = client.table("users").select("password_hash").eq("id", user_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    if not verify_password(req.old_password, response.data[0]["password_hash"]):
        raise HTTPException(status_code=400, detail="旧密码错误")
    
    new_hash = get_password_hash(req.new_password)
    client.table("users").update({"password_hash": new_hash}).eq("id", user_id).execute()
    return {"success": True, "message": "密码修改成功"}

@app.put("/api/user/profile")
async def update_profile(user_id: int, req: UserUpdate):
    client = get_supabase()
    update_data = {k: v for k, v in req.dict().items() if v is not None}
    if not update_data:
        return {"success": True, "message": "无更新内容"}
    
    try:
        client.table("users").update(update_data).eq("id", user_id).execute()
        return {"success": True, "message": "资料更新成功"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"更新失败: {str(e)}")

# --- 配置持久化 ---

@app.get("/api/user/config")
async def get_user_config(user_id: int):
    client = get_supabase()
    response = client.table("user_configs").select("*").eq("user_id", user_id).execute()
    if not response.data:
        return {"success": False, "config": None}
    return {"success": True, "config": response.data[0]}

@app.put("/api/user/config")
async def save_user_config(user_id: int, config: UserConfigUpdate):
    client = get_supabase()
    # 注意：实际生产中 api_key 应该加密存储。这里简化处理。
    config_data = {
        "user_id": user_id,
        "provider": config.provider,
        "model_name": config.model_name,
        "api_key_encrypted": config.api_key,
        "inbox_retention_days": config.inbox_retention_days
    }
    
    try:
        # Upsert logic (insert or update on conflict)
        response = client.table("user_configs").upsert(config_data, on_conflict="user_id").execute()
        return {"success": True, "message": "配置已保存"}
    except Exception as e:
        print(f"Save config error: {e}")
        raise HTTPException(status_code=500, detail="保存配置失败")

# --- 日志与搜索 ---

@app.get("/api/logs")
async def get_logs(user_id: int = Query(...), q: Optional[str] = None):
    client = get_supabase()
    query = client.table("logs").select("*").eq("user_id", user_id)
    
    if q:
        query = query.ilike("content", f"%{q}%")
        
    response = query.order("timestamp", desc=True).execute()
    return response.data
@app.post("/api/logs")
async def add_log(log: LogEntry):
    client = get_supabase()
    if not client: return {"id": str(uuid.uuid4())}
    
    data = log.dict()
    response = client.table("logs").insert(data).execute()
    return response.data[0]

@app.delete("/api/logs/{log_id}")
async def delete_log(log_id: str, user_id: int = Query(...)):
    client = get_supabase()
    try:
        # 这里的 log_id 可能是 string (uuid) 也可能是自增 int，取决于数据库定义
        # 根据 frontend 传参，我们统一按 string 处理或尝试转换
        client.table("logs").delete().eq("id", log_id).eq("user_id", user_id).execute()
        return {"success": True}
    except Exception as e:
        print(f"Delete log error: {e}")
        raise HTTPException(status_code=500, detail="删除日志失败")

@app.post("/api/logs/aggregate")
async def manual_aggregate(user_id: int = Query(...)):
    summary_id = await perform_user_aggregation(user_id)
    if not summary_id:
        return {"success": False, "message": "今日无待处理的碎片记录，或 AI 聚合失败"}
    return {"success": True, "summary_id": summary_id}

# --- 周报历史归档 ---

@app.get("/api/reports")
async def get_reports(user_id: int = Query(...)):
    client = get_supabase()
    response = client.table("reports").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    return response.data

@app.post("/api/reports")
async def save_report(report: ReportEntry):
    client = get_supabase()
    data = report.dict()
    try:
        response = client.table("reports").insert(data).execute()
        return {"success": True, "id": response.data[0]["id"]}
    except Exception as e:
        print(f"Save report error: {e}")
        raise HTTPException(status_code=500, detail="保存周报快照失败")

@app.delete("/api/reports/{report_id}")
async def delete_report(report_id: int, user_id: int = Query(...)):
    client = get_supabase()
    try:
        client.table("reports").delete().eq("id", report_id).eq("user_id", user_id).execute()
        return {"success": True}
    except Exception as e:
        print(f"Delete report error: {e}")
        raise HTTPException(status_code=500, detail="删除周报失败")

# --- AI 服务接口 ---

@app.post("/check-connection")
@app.post("/api/check-connection")
async def check_connection(req: ConnectionTest):
    try:
        if req.model_type == "gemini":
            result = await test_gemini_connection(req.api_key, req.model_name)
        elif req.model_type in ["kimi", "glm", "qwen"]:
            provider = get_provider(req.model_type)
            result = await provider.test_connection(req.api_key, req.model_name)
        else:
            raise HTTPException(status_code=400, detail="不支持的模型类型")
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["message"])
        return result
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=f"连接测试失败: {str(e)}")

@app.post("/generate-summary")
@app.post("/api/generate-summary")
async def generate_summary_api(req: SummaryRequest):
    # 将日志列表转换为文本
    log_texts = []
    for log in req.logs:
        if isinstance(log, str):
            log_texts.append(log)
        elif isinstance(log, dict):
            log_texts.append(log.get("content", ""))
    
    full_content = "\n".join(log_texts)
    
    try:
        summary_text = await generate_summary(
            api_key=req.api_key,
            model_type=req.model_type,
            model_name=req.model_name,
            log_content=full_content
        )
        
        if not summary_text:
            raise HTTPException(status_code=500, detail="生成周报失败，请重试")
            
        # 尝试解析 JSON
        try:
            # 去掉可能存在的 markdown 代码块包裹
            clean_json = summary_text.replace("```json", "").replace("```", "").strip()
            return json.loads(clean_json)
        except:
            return {"executiveSummary": summary_text} # 降级处理
            
    except Exception as e:
        print(f"Generate summary API error: {e}")
        raise HTTPException(status_code=500, detail="生成异常")

# --- 待办事项 (Todos) ---

class TodoEntry(BaseModel):
    content: str
    completed: bool
    completed_at: Optional[str] = None
    created_at: str
    due_date: Optional[str] = None
    list_name: str
    priority: str = "P3"
    notes: Optional[str] = None
    user_id: int

class TodoUpdate(BaseModel):
    content: Optional[str] = None
    completed: Optional[bool] = None
    completed_at: Optional[str] = None
    due_date: Optional[str] = None
    list_name: Optional[str] = None
    priority: Optional[str] = None
    notes: Optional[str] = None

@app.get("/api/todos")
async def get_todos(user_id: int = Query(...)):
    client = get_supabase()
    response = client.table("todos").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    return response.data

@app.post("/api/todos")
async def add_todo(todo: TodoEntry):
    client = get_supabase()
    data = todo.dict()
    # 确保 ID 是由数据库生成或此处生成的 UUID
    response = client.table("todos").insert(data).execute()
    return response.data[0]

@app.put("/api/todos/{todo_id}")
async def update_todo(todo_id: str, todo: TodoUpdate, user_id: int = Query(...)):
    client = get_supabase()
    update_data = {k: v for k, v in todo.dict().items() if v is not None}
    try:
        response = client.table("todos").update(update_data).eq("id", todo_id).eq("user_id", user_id).execute()
        return response.data[0]
    except Exception as e:
        print(f"Update todo error: {e}")
        raise HTTPException(status_code=500, detail="更新待办失败")

@app.delete("/api/todos/{todo_id}")
async def delete_todo_api(todo_id: str, user_id: int = Query(...)):
    client = get_supabase()
    try:
        client.table("todos").delete().eq("id", todo_id).eq("user_id", user_id).execute()
        return {"success": True}
    except Exception as e:
        print(f"Delete todo error: {e}")
        raise HTTPException(status_code=500, detail="删除待办失败")

# --- 原有 AI 服务接口 (保留) ---

@app.get("/health")
async def health():
    return {"status": "ok"}

