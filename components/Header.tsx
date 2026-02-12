
import React from 'react';
import { ViewMode, AppConfig } from '../types';

interface HeaderProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onRegenerate: () => void;
  isGenerating: boolean;
  config: AppConfig;
}

const Header: React.FC<HeaderProps> = ({
  viewMode,
  setViewMode,
  onRegenerate,
  isGenerating,
  config
}) => {
  return (
    <header className="bg-surface-dark/80 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <span className="material-icons text-xl">rocket_launch</span>
            </div>
            <div>
              <h1 className="text-lg font-black text-white tracking-tight">AI Productivity Hub</h1>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Kimi & Gemini Integrated</span>
              </div>
            </div>
          </div>

          <nav className="hidden md:flex bg-slate-900/50 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setViewMode('dashboard')}
              className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${viewMode === 'dashboard' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-white'}`}
            >
              DASHBOARD
            </button>
            <button
              onClick={() => setViewMode('review')}
              className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${viewMode === 'review' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-white'}`}
            >
              WEEKLY REVIEW
            </button>
            <button
              onClick={() => setViewMode('setup')}
              className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${viewMode === 'setup' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-white'}`}
            >
              SETTINGS
            </button>
          </nav>

          <div className="flex items-center gap-3">
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
                {isGenerating ? 'GENERATING...' : 'REGENERATE SUMMARY'}
              </button>
            )}

            <div className="w-10 h-10 rounded-xl border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 transition-all cursor-pointer">
              <span className="material-icons text-xl">account_circle</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
