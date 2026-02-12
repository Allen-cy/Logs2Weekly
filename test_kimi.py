#!/usr/bin/env python3
"""测试 Kimi API 连接的独立脚本"""
import asyncio
import sys
from backend.services.models_service import test_kimi_connection

async def main():
    print("=" * 60)
    print("🧪 Kimi API 连接测试")
    print("=" * 60)
    
    # 提示用户输入 API Key
    api_key = input("\n请输入您的 Kimi API Key: ").strip()
    
    if not api_key:
        print("❌ 错误: API Key 不能为空")
        sys.exit(1)
    
    # 可选: 自定义模型名称
    model_name = input("请输入模型名称 (直接回车使用默认 kimi-k2.5): ").strip()
    if not model_name:
        model_name = "kimi-k2.5"
    
    print(f"\n🔍 正在测试连接...")
    print(f"   模型: {model_name}")
    print(f"   API Key: {api_key[:8]}...{api_key[-4:]}\n")
    
    # 执行测试
    result = await test_kimi_connection(api_key, model_name)
    
    print("-" * 60)
    if result["success"]:
        print(f"✅ 成功: {result['message']}")
        print("\n🎉 恭喜! Kimi API 连接正常,您可以开始使用了!")
    else:
        print(f"❌ 失败: {result['message']}")
        print("\n💡 建议:")
        print("   1. 检查 API Key 是否正确")
        print("   2. 确认账户余额充足")
        print("   3. 验证模型名称是否正确")
        print("   4. 查看 Moonshot 控制台: https://platform.moonshot.cn/")
    print("=" * 60)
    
    return result["success"]

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
