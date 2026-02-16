from google import genai
from google.genai import types
from openai import OpenAI
import os
import json
from typing import Dict, Any, Optional, List

class ModelProvider:
    async def test_connection(self, api_key: str, model_name: str) -> Dict[str, Any]:
        raise NotImplementedError
        
    async def generate_response(self, api_key: str, model_name: str, prompt: str, is_json: bool = False) -> Optional[str]:
        raise NotImplementedError

class GeminiProvider(ModelProvider):
    async def test_connection(self, api_key: str, model_name: str) -> Dict[str, Any]:
        try:
            client = genai.Client(api_key=api_key.strip())
            target_model = MODEL_MAPPING.get(model_name, model_name).replace("models/", "")
            response = client.models.generate_content(
                model=target_model,
                contents="ping",
                config=types.GenerateContentConfig(max_output_tokens=10)
            )
            if response.text:
                return {"success": True, "message": f"Gemini ({target_model}) 连接成功！"}
            return {"success": False, "message": "模型返回空响应"}
        except Exception as e:
            return {"success": False, "message": f"Gemini 连接失败: {str(e)}"}

    async def generate_response(self, api_key: str, model_name: str, prompt: str, is_json: bool = False) -> Optional[str]:
        try:
            client = genai.Client(api_key=api_key.strip())
            target_model = MODEL_MAPPING.get(model_name, model_name).replace("models/", "")
            response = client.models.generate_content(
                model=target_model,
                contents=prompt
            )
            return response.text
        except Exception as e:
            print(f"Gemini error: {e}")
            return None

class OpenAICompatibleProvider(ModelProvider):
    def __init__(self, base_url: str):
        self.base_url = base_url

    async def test_connection(self, api_key: str, model_name: str) -> Dict[str, Any]:
        try:
            client = OpenAI(api_key=api_key.strip(), base_url=self.base_url)
            target_model = MODEL_MAPPING.get(model_name, model_name)
            response = client.chat.completions.create(
                model=target_model,
                messages=[{"role": "user", "content": "ping"}],
            )
            if response.choices[0].message.content:
                return {"success": True, "message": "连接成功！"}
            return {"success": False, "message": "模型返回空响应"}
        except Exception as e:
            return {"success": False, "message": f"连接失败: {str(e)}"}

    async def generate_response(self, api_key: str, model_name: str, prompt: str, is_json: bool = False) -> Optional[str]:
        try:
            client = OpenAI(api_key=api_key.strip(), base_url=self.base_url)
            target_model = MODEL_MAPPING.get(model_name, model_name)
            kwargs = {
                "model": target_model,
                "messages": [{"role": "user", "content": prompt}]
            }
            if is_json:
                kwargs["response_format"] = {"type": "json_object"}
                
            response = client.chat.completions.create(**kwargs)
            return response.choices[0].message.content
        except Exception as e:
            print(f"Provider error: {e}")
            return None

PROVIDERS = {
    "gemini": GeminiProvider(),
    "kimi": OpenAICompatibleProvider("https://api.moonshot.cn/v1"),
    "glm": OpenAICompatibleProvider("https://open.bigmodel.cn/api/paas/v4/"),
    "qwen": OpenAICompatibleProvider("https://dashscope.aliyuncs.com/compatible-mode/v1"),
}

MODEL_MAPPING = {
    # Gemini 默认值
    "gemini-1.5-flash": "gemini-1.5-flash",
    "gemini-1.5-pro": "gemini-1.5-pro",
    "gemini-2.0-flash": "gemini-2.0-flash-exp",
    # Kimi 映射
    "moonshot-v1-8k": "moonshot-v1-8k",
    "moonshot-v1-32k": "moonshot-v1-32k",
    "moonshot-v2-128k": "moonshot-v2-128k",
}

def get_provider(model_type: str) -> ModelProvider:
    return PROVIDERS.get(model_type, PROVIDERS["gemini"])

async def test_gemini_connection(api_key: str, model_name: str = "gemini-1.5-flash") -> Dict[str, Any]:
    return await get_provider("gemini").test_connection(api_key, model_name)

async def test_kimi_connection(api_key: str, model_name: str = "kimi-k2.5") -> Dict[str, Any]:
    return await get_provider("kimi").test_connection(api_key, model_name)

async def test_glm_connection(api_key: str, model_name: str = "glm-4") -> Dict[str, Any]:
    return await get_provider("glm").test_connection(api_key, model_name)

async def generate_summary(api_key: str, model_type: str, model_name: str, log_content: str) -> Optional[str]:
    prompt = f"""你是一位专业的高级生产力顾问。请根据以下日志记录生成本周周报总结。
要求：1. 必须使用中文。 2. 严格 JSON 输出。 3. 摘要需包含对成就的认可。 4. 请根据日志内容，智能分析并预测下周的工作建议 (nextWeekSuggestions)。

日志内容：
{log_content}

输出 JSON 格式参考：
{{
  "executiveSummary": "总结内容...",
  "focusAreas": [{{ "name": "领域", "percentage": 80 }}],
  "pulseStats": {{ "completed": 5, "completedChange": 1, "deepWorkHours": 10, "deepWorkAvg": 2 }},
  "highlights": [{{ "title": "亮点", "description": "描述", "icon": "emoji", "category": "分类", "timestamp": "时间" }}],
  "nextWeekSuggestions": ["建议1: ...", "建议2: ..."]
}}
"""
    provider = get_provider(model_type)
    return await provider.generate_response(api_key, model_name, prompt, is_json=True)

async def aggregate_daily_logs(api_key: str, model_type: str, model_name: str, logs: List[str]) -> Optional[str]:
    if not logs: return None
    log_text = "\n".join([f"- {l}" for l in logs])
    prompt = f"""你是一位极致高效的生产力教练。以下是用户今天的碎片化记录：
{log_text}
请整理成 Daily Insight，包含核心总结、闪念感悟和行动建议。中文输出。"""
    provider = get_provider(model_type)
    return await provider.generate_response(api_key, model_name, prompt)
