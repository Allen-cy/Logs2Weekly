#!/bin/bash

# AI Productivity Hub - 一键启动脚本
# 功能：自动启动后端 FastAPI 和 前端 Vite

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 正在准备启动 AI Productivity Hub 本地开发环境...${NC}"

# 检查端口占用
check_port() {
  lsof -i :$1 > /dev/null 2>&1
  return $?
}

# 1. 尝试启动后端
echo -e "${YELLOW}📡 检查后端服务 (Port 8000)...${NC}"
if check_port 8000; then
  echo -e "${GREEN}✅ 端口 8000 已被占用，假设后端已在运行。${NC}"
else
  echo -e "${YELLOW}正在后台启动 FastAPI 后端...${NC}"
  cd api
  # 使用虚拟环境中的 python 启动
  if [ -d ".venv" ]; then
    ./.venv/bin/python3 -m uvicorn index:app --port 8000 > ../backend.log 2>&1 &
  elif [ -d "venv" ]; then
    ./venv/bin/python3 -m uvicorn index:app --port 8000 > ../backend.log 2>&1 &
  else
    python3 -m uvicorn index:app --port 8000 > ../backend.log 2>&1 &
  fi
  cd ..
  sleep 4
  if check_port 8000; then
    echo -e "${GREEN}✅ 后端成功启动在 http://localhost:8000${NC}"
  else
    echo -e "${RED}❌ 后端启动失败，请检查 api/backend.log 获取详情。${NC}"
  fi
fi

# 2. 尝试启动前端
echo -e "${YELLOW}💻 检查前端服务 (Port 3000)...${NC}"
if check_port 3000; then
  echo -e "${GREEN}✅ 端口 3000 已被占用，假设前端已在运行。${NC}"
else
  echo -e "${YELLOW}正在后台启动 Vite 前端...${NC}"
  npm run dev > frontend.log 2>&1 &
  # 给 Vite 一点启动时间
  sleep 4
  if check_port 3000; then
    echo -e "${GREEN}✅ 前端成功启动在 http://localhost:3000${NC}"
  else
    echo -e "${RED}❌ 前端启动失败，请检查 frontend.log 获取详情。${NC}"
  fi
fi

echo -e "${GREEN}------------------------------------------------${NC}"
echo -e "${GREEN}🎉 所有服务已就绪！${NC}"
echo -e "🔗 前端地址: ${YELLOW}http://localhost:3000${NC}"
echo -e "🔗 后端健康检查: ${YELLOW}http://localhost:8000/api/health${NC}"
echo -e "${GREEN}------------------------------------------------${NC}"
echo -e "提示: 若要停止服务，请手动结束 python3 和 node 进程，或使用 'lsof -i :3000' 查找 PID。"
