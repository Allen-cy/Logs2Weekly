import os
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from pydantic import EmailStr

# 邮件配置
conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME", ""),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD", ""),
    MAIL_FROM=os.getenv("MAIL_FROM", "no-reply@logs2weekly.com"),
    MAIL_PORT=int(os.getenv("MAIL_PORT", 587)),
    MAIL_SERVER=os.getenv("MAIL_SERVER", "smtp.gmail.com"),
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

async def send_verification_email(email: EmailStr, code: str, base_url: str = "https://logs2weekly.chunyu2026.dpdns.org"):
    """发送注册验证邮件"""
    verify_url = f"{base_url}/api/verify?code={code}"
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 10px;">
            <h2 style="color: #3b82f6;">欢迎加入 Logs2Weekly!</h2>
            <p>感谢您注册我们的 AI 周报工具。请使用以下链接验证您的邮箱地址：</p>
            <div style="margin: 30px 0; text-align: center;">
                <a href="{verify_url}" 
                   style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                   验证邮箱地址
                </a>
            </div>
            <p style="font-size: 12px; color: #666;">如果链接无法点击，请复制以下地址到浏览器打开：</p>
            <p style="font-size: 12px; color: #666;">{verify_url}</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 10px; color: #999;">本邮件由系统自动发送，请勿回复。</p>
        </div>
    </body>
    </html>
    """

    message = MessageSchema(
        subject="验证您的 Logs2Weekly 账号",
        recipients=[email],
        body=html,
        subtype=MessageType.html
    )

    fm = FastMail(conf)
    try:
        await fm.send_message(message)
        print(f"✅ 验证邮件已发送至: {email}")
        return True
    except Exception as e:
        print(f"❌ 邮件发送失败: {e}")
        return False
