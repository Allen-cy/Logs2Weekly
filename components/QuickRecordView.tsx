import React, { useState, useEffect, useRef } from 'react';

type QuickMode = 'log' | 'todo';

const QuickRecordView: React.FC = () => {
  const [mode, setMode] = useState<QuickMode>('log');
  const [content, setContent] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 强制 body 背景透明，以配合 electron 的 transparent 属性
    document.body.style.backgroundColor = 'transparent';
    document.documentElement.style.backgroundColor = 'transparent';

    if ((window as any).ipcRenderer) {
      const cleanup = (window as any).ipcRenderer.on('set-quick-mode', (_mode: QuickMode) => {
        setMode(_mode);
        setContent('');
        setTimeout(() => inputRef.current?.focus(), 50);
      });
      return () => {
        if (typeof cleanup === 'function') cleanup();
        document.body.style.backgroundColor = '';
        document.documentElement.style.backgroundColor = '';
      };
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    if ((window as any).ipcRenderer) {
      (window as any).ipcRenderer.send('quick-submit', { type: mode, content: content.trim() });
    }
    setContent('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if ((window as any).ipcRenderer) {
        (window as any).ipcRenderer.send('quick-hide');
      }
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col p-4 bg-transparent border border-primary/20 rounded-xl overflow-hidden shadow-2xl" style={{ WebkitAppRegion: 'drag' } as any}>
      <form onSubmit={handleSubmit} className="flex-1 bg-slate-900/95 backdrop-blur-xl rounded-lg p-4 flex flex-col gap-3 shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-slate-700" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <div className="flex justify-between items-center text-xs font-semibold">
          <span className={mode === 'log' ? 'text-primary' : 'text-success'}>
            {mode === 'log' ? '📝 极速记录 (Log)' : '✅ 极速待办 (Todo)'}
          </span>
          <span className="text-[10px] text-slate-500">Esc 隐藏 • Enter 提交 (可拖拽标题栏)</span>
        </div>
        <input
          ref={inputRef}
          className="w-full bg-slate-800/80 border border-slate-700/80 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 text-sm shadow-inner"
          placeholder={mode === 'log' ? "输入你想记录的任何想法..." : "输入你要做的待办事项..."}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      </form>
    </div>
  );
};

export default QuickRecordView;
