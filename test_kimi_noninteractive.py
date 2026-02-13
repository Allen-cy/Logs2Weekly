#!/usr/bin/env python3
"""非交互式 Kimi API 连接测试脚本"""
import asyncio
import sys
import os
from api.services.models_service import test_kimi_connection

async def main():
    print("=" * 60)
    print("🧪 Kimi API 连接测试")
    print("=" * 60)
    
    # 从环境变量或命令行参数获取 API Key
    api_key = os.environ.get("KIMI_API_KEY") or (sys.argv[1] if len(sys.argv) > 1 else None)
    
    if not api_key:
        print("\n❌ 错误: 未提供 API Key")
        print("\n使用方法:")
        print("  方式1: python test_kimi_noninteractive.py YOUR_API_KEY")
        print("  方式2: export KIMI_API_KEY=YOUR_API_KEY && python test_kimi_noninteractive.py")
        sys.exit(1)
    
    # 从命令行参数获取模型名称,默认使用 kimi-k2.5
    model_name = sys.argv[2] if len(sys.argv) > 2 else "kimi-k2.5"
    
    print(f"\n🔍 正在测试连接...")
    print(f"   模型: {model_name}")
    print(f"   API Key: {api_key[:8]}...{api_key[-4:]}\n")
    
    # 执行测试
    result = await test_kimi_connection(api_key, model_name)
    
    print("-" * 60)
    if result["success"]:
        print(f"✅ 成功: {result['message']}")
        print("\n🎉 恭喜! Kimi API 连接正常,您可以开始使用了!")
        print("\n📋 测试详情:")
        print(f"   - 服务商: Moonshot AI (Kimi)")
        print(f"   - 模型: {model_name}")
        print(f"   - API 端点: https://api.moonshot.cn/v1")
        print(f"   - 状态: ✅ 正常")
    else:
        print(f"❌ 失败: {result['message']}")
        print("\n💡 建议:")
        print("   1. 检查 API Key 是否正确")
        print("   2. 确认账户余额充足")
        print("   3. 验证模型名称是否正确")
        print("   4. 查看 Moonshot 控制台: https://platform.moonshot.cn/")
        print("\n🔧 可用的 Kimi 模型:")
        print("   - kimi-k2.5 (推荐)")
        print("   - moonshot-v1-8k")
        print("   - moonshot-v1-32k")
        print("   - moonshot-v1-128k")
    print("=" * 60)
    
    return result["success"]

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
