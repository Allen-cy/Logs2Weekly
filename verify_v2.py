import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_login_and_features():
    print("🚀 Starting Verification...")
    
    # 1. 登录 (假设已有测试用户或刚刚手动注册的)
    # 我们先尝试用新注册的测试账号
    login_data = {
        "account": "13800000000",
        "password": "Password123!"
    }
    
    print(f"\n1. Testing Login with {login_data['account']}...")
    try:
        resp = requests.post(f"{BASE_URL}/login", json=login_data)
        if resp.status_code == 200:
            user = resp.json().get("user")
            user_id = user["id"]
            print(f"✅ Login SUCCESS. User ID: {user_id}")
        else:
            print(f"❌ Login FAILED: {resp.text}")
            return
    except Exception as e:
        print(f"❌ Connection ERROR: {e}")
        return

    # 2. 获取配置
    print(f"\n2. Testing Get Config for User {user_id}...")
    resp = requests.get(f"{BASE_URL}/user/config", params={"user_id": user_id})
    print(f"Response: {resp.json()}")

    # 3. 更新配置
    print(f"\n3. Testing Update Config...")
    config_update = {
        "provider": "gemini",
        "model_name": "gemini-1.5-pro",
        "api_key": "test_api_key_v2"
    }
    resp = requests.put(f"{BASE_URL}/user/config?user_id={user_id}", json=config_update)
    print(f"Response: {resp.json()}")

    # 4. 更新个人资料
    print(f"\n4. Testing Update Profile...")
    profile_update = {
        "username": "Allen_Pro",
        "email": "allen_pro@example.com"
    }
    resp = requests.put(f"{BASE_URL}/user/profile?user_id={user_id}", json=profile_update)
    print(f"Response: {resp.json()}")

    # 5. 搜索日志
    print(f"\n5. Testing Log Search...")
    resp = requests.get(f"{BASE_URL}/logs", params={"user_id": user_id, "q": "test"})
    print(f"Found {len(resp.json())} logs matching 'test'")

    print("\n🏁 Verification Completed.")

if __name__ == "__main__":
    test_login_and_features()
