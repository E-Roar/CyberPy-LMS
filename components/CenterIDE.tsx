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
  Trash2
} from 'lucide-react';
import { ViewMode } from '../types';
import { HudButton } from './UI';
import { BlockPyWrapper, BlockPyRef } from './BlockPyWrapper';

export const CenterIDE: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('blocks');
  const [terminalOpen, setTerminalOpen] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    "> CyberPy Kernel v2.0.4 loaded.",
    "> Ready for execution."
  ]);
  
  const blockPyRef = useRef<BlockPyRef>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalOpen) {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalOutput, terminalOpen]);

  const handleWrapperOutput = (text: string) => {
    // Split by newlines to handle multiple print statements properly
    const lines = text.split('\n').filter(line => line.length > 0);
    setTerminalOutput(prev => [...prev, ...lines]);
  };

  const handleWrapperError = (err: string) => {
    setIsRunning(false);
    setTerminalOutput(prev => [...prev, `[ERROR]: ${err}`]);
  };

  const handleRun = () => {
    if (blockPyRef.current) {
      setIsRunning(true);
      setTerminalOpen(true);
      setTerminalOutput(prev => [...prev, "> Running script..."]);
      
      // Allow UI to update before blocking thread (if sync)
      setTimeout(() => {
        blockPyRef.current?.run();
        setIsRunning(false);
      }, 100);
    }
  };

  const handleClearTerminal = () => {
    setTerminalOutput(["> Terminal cleared."]);
  };

  const handleReset = () => {
    if (confirm("Clear workspace? This cannot be undone.")) {
      blockPyRef.current?.reset();
      setTerminalOutput(prev => [...prev, "> Workspace cleared."]);
    }
  };

  return (
    <div className="h-full flex flex-col relative overflow-hidden bg-[#11131a]">
      {/* Top Bar / Breadcrumbs / Actions */}
      <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#0f1220]/80 backdrop-blur-sm z-20">
        <div className="flex items-center gap-4">
          <div className="text-slate-400 text-sm">Courses <span className="mx-1 text-slate-600">/</span> Modules <span className="mx-1 text-slate-600">/</span> <span className="text-white font-medium">Lesson 1: Intro</span></div>
        </div>

        <div className="flex items-center gap-3">
           {/* Segmented Control for View Mode */}
           <div className="flex bg-[#0a0c14] rounded-lg p-1 border border-white/10 relative">
             <button 
               onClick={() => setViewMode('blocks')}
               className={`relative z-10 px-3 py-1.5 rounded-md flex items-center gap-2 text-xs font-medium uppercase tracking-wide transition-all ${viewMode === 'blocks' ? 'text-cyan-400 bg-cyan-900/30 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
               title="Block Mode"
             >
               <Blocks size={16} />
               <span className="hidden sm:inline">Blocks</span>
             </button>
             <button 
               onClick={() => setViewMode('text')}
               className={`relative z-10 px-3 py-1.5 rounded-md flex items-center gap-2 text-xs font-medium uppercase tracking-wide transition-all ${viewMode === 'text' ? 'text-cyan-400 bg-cyan-900/30 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
               title="Text Mode"
             >
               <Code2 size={16} />
               <span className="hidden sm:inline">Text</span>
             </button>
             
             {/* Slider bg */}
             <div 
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white/5 rounded-md transition-all duration-300 ease-in-out ${viewMode === 'blocks' ? 'left-1' : 'left-[calc(50%)]'}`} 
             />
           </div>

           <div className="w-px h-6 bg-white/10 mx-1"></div>
           
           <button 
             onClick={handleReset}
             className="p-2 text-slate-500 hover:text-pink-500 transition-colors"
             title="Reset Code"
           >
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
      <main className="flex-1 relative overflow-hidden p-1">
        <div className="absolute inset-0 bg-[#0a0c14] m-4 rounded-xl border border-white/10 overflow-hidden flex flex-col">
          <BlockPyWrapper 
            ref={blockPyRef}
            viewMode={viewMode}
            onOutput={handleWrapperOutput}
            onError={handleWrapperError}
          />
        </div>
      </main>

      {/* Terminal Overlay */}
      {terminalOpen && (
        <aside className="absolute bottom-4 left-4 right-4 z-30 flex flex-col pointer-events-none">
          <div className="pointer-events-auto bg-[#0a0c14]/90 backdrop-blur-xl border border-white/10 rounded-t-xl rounded-b-md shadow-2xl overflow-hidden flex flex-col max-h-[300px] min-h-[150px] transition-all duration-300">
            {/* Terminal Header */}
            <div className="h-9 bg-white/5 border-b border-white/10 flex items-center justify-between px-4 cursor-grab active:cursor-grabbing">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                <TerminalIcon size={14} className="text-cyan-400" />
                Console Output
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleClearTerminal} className="p-1 hover:text-white text-slate-500 transition-colors" title="Clear">
                  <RotateCcw size={14} />
                </button>
                <button className="p-1 hover:text-white text-slate-500 transition-colors" title="Copy">
                  <Copy size={14} />
                </button>
                <button onClick={() => setTerminalOpen(false)} className="p-1 hover:text-pink-500 text-slate-500 transition-colors">
                  <X size={14} />
                </button>
              </div>
            </div>
            {/* Terminal Body */}
            <div className="flex-1 p-4 overflow-y-auto font-mono text-sm custom-scrollbar bg-black/40">
              {terminalOutput.map((line, idx) => (
                <div key={idx} className={`${line.includes('Error') || line.includes('Traceback') ? 'text-pink-500' : line.startsWith('>') ? 'text-cyan-400/80' : 'text-slate-300'} mb-1 whitespace-pre-wrap`}>
                  {line}
                </div>
              ))}
              <div className="animate-pulse text-cyan-500">_</div>
              <div ref={terminalEndRef} />
            </div>
          </div>
        </aside>
      )}

      {/* Minimized Terminal Trigger */}
      {!terminalOpen && (
        <button 
          onClick={() => setTerminalOpen(true)}
          className="absolute bottom-6 right-6 z-30 bg-black/60 backdrop-blur-md border border-cyan-500/30 text-cyan-400 p-3 rounded-full shadow-[0_0_15px_rgba(107,243,255,0.2)] hover:scale-110 transition-transform"
        >
          <TerminalIcon size={20} />
        </button>
      )}
    </div>
  );
};