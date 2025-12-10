import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Save, 
  RotateCcw, 
  Terminal as TerminalIcon, 
  Code2, 
  Blocks,
  X,
  Copy,
  Trash2,
  Activity,
  Cpu,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { ViewMode } from '../types';
import { HudButton } from './UI';
import { BlockPyWrapper, BlockPyRef } from './BlockPyWrapper';
import { useTerminal, LogType } from '../context/TerminalContext';

export const CenterIDE: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('blocks');
  const [isRunning, setIsRunning] = useState(false);
  const blockPyRef = useRef<BlockPyRef>(null);

  // Consume Context
  const { 
    userLogs, systemLogs, aiLogs, 
    log, clear,
    showUser, showSystem, showAI, toggleTerminal 
  } = useTerminal();

  // Auto-scroll refs
  const userEndRef = useRef<HTMLDivElement>(null);
  const systemEndRef = useRef<HTMLDivElement>(null);
  const aiEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (showUser) userEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [userLogs, showUser]);
  useEffect(() => { if (showSystem) systemEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [systemLogs, showSystem]);
  useEffect(() => { if (showAI) aiEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [aiLogs, showAI]);

  const handleWrapperOutput = (text: string) => {
    log('user', text);
  };

  const handleWrapperError = (err: string) => {
    setIsRunning(false);
    log('user', `[ERROR]: ${err}`);
    log('system', `Error encountered: ${err}`);
  };

  const handleRun = () => {
    if (blockPyRef.current) {
      setIsRunning(true);
      // Ensure user terminal is open when running
      if (!showUser) toggleTerminal('user');
      
      // Allow UI to update before blocking thread
      setTimeout(() => {
        blockPyRef.current?.run();
        setIsRunning(false);
      }, 100);
    }
  };

  const handleReset = () => {
    if (confirm("Clear workspace? This cannot be undone.")) {
      blockPyRef.current?.reset();
    }
  };

  // Render a Terminal Pane
  const TerminalPane = ({ 
    type, 
    title, 
    icon: Icon, 
    logs, 
    colorClass, 
    refEl,
    onToggle,
    active
  }: { 
    type: LogType, 
    title: string, 
    icon: any, 
    logs: string[], 
    colorClass: string,
    refEl: React.RefObject<HTMLDivElement>,
    onToggle: () => void,
    active: boolean
  }) => {
    if (!active) return null;

    return (
      <div className={`flex-1 flex flex-col min-w-[200px] border-r border-[var(--border-color)] last:border-r-0 bg-[var(--bg-panel)]/90 backdrop-blur-xl transition-all duration-300`}>
        {/* Pane Header */}
        <div className="h-8 bg-[var(--bg-surface)] border-b border-[var(--border-color)] flex items-center justify-between px-3 select-none">
          <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${colorClass}`}>
            <Icon size={12} />
            {title}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => clear(type)} className="text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] transition-colors" title="Clear">
              <RotateCcw size={12} />
            </button>
            <button onClick={onToggle} className="text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] transition-colors" title="Minimize">
              <Minimize2 size={12} />
            </button>
          </div>
        </div>
        {/* Pane Content */}
        <div className="flex-1 p-3 overflow-y-auto font-mono text-xs custom-scrollbar bg-[var(--bg-secondary)] shadow-inner">
           {/* Scanline background for terminals */}
           <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 bg-[length:100%_2px,3px_100%]"></div>
           
           <div className="relative z-10">
              {logs.map((line, idx) => (
                <div key={idx} className={`mb-1 whitespace-pre-wrap break-all ${line.toLowerCase().includes('error') ? 'text-pink-500' : 'text-[var(--fg-secondary)]'}`}>
                  <span className="opacity-30 mr-2 select-none">{idx+1}</span>
                  {line}
                </div>
              ))}
              <div ref={refEl} className={`w-2 h-4 ${colorClass.replace('text-', 'bg-')} animate-pulse mt-1`}></div>
           </div>
        </div>
      </div>
    );
  };

  // Dock Toggle Button
  const DockToggle = ({ type, label, icon: Icon, active, color }: any) => (
    <button 
      onClick={() => toggleTerminal(type)}
      className={`
        flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all border-t-2
        ${active 
          ? `bg-[var(--bg-panel)] text-[var(--fg-primary)] border-${color}-500 shadow-[0_-5px_15px_rgba(0,0,0,0.1)]` 
          : 'bg-[var(--bg-surface)] text-[var(--fg-secondary)] border-transparent hover:text-[var(--fg-primary)] hover:bg-[var(--border-color)]'}
      `}
    >
      <Icon size={14} className={active ? `text-${color}-400` : ''} />
      {label}
    </button>
  );

  return (
    <div className="h-full flex flex-col relative overflow-hidden bg-[var(--bg-surface)]">
      {/* Top Bar / Actions */}
      <header className="h-16 border-b border-[var(--border-color)] flex items-center justify-between px-6 bg-[var(--glass-bg)] backdrop-blur-sm z-20">
        <div className="flex items-center gap-4">
          <div className="text-[var(--fg-secondary)] text-sm">Modules <span className="mx-1 text-[var(--border-color)]">/</span> <span className="text-[var(--fg-primary)] font-medium">Intro to Python</span></div>
        </div>

        <div className="flex items-center gap-3">
           <div className="flex bg-[var(--bg-panel)] rounded-lg p-1 border border-[var(--border-color)] relative">
             <button 
               onClick={() => setViewMode('blocks')}
               className={`relative z-10 px-3 py-1.5 rounded-md flex items-center gap-2 text-xs font-medium uppercase tracking-wide transition-all ${viewMode === 'blocks' ? 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 shadow-sm' : 'text-[var(--fg-secondary)] hover:text-[var(--fg-primary)]'}`}
             >
               <Blocks size={16} />
               Blocks
             </button>
             <button 
               onClick={() => setViewMode('text')}
               className={`relative z-10 px-3 py-1.5 rounded-md flex items-center gap-2 text-xs font-medium uppercase tracking-wide transition-all ${viewMode === 'text' ? 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 shadow-sm' : 'text-[var(--fg-secondary)] hover:text-[var(--fg-primary)]'}`}
             >
               <Code2 size={16} />
               Text
             </button>
           </div>
           
           <div className="w-px h-6 bg-[var(--border-color)] mx-1"></div>
           
           <button onClick={handleReset} className="p-2 text-[var(--fg-secondary)] hover:text-pink-500 transition-colors" title="Reset">
             <Trash2 size={18} />
           </button>

           <HudButton variant="secondary" onClick={() => {}} icon={<Save size={16} />}>
             Save
           </HudButton>
           
           <HudButton 
             variant="primary" 
             onClick={handleRun} 
             disabled={isRunning}
             icon={isRunning ? <RotateCcw className="animate-spin" size={16}/> : <Play size={16} />}
           >
             {isRunning ? 'Running' : 'Run'}
           </HudButton>
        </div>
      </header>

      {/* Main Editor Area */}
      <main className="flex-1 relative overflow-hidden p-1 flex flex-col">
        <div className="flex-1 bg-[var(--bg-panel)] m-2 rounded-xl border border-[var(--border-color)] overflow-hidden flex flex-col relative z-10">
          <BlockPyWrapper 
            ref={blockPyRef}
            viewMode={viewMode}
            onOutput={handleWrapperOutput}
            onError={handleWrapperError}
          />
        </div>

        {/* Terminal Dock Area */}
        <div className="flex flex-col mx-2 mb-2 z-20 shadow-2xl">
           {/* Dock Tabs */}
           <div className="flex items-end gap-1 px-2 border-b border-[var(--border-color)] bg-[var(--glass-bg)]">
             <DockToggle type="user" label="Console" icon={TerminalIcon} active={showUser} color="cyan" />
             <DockToggle type="system" label="System" icon={Cpu} active={showSystem} color="amber" />
             <DockToggle type="ai" label="Neural Link" icon={Activity} active={showAI} color="pink" />
             <div className="flex-1"></div>
           </div>

           {/* Dock Content (Split Pane) */}
           {(showUser || showSystem || showAI) && (
             <div className="h-[200px] flex border border-[var(--border-color)] border-t-0 rounded-b-xl overflow-hidden bg-[var(--bg-panel)]">
               <TerminalPane 
                 type="user" 
                 title="User Console" 
                 icon={TerminalIcon} 
                 logs={userLogs} 
                 colorClass="text-cyan-400" 
                 refEl={userEndRef} 
                 onToggle={() => toggleTerminal('user')}
                 active={showUser}
               />
               <TerminalPane 
                 type="system" 
                 title="System Operations" 
                 icon={Cpu} 
                 logs={systemLogs} 
                 colorClass="text-amber-400" 
                 refEl={systemEndRef} 
                 onToggle={() => toggleTerminal('system')}
                 active={showSystem}
               />
               <TerminalPane 
                 type="ai" 
                 title="Neural Process" 
                 icon={Activity} 
                 logs={aiLogs} 
                 colorClass="text-pink-400" 
                 refEl={aiEndRef} 
                 onToggle={() => toggleTerminal('ai')}
                 active={showAI}
               />
             </div>
           )}
        </div>
      </main>
    </div>
  );
};