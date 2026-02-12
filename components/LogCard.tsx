
import React, { useState } from 'react';
import { LogEntry, LogType, LogStatus } from '../types';
import ReactMarkdown from 'react-markdown';

interface LogCardProps {
  log: LogEntry;
  onToggleStatus: () => void;
  onDelete: () => void;
  onEdit: (content: string) => void;
  onPostpone: () => void;
  onConvertToTask: () => void;
  onRevertToNote: () => void;
}

const LogCard: React.FC<LogCardProps> = ({
  log,
  onToggleStatus,
  onDelete,
  onEdit,
  onPostpone,
  onConvertToTask,
  onRevertToNote
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const isSummary = log.type === LogType.AI_SUGGESTION || (log.type as any) === 'summary';
  const isDone = log.status === LogStatus.DONE;
  const isInProgress = log.status === LogStatus.IN_PROGRESS;

  const handleEdit = () => {
    const newContent = prompt('修改记录:', log.content);
    if (newContent !== null) onEdit(newContent);
  };

  // Extract keywords or summary for collapsed view
  const getSummary = () => {
    const firstLine = log.content.split('\n')[0].replace(/[#*`\-\[\]]/g, '').trim();
    if (firstLine.length > 40) return firstLine.substring(0, 40) + '...';
    return firstLine || '无标题记录';
  };

  return (
    <div className={`glass-panel rounded-xl p-5 hover:border-primary/30 transition-all group relative overflow-hidden ${isDone ? 'opacity-70 bg-slate-900/40' : ''}`}>
      {/* Dynamic Status Border */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 transition-colors ${isSummary ? 'bg-purple-500' :
        isDone ? 'bg-green-500' :
          isInProgress ? 'bg-amber-500' : 'bg-slate-600'
        }`}></div>

      <div className="flex items-start gap-4">
        {/* Leading Indicator */}
        <div className="mt-1 flex-shrink-0">
          {isSummary ? (
            <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
              <span className="material-icons text-sm">auto_awesome</span>
            </div>
          ) : log.type === LogType.NOTE ? (
            <span className="material-icons text-slate-500 text-[20px]">sticky_note_2</span>
          ) : (
            <button
              onClick={onToggleStatus}
              className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${isDone ? 'bg-green-500 border-green-500 text-white' :
                isInProgress ? 'border-amber-500 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20' :
                  'border-slate-600 hover:border-primary'
                }`}
            >
              {isDone && <span className="material-icons text-[14px] font-bold">check</span>}
              {!isDone && isInProgress && <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>}
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border transition-colors flex-shrink-0 ${isSummary ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                isDone ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                  isInProgress ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    'bg-slate-500/10 text-slate-400 border-slate-500/20'
                }`}>
                {isSummary ? '每日洞察' : log.status === LogStatus.DONE ? '已完成' : log.status === LogStatus.IN_PROGRESS ? '进行中' : '笔记'}
              </span>

              {!isExpanded && (
                <span className="text-sm font-bold text-white truncate max-w-[150px] sm:max-w-xs md:max-w-md">
                  {getSummary()}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-[10px] text-slate-500 font-bold tabular-nums">
                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-slate-600 hover:text-white transition-colors"
                title={isExpanded ? "收起" : "展开"}
              >
                <span className="material-icons text-sm">{isExpanded ? 'expand_less' : 'expand_more'}</span>
              </button>
            </div>
          </div>

          {/* Main Content (Markdown) */}
          <div className={`transition-all duration-300 ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
            <div className={`prose prose-invert prose-sm mb-4 ${isDone ? 'line-through opacity-50' : 'text-slate-200'}`}>
              <ReactMarkdown>{log.content}</ReactMarkdown>
            </div>
          </div>

          {/* Actions & Meta */}
          <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {log.type === LogType.NOTE && (
                <button
                  onClick={onConvertToTask}
                  className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold border border-primary/20 hover:bg-primary/20 transition-all flex items-center gap-1"
                >
                  <span className="material-icons text-[12px]">task_alt</span> 转为任务
                </button>
              )}
              {log.type === LogType.TASK && !isDone && (
                <>
                  <button
                    onClick={onPostpone}
                    className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-bold border border-slate-700 hover:text-primary transition-all flex items-center gap-1"
                  >
                    <span className="material-icons text-[12px]">event_repeat</span> 推迟到明天
                  </button>
                  <button
                    onClick={onRevertToNote}
                    className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-bold border border-slate-700 hover:text-danger transition-all flex items-center gap-1"
                    title="Undo conversion"
                  >
                    <span className="material-icons text-[12px]">undo</span> 撤销转任务
                  </button>
                </>
              )}
            </div>

            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={handleEdit} className="text-slate-500 hover:text-primary transition-colors p-1" title="编辑"><span className="material-icons text-[18px]">edit</span></button>
              <button onClick={onDelete} className="text-slate-500 hover:text-danger transition-colors p-1" title="删除"><span className="material-icons text-[18px]">delete</span></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogCard;
