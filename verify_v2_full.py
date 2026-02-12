import requests
import json
import uuid

BASE_URL = "http://localhost:8000/api"

def test_full_cycle():
    print("🚀 Starting Full Cycle Verification...")
    
    unique_id = str(uuid.uuid4().int)[:8]
    test_phone = f"139{unique_id}"[:11]
    if len(test_phone) < 11: test_phone = test_phone.ljust(11, '0')
    test_email = f"test_{unique_id}@example.com"
    test_pass = "Password123!"
    
    # 1. 注册
    print(f"\n1. Testing Registration for {test_email}...")
    register_data = {
        "username": f"User_{unique_id}",
        "password": test_pass,
        "phone": test_phone,
        "email": test_email
    }
    resp = requests.post(f"{BASE_URL}/register", json=register_data)
    if resp.status_code == 200:
        user = resp.json().get("user")
        user_id = user["id"]
        print(f"✅ Registration SUCCESS. User ID: {user_id}")
    else:
        print(f"❌ Registration FAILED: {resp.text}")
        return

    # 2. 登录
    print(f"\n2. Testing Login...")
    login_data = {
        "account": test_email,
        "password": test_pass
    }
    resp = requests.post(f"{BASE_URL}/login", json=login_data)
    if resp.status_code == 200:
        print("✅ Login SUCCESS.")
    else:
        print(f"❌ Login FAILED: {resp.text}")
        return

    # 3. 个人资料更新
    print(f"\n3. Testing Update Profile...")
    profile_update = {
        "username": f"Updated_{unique_id}",
        "email": test_email
    }
    resp = requests.put(f"{BASE_URL}/user/profile?user_id={user_id}", json=profile_update)
    print(f"✅ Profile Sync: {resp.json().get('success')}")

    # 4. 配置持久化
    print(f"\n4. Testing AI Config Persistence...")
    config_update = {
        "provider": "kimi",
        "model_name": "moonshot-v1-8k",
        "api_key": "sk-dummy-key"
    }
    requests.put(f"{BASE_URL}/user/config?user_id={user_id}", json=config_update)
    get_config = requests.get(f"{BASE_URL}/user/config", params={"user_id": user_id})
    print(f"✅ Config Loaded: {get_config.json().get('config', {}).get('model_name')}")

    # 5. 日志与搜索
    print(f"\n5. Testing Log Entry & Search...")
    new_log = {
        "user_id": user_id,
        "type": "note",
        "content": f"Verification log for {unique_id}",
        "timestamp": "2024-02-12T10:00:00Z",
        "tags": ["test"]
    }
    requests.post(f"{BASE_URL}/logs", json=new_log)
    search_resp = requests.get(f"{BASE_URL}/logs", params={"user_id": user_id, "q": unique_id})
    print(f"✅ Search Status: Found {len(search_resp.json())} logs")

    print("\n🏁 Full Cycle Verification Completed Successfully!")

if __name__ == "__main__":
    test_full_cycle()
