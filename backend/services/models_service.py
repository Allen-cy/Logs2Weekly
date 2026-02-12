from google import genai
from google.genai import types
from openai import OpenAI
import os
from typing import Dict, Any, Optional

async def test_gemini_connection(api_key: str, model_name: str = "gemini-1.5-flash") -> Dict[str, Any]:
    """测试 Gemini 联通性 (使用最新 google-genai SDK)"""
    client = None
    try:
        api_key = api_key.strip()
        # 日志记录的关键片段以确认 Key 是否更新
        key_log = f"{api_key[:6]}...{api_key[-4:]}" if len(api_key) > 10 else "invalid"
        print(f"DEBUG: Testing Gemini with key {key_log} and model {model_name} (google-genai SDK)")
        
        client = genai.Client(api_key=api_key)
        
        # 官方建议模型名不带 models/
        clean_model_name = model_name.replace("models/", "")
        
        # 尝试生成极简内容测试配额和有效性
        response = client.models.generate_content(
            model=clean_model_name,
            contents="ping",
            config=types.GenerateContentConfig(
                max_output_tokens=10
            )
        )
        
        if response.text:
            return {"success": True, "message": f"Gemini ({clean_model_name}) 连接成功！"}
        return {"success": False, "message": "模型返回空响应"}
    except Exception as e:
        msg = str(e)
        if "429" in msg:
            return {
                "success": False, 
                "message": f"Gemini 配额上限 (429): 服务器返回配额已满。这通常是因为该 Key 所属的项目已耗尽免费额度，或者频繁调用。请尝试检查其它 Key 或等待 1 分钟再试。"
            }
        elif "404" in msg:
            try:
                # 尝试列出可用模型以调试
                print("DEBUG: 404 Error encountered. Listing available models...")
                paged_list = client.models.list(config={"page_size": 50})
                available_models = [m.name for m in paged_list]
                print(f"DEBUG: Available models: {available_models}")
                return {"success": False, "message": f"模型未找到 (404): 当前 Key 可用模型: {', '.join([m.split('/')[-1] for m in available_models[:5]])}... 请查看后端日志获取完整列表。"}
            except Exception as list_err:
                print(f"DEBUG: Failed to list models: {list_err}")
                
            return {"success": False, "message": f"模型未找到 (404): 未找到名为 {model_name} 的模型。请尝试使用完整名称如 gemini-1.5-flash-001"}
        elif "400" in msg:
            return {"success": False, "message": f"参数错误 (400): 请检查模型名 {model_name} 是否正确。建议尝试: gemini-1.5-flash"}
        return {"success": False, "message": f"Gemini 连接失败: {msg}"}

async def test_kimi_connection(api_key: str, model_name: str = "kimi-k2.5") -> Dict[str, Any]:
    """测试 Kimi (Moonshot) 联通性"""
    try:
        api_key = api_key.strip()
        client = OpenAI(
            api_key=api_key,
            base_url="https://api.moonshot.cn/v1",
        )
        response = client.chat.completions.create(
            model=model_name,
            messages=[{"role": "user", "content": "ping"}],
        )
        if response.choices[0].message.content:
            return {"success": True, "message": "Kimi 连接成功！"}
        return {"success": False, "message": "模型返回空响应"}
    except Exception as e:
        return {"success": False, "message": f"Kimi 连接失败: {str(e)}"}

async def generate_summary(
    api_key: str, 
    model_type: str, 
    model_name: str, 
    log_content: str
) -> Optional[str]:
    """生成周报摘要"""
    prompt = f"""你是一位专业的高级生产力顾问。请根据以下日志记录生成本周周报总结。
要求：1. 必须使用中文。 2. 严格 JSON 输出。 3. 摘要需包含对成就的认可。

日志内容：
{log_content}

输出 JSON 格式参考：
{{
  "executiveSummary": "总结内容...",
  "focusAreas": [{{ "name": "领域", "percentage": 80 }}],
  "pulseStats": {{ "completed": 5, "completedChange": 1, "deepWorkHours": 10, "deepWorkAvg": 2 }},
  "highlights": [{{ "title": "亮点", "description": "描述", "icon": "emoji", "category": "分类", "timestamp": "时间" }}]
}}
"""
    try:
        api_key = api_key.strip()
        if model_type == "gemini":
            client = genai.Client(api_key=api_key)
            model_name = model_name.replace("models/", "")
            response = client.models.generate_content(
                model=model_name,
                contents=prompt
            )
            return response.text
        elif model_type == "kimi":
            client = OpenAI(
                api_key=api_key,
                base_url="https://api.moonshot.cn/v1",
            )
            response = client.chat.completions.create(
                model=model_name,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            return response.choices[0].message.content
    except Exception as e:
        print(f"Generation error: {e}")
        return None
    return None
