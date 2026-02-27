
import React from 'react';
import { ViewMode, AppConfig } from '../types';

interface HeaderProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onRegenerate: () => void;
  isGenerating: boolean;
  config: AppConfig;
  onOpenGuide: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

const Header: React.FC<HeaderProps> = ({
  viewMode,
  setViewMode,
  onRegenerate,
  isGenerating,
  config,
  onOpenGuide,
  searchQuery,
  setSearchQuery
}) => {
  return (
    <header className="bg-surface-dark/95 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-[100] shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 gap-8">
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white shadow-lg shadow-primary/20 cursor-pointer" onClick={() => setViewMode('dashboard')}>
              <span className="material-icons text-xl">rocket_launch</span>
            </div>
            <div className="hidden lg:block">
              <h1 className="text-lg font-black text-white tracking-tight">AI Productivity Hub</h1>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Kimi & Gemini Integrated</span>
              </div>
            </div>
          </div>

          {/* 搜索框移至顶部 */}
          <div className="hidden md:flex flex-1 max-w-md relative group">
            <span className="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">search</span>
            <input
              type="text"
              placeholder="搜索记录、日报、标签..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/60 border border-white/5 rounded-full py-2.5 pl-11 pr-4 text-xs text-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-inner"
            />
          </div>

          <nav className="hidden xl:flex bg-slate-900/50 p-1 rounded-2xl border border-slate-800 flex-shrink-0">
            <button
              onClick={() => setViewMode('dashboard')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${viewMode === 'dashboard' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-white'}`}
            >
              控制台
            </button>
            <button
              onClick={() => setViewMode('todos')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${viewMode === 'todos' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-slate-400 hover:text-orange-400'}`}
            >
              <span className="material-icons text-sm">checklist</span>
              待办事项
            </button>
            <button
              onClick={() => setViewMode('review')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${viewMode === 'review' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-white'}`}
            >
              生成周报
            </button>
            <button
              onClick={() => setViewMode('insights')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${viewMode === 'insights' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-white'}`}
            >
              数据洞察
            </button>
            <button
              onClick={() => setViewMode('history')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${viewMode === 'history' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-white'}`}
            >
              归档
            </button>
            <button
              onClick={() => setViewMode('setup')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${viewMode === 'setup' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-white'}`}
            >
              配置
            </button>
          </nav>

          <div className="flex items-center gap-3 flex-shrink-0">
            {viewMode === 'review' && (
              <button
                onClick={onRegenerate}
                disabled={isGenerating || !config.apiKeyTested}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${isGenerating
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-white text-background-dark hover:bg-slate-200 shadow-xl active:scale-95'
                  }`}
              >
                <span className={`material-icons text-sm ${isGenerating ? 'animate-spin' : ''}`}>
                  {isGenerating ? 'sync' : 'auto_awesome'}
                </span>
                {isGenerating ? '正在生成...' : '立即生成周报'}
              </button>
            )}

            <button
              onClick={onOpenGuide}
              className="w-10 h-10 rounded-xl border border-slate-800 text-slate-400 hover:text-primary hover:border-primary/30 transition-all flex items-center justify-center group"
              title="用户指南"
            >
              <span className="material-icons text-xl group-hover:rotate-12 transition-transform">help_outline</span>
            </button>

            <button
              onClick={() => setViewMode('profile')}
              className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${viewMode === 'profile'
                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                : 'border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
            >
              <span className="material-icons text-xl">account_circle</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
