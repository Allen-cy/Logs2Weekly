import React, { useState, useEffect, useRef } from 'react';
import { TodoPriority } from '../types';

type QuickMode = 'log' | 'todo';

const QuickRecordView: React.FC = () => {
  const [mode, setMode] = useState<QuickMode>('log');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<TodoPriority>(TodoPriority.P3);
  const inputRef = useRef<HTMLInputElement>(null);
  const isTodo = mode === 'todo';

  useEffect(() => {
    // 强制 body 背景透明，以配合 electron 的 transparent 属性
    document.body.style.backgroundColor = 'transparent';
    document.documentElement.style.backgroundColor = 'transparent';

    if ((window as any).ipcRenderer) {
      const cleanup = (window as any).ipcRenderer.on('set-quick-mode', (_mode: QuickMode) => {
        console.log('Switching quick mode to:', _mode);
        setMode(_mode);
        setContent('');
        // 给渲染一点时间再聚焦
        requestAnimationFrame(() => {
          setTimeout(() => inputRef.current?.focus(), 100);
        });
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
      (window as any).ipcRenderer.send('quick-submit', { 
        type: mode, 
        content: content.trim(),
        priority: mode === 'todo' ? priority : undefined
      });
    }
    setContent('');
    setPriority(TodoPriority.P3); // 重置优先级
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if ((window as any).ipcRenderer) {
        (window as any).ipcRenderer.send('quick-hide');
      }
    }
  };

  return (
    <div className="h-screen w-screen bg-transparent p-4 overflow-hidden" style={{ WebkitAppRegion: 'drag' } as any}>
      <form
        onSubmit={handleSubmit}
        className={`relative h-full w-full overflow-hidden rounded-[2rem] border backdrop-blur-2xl transition-colors duration-300 ${isTodo ? 'border-emerald-300/35 bg-emerald-950/55' : 'border-sky-300/35 bg-slate-950/70'} shadow-[0_24px_80px_rgba(2,6,23,0.62),inset_0_1px_0_rgba(255,255,255,0.28)]`}
        style={{ WebkitAppRegion: 'no-drag' } as any}
      >
        <div className={`pointer-events-none absolute inset-0 rounded-[2rem] opacity-90 ${isTodo ? 'bg-[radial-gradient(circle_at_18%_0%,rgba(52,211,153,0.28),transparent_34%),radial-gradient(circle_at_88%_120%,rgba(20,184,166,0.18),transparent_42%)]' : 'bg-[radial-gradient(circle_at_16%_0%,rgba(56,189,248,0.30),transparent_34%),radial-gradient(circle_at_88%_120%,rgba(14,165,233,0.18),transparent_42%)]'}`} />
        <div className="pointer-events-none absolute inset-[1px] rounded-[1.95rem] border border-white/10 shadow-[inset_0_0_24px_rgba(255,255,255,0.08)]" />
        <div className={`pointer-events-none absolute -left-8 -top-10 h-28 w-36 rounded-[45%_55%_58%_42%/48%_42%_58%_52%] blur-2xl ${isTodo ? 'bg-emerald-300/18' : 'bg-sky-300/18'}`} />
        <div className="relative z-10 flex h-full flex-col justify-between gap-3 px-5 py-4">
          <div className="flex items-center justify-between gap-4 text-xs font-semibold">
            <div className="flex min-w-0 items-center gap-3">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[1.1rem] border ${isTodo ? 'border-emerald-300/25 bg-emerald-300/[0.12] text-emerald-200' : 'border-sky-300/25 bg-sky-300/[0.12] text-sky-200'} shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]`}>
                <span className="material-icons text-[20px]">{isTodo ? 'add_task' : 'edit_note'}</span>
              </div>
              <div className="min-w-0">
                <p className={`truncate text-sm font-black ${isTodo ? 'text-emerald-100' : 'text-sky-100'}`}>
                  {isTodo ? '极速待办' : '极速记录'}
                </p>
                <p className="truncate text-[10px] font-bold text-slate-300/85">
                  {isTodo ? 'Control+K 呼出，Enter 创建待办' : 'Control+M 呼出，Enter 保存日志'}
                </p>
              </div>
              {isTodo && (
                <div className="ml-1 flex shrink-0 items-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.08] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                {[
                  { p: TodoPriority.P0, color: 'bg-red-500', label: 'P0' },
                  { p: TodoPriority.P1, color: 'bg-orange-500', label: 'P1' },
                  { p: TodoPriority.P2, color: 'bg-green-500', label: 'P2' },
                  { p: TodoPriority.P3, color: 'bg-slate-500', label: 'P3' },
                ].map((item) => (
                  <button
                    key={item.p}
                    type="button"
                    onClick={() => setPriority(item.p)}
                    className={`h-6 w-7 rounded-xl text-[9px] font-black transition-all active:scale-95 ${priority === item.p ? `${item.color} text-white shadow-lg shadow-black/20` : 'bg-white/[0.08] text-slate-400 hover:bg-white/[0.14] hover:text-white'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
            <div className="shrink-0 rounded-full border border-white/10 bg-white/[0.10] px-3 py-1.5 text-[10px] font-bold text-slate-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
              Esc 隐藏
            </div>
          </div>
          <div className={`relative flex items-center rounded-[1.35rem] border bg-slate-950/62 shadow-[inset_0_1px_14px_rgba(15,23,42,0.55),0_10px_34px_rgba(2,6,23,0.24)] transition-all focus-within:bg-slate-950/72 ${isTodo ? 'border-emerald-300/28 focus-within:border-emerald-200/50' : 'border-sky-300/24 focus-within:border-sky-200/50'}`}>
            <input
              ref={inputRef}
              className="h-14 w-full bg-transparent px-5 pr-14 text-[15px] font-semibold text-white placeholder:text-slate-500 outline-none"
              placeholder={isTodo ? "输入你要做的待办事项..." : "输入你想记录的任何想法..."}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (e.shiftKey) return;
                  e.preventDefault();
                  handleSubmit(e as any);
                } else {
                  handleKeyDown(e);
                }
              }}
              autoFocus
            />
            <button
              type="submit"
              className={`absolute right-2.5 flex h-9 w-9 items-center justify-center rounded-2xl text-white shadow-lg transition-all active:scale-95 ${isTodo ? 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-900/30' : 'bg-sky-500 hover:bg-sky-400 shadow-sky-900/30'}`}
            >
              <span className="material-icons text-[18px]">arrow_upward</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default QuickRecordView;
