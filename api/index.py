from fastapi import FastAPI, HTTPException, Body, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from services.models_service import test_gemini_connection, test_kimi_connection, generate_summary, aggregate_daily_logs
from database import get_supabase
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
                await perform_user_aggregation(row["user_id"])
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
    allow_credentials=True,
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

# --- API 路由 ---

@app.post("/api/register")
async def register(user: UserRegister):
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
        # 模拟发送验证邮件
        print(f"📧 [模拟邮件发送] 发送到: {user.email}, 内容: 欢迎注册 AI Productivity Hub! 您的账号已创建。")
        return {"success": True, "user": {"id": response.data[0]["id"], "username": user.username, "phone": user.phone, "email": user.email}}
    except Exception as e:
        print(f"Register error: {e}")
        raise HTTPException(status_code=500, detail=f"注册失败: {str(e)}")

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
        "api_key_encrypted": config.api_key # TODO: Add encryption
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

@app.post("/api/logs/aggregate")
async def manual_aggregate(user_id: int = Query(...)):
    summary_id = await perform_user_aggregation(user_id)
    if not summary_id:
        return {"success": False, "message": "今日无待处理的碎片记录，或 AI 聚合失败"}
    return {"success": True, "summary_id": summary_id}

# --- AI 服务接口 ---

@app.post("/api/check-connection")
async def check_connection(req: ConnectionTest):
    try:
        if req.model_type == "gemini":
            result = await test_gemini_connection(req.api_key, req.model_name)
        elif req.model_type == "kimi":
            result = await test_kimi_connection(req.api_key, req.model_name)
        else:
            raise HTTPException(status_code=400, detail="不支持的模型类型")
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["message"])
        return result
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=f"连接测试失败: {str(e)}")

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

# --- 原有 AI 服务接口 (保留) ---

@app.get("/health")
async def health():
    return {"status": "ok"}

