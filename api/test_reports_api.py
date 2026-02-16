import asyncio
import httpx
import json

BASE_URL = "http://localhost:8000/api"

async def test_reports_api():
    print("🚀 开始测试周报历史 API (TDD - RED)...")
    
    # 假设用户 ID 为 1
    user_id = 1
    
    async with httpx.AsyncClient() as client:
        # 1. 测试获取列表 (应该为空或 404/无数据)
        print("🔍 1. 获取历史周报列表...")
        try:
            resp = await client.get(f"{BASE_URL}/reports?user_id={user_id}")
            if resp.status_code == 404:
                print("✅ 符合预期: 接口未实现 (404)")
            else:
                print(f"❓ 接口状态: {resp.status_code}")
        except Exception as e:
            print(f"✅ 符合预期: 连接失败或接口不存在: {e}")

        # 2. 测试保存周报 (应该失败)
        print("💾 2. 尝试保存周报...")
        report_data = {
            "user_id": user_id,
            "title": "2024年 2月 第三周总结",
            "content": {
                "executiveSummary": "本周工作高效完成...",
                "nextWeekSuggestions": ["优化代码结构", "准备演示汇报"]
            },
            "start_date": "2024-02-12",
            "end_date": "2024-02-18"
        }
        try:
            resp = await client.post(f"{BASE_URL}/reports", json=report_data)
            print(f"❓ 结果: {resp.status_code}")
        except Exception as e:
            print(f"✅ 符合预期: 保存接口不存在: {e}")

if __name__ == "__main__":
    asyncio.run(test_reports_api())
