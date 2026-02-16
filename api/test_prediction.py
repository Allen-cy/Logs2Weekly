import asyncio
import json
import os
from services.models_service import generate_summary

# 模拟日志数据
MOCK_LOGS = [
    "完成了 V2.0 规划文档的编写",
    "修复了 API 连接不稳定的 Bug",
    "调研了智谱 AI 的接入方案",
    "由于网络原因，甘特图组件的实现推迟到下周",
    "用户反馈注册流程繁琐，需要优化"
]

async def test_prediction_logic():
    print("🚀 开始测试智能预测逻辑 (TDD - RED)...")
    
    # 模拟从环境变量获取 API 配置
    api_key = os.getenv("GEMINI_API_KEY", "dummy_key")
    model_type = "gemini"
    model_name = "gemini-1.5-flash"
    
    # 预测功能应该是 generate_summary 的一部分或者独立函数
    # 在本阶段，我们计划在 generate_summary 的返回 JSON 中增加 nextWeekSuggestions 字段
    
    log_content = "\n".join(MOCK_LOGS)
    
    print("📡 调用 AI 服务生成周报并包含建议...")
    result_json_str = await generate_summary(api_key, model_type, model_name, log_content)
    
    if not result_json_str:
        print("❌ 失败: 未返回任何内容")
        return

    try:
        # 去掉 markdown 代码块包裹
        clean_json = result_json_str.replace("```json", "").replace("```", "").strip()
        result = json.loads(clean_json)
        
        print(f"📊 生成的周报摘要: {result.get('executiveSummary')[:50]}...")
        
        suggestions = result.get('nextWeekSuggestions')
        if suggestions and len(suggestions) > 0:
            print(f"✅ 成功找到 AI 建议: {suggestions}")
        else:
            print("❌ 失败: 结果中缺失 'nextWeekSuggestions' 字段（符合预期，目前尚未实现）")
            
    except Exception as e:
        print(f"❌ 解析失败: {e}")
        print(f"原始输出: {result_json_str}")

if __name__ == "__main__":
    asyncio.run(test_prediction_logic())
