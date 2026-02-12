from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from services.models_service import test_gemini_connection, test_kimi_connection, generate_summary
from database import get_supabase
import json

app = FastAPI(title="AI Productivity Hub API")

# 启用 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConnectionCheckRequest(BaseModel):
    model_type: str  # 'gemini' or 'kimi'
    model_name: str
    api_key: str

class GenerateRequest(BaseModel):
    model_type: str
    model_name: str
    api_key: str
    logs: List[Dict[str, Any]]

import bcrypt
import re

class UserRegister(BaseModel):
    username: str
    password: str
    phone: str

class UserLogin(BaseModel):
    phone: str
    password: str

class LogEntry(BaseModel):
    content: str
    type: str
    status: Optional[str] = None
    tags: List[str] = []

def verify_password(plain_password, hashed_password):
    # bcrypt.checkpw requires bytes
    if isinstance(hashed_password, str):
        hashed_password = hashed_password.encode('utf-8')
    if isinstance(plain_password, str):
        plain_password = plain_password.encode('utf-8')
    return bcrypt.checkpw(plain_password, hashed_password)

def get_password_hash(password):
    # bcrypt.hashpw requires bytes
    if isinstance(password, str):
        password = password.encode('utf-8')
    # Generate a salt and hash the password
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password, salt)
    return hashed.decode('utf-8')

def validate_cn_phone(phone: str) -> bool:
    return bool(re.match(r"^1[3-9]\d{9}$", phone))

@app.post("/api/register")
async def register(user: UserRegister):
    client = get_supabase()
    if not client:
        raise HTTPException(status_code=500, detail="Database connection error")

    if not validate_cn_phone(user.phone):
        raise HTTPException(status_code=400, detail="Invalid phone number format (Mainland China)")

    try:
        existing = client.table("users").select("id").eq("phone", user.phone).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="User already exists")
    except Exception as e:
         # Table might not exist
         print(f"Check user error: {e}")
         # Attempt to proceed? No, if table doesn't exist insert will fail too.
    
    hashed_password = get_password_hash(user.password)
    
    new_user = {
        "username": user.username,
        "password_hash": hashed_password,
        "phone": user.phone,
    }
    
    try:
        response = client.table("users").insert(new_user).execute()
        return {"success": True, "user": {"username": user.username, "phone": user.phone}}
    except Exception as e:
        print(f"Register error: {e}")
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@app.post("/api/login")
async def login(user: UserLogin):
    client = get_supabase()
    if not client:
        raise HTTPException(status_code=500, detail="Database connection error")

    try:
        response = client.table("users").select("*").eq("phone", user.phone).execute()
        if not response.data:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        db_user = response.data[0]
        if not verify_password(user.password, db_user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")
            
        return {"success": True, "user": {"username": db_user["username"], "phone": db_user["phone"]}}
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/check-connection")
async def check_connection(req: ConnectionCheckRequest):
    if req.model_type == "gemini":
        result = await test_gemini_connection(req.api_key, req.model_name)
    elif req.model_type == "kimi":
        result = await test_kimi_connection(req.api_key, req.model_name)
    else:
        raise HTTPException(status_code=400, detail="不支持的模型类型")
    
    if not result["success"]:
        raise HTTPException(status_code=401, detail=result["message"])
    return result

@app.post("/api/generate-summary")
async def api_generate_summary(req: GenerateRequest):
    # 将日志列表转换为文本上下文
    log_context = "\n".join([
        f"[{item.get('timestamp', 'N/A')}] {item.get('type')}: {item.get('content')}" 
        for item in req.logs
    ])
    
    result_text = await generate_summary(
        req.api_key, 
        req.model_type, 
        req.model_name, 
        log_context
    )
    
    if not result_text:
        raise HTTPException(status_code=500, detail="生成失败")
    
    try:
        # 尝试清理和解析 JSON (有些模型可能返回 markdown 代码块)
        if "```json" in result_text:
            result_text = result_text.split("```json")[1].split("```")[0].strip()
        elif "```" in result_text:
             result_text = result_text.split("```")[1].split("```")[0].strip()
        
        return json.loads(result_text)
    except Exception as e:
        print(f"JSON Parse error: {e}, raw: {result_text}")
        raise HTTPException(status_code=500, detail="解析 AI 响应失败")

@app.get("/api/logs")
async def get_logs():
    client = get_supabase()
    if not client:
        return [] # 如果没配置 supabase，暂时返回空，不报错以维持前端展示
    
    response = client.table("logs").select("*").order("timestamp", desc=True).execute()
    return response.data

@app.post("/api/logs")
async def add_log(log: LogEntry):
    client = get_supabase()
    if not client:
        return {"id": "local_" + str(json.dumps(log.dict()))} # Mock
    
    # 转换为 Supabase 字段
    data = log.dict()
    response = client.table("logs").insert(data).execute()
    return response.data[0]

@app.get("/health")
async def health():
    return {"status": "ok"}
