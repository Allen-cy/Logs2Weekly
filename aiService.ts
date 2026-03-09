
import { LogEntry, WeeklySummary, AppConfig } from "./types";

// 确保在生产环境下，API 始终指向正确的产线地址
// 如果处在 Electron（file://）环境下，优先连接公网产线 API
export const API_BASE_URL = typeof window !== 'undefined' && window.location.protocol === 'file:'
    ? 'https://logs2weekly.chunyu2026.dpdns.org/api'
    : '/api';

export const testConnection = async (config: AppConfig): Promise<{ success: boolean; message: string }> => {
    try {
        const response = await fetch(`${API_BASE_URL}/check-connection`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model_type: config.provider,
                model_name: config.modelName,
                api_key: config.apiKey
            }),
        });

        if (response.ok) {
            return { success: true, message: `连接成功！已准备好为您处理任务。` };
        } else {
            const data = await response.json();
            return { success: false, message: data.detail || "连接失败" };
        }
    } catch (error: any) {
        return { success: false, message: `网络错误: ${error.message}` };
    }
};

export const generateWeeklyReport = async (logs: LogEntry[], config: AppConfig): Promise<WeeklySummary | null> => {
    try {
        const response = await fetch(`${API_BASE_URL}/generate-summary`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model_type: config.provider,
                model_name: config.modelName,
                api_key: config.apiKey,
                logs: logs
            }),
        });

        if (response.ok) {
            return await response.json();
        }
        return null;
    } catch (error) {
        console.error("Generation Error:", error);
        return null;
    }
};

// 后端持久化交互
export const fetchLogs = async (userId: number, query?: string): Promise<LogEntry[]> => {
    try {
        let url = `${API_BASE_URL}/logs?user_id=${userId}`;
        if (query) {
            url += `&q=${encodeURIComponent(query)}`;
        }
        const response = await fetch(url);
        return await response.json();
    } catch (err) {
        console.error("Fetch logs error", err);
        return [];
    }
};

export const manualAggregate = async (userId: number): Promise<{ success: boolean, message?: string, summary_id?: number }> => {
    try {
        const response = await fetch(`${API_BASE_URL}/logs/aggregate?user_id=${userId}`, {
            method: 'POST'
        });
        return await response.json();
    } catch (err) {
        console.error("Aggregate error", err);
        return { success: false, message: "网络请求失败" };
    }
}

export const saveLog = async (log: Omit<LogEntry, 'id'>): Promise<LogEntry> => {
    const response = await fetch(`${API_BASE_URL}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log),
    });
    return await response.json();
};

export const deleteLog = async (logId: string, userId: number): Promise<{ success: boolean }> => {
    try {
        const response = await fetch(`${API_BASE_URL}/logs/${logId}?user_id=${userId}`, {
            method: 'DELETE'
        });
        return await response.json();
    } catch (err) {
        console.error("Delete log error", err);
        return { success: false };
    }
};
export const fetchTodos = async (userId: number): Promise<any[]> => {
    const response = await fetch(`${API_BASE_URL}/todos?user_id=${userId}`);
    return await response.json();
};

export const saveTodo = async (todo: any): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(todo),
    });
    return await response.json();
};

export const updateTodo = async (todoId: string, userId: number, updates: any): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/todos/${todoId}?user_id=${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
    });
    return await response.json();
};

export const deleteTodo = async (todoId: string, userId: number): Promise<{ success: boolean }> => {
    const response = await fetch(`${API_BASE_URL}/todos/${todoId}?user_id=${userId}`, {
        method: 'DELETE'
    });
    return await response.json();
};
