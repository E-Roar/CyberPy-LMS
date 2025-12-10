import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { useTerminal } from '../context/TerminalContext';

// Global type augmentations
declare global {
  interface Window {
    Blockly: any;
    Sk: any;
    lastClickedCategory?: string | null;
  }
}

export interface BlockPyRef {
  run: () => void;
  getCode: () => string;
  reset: () => void;
}

interface BlockPyWrapperProps {
  initialCode?: string;
  viewMode: 'blocks' | 'text';
  onCodeChange?: (code: string) => void;
  onOutput?: (output: string) => void; // For User Terminal
  onError?: (error: string) => void;
}

export const BlockPyWrapper = forwardRef<BlockPyRef, BlockPyWrapperProps>(({ 
  initialCode = '', 
  viewMode,
  onCodeChange,
  onOutput,
  onError
}, ref) => {
  const { log } = useTerminal();
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const workspaceRef = useRef<any>(null);
  
  const [libsLoaded, setLibsLoaded] = useState(false);
  const [code, setCode] = useState(initialCode);

  // 1. Optimized Parallel Loading of External Libraries
  useEffect(() => {
    if (window.Blockly && window.Sk) {
      setLibsLoaded(true);
      return;
    }

    log('system', 'Initiating parallel resource fetch...');
    const startTime = performance.now();

    const loadScript = (src: string) => {
      return new Promise<void>((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.crossOrigin = "anonymous"; 
        s.onload = () => resolve();
        s.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.body.appendChild(s);
      });
    };

    // Chain 1: Blockly Core -> Dependencies
    const loadBlocklyChain = async () => {
        await loadScript('https://unpkg.com/blockly/blockly.min.js');
        log('system', 'Blockly Core loaded.');
        await Promise.all([
          loadScript('https://unpkg.com/blockly/python_compressed.js'),
          loadScript('https://unpkg.com/blockly/blocks_compressed.js'),
          loadScript('https://unpkg.com/blockly/msg/en.js'),
        ]);
        log('system', 'Blockly dependencies loaded.');
    };

    // Chain 2: Skulpt Core -> StdLib (Independent of Blockly)
    const loadSkulptChain = async () => {
        await loadScript('https://skulpt.org/js/skulpt.min.js');
        log('system', 'Skulpt Engine loaded.');
        await loadScript('https://skulpt.org/js/skulpt-stdlib.js');
        log('system', 'Python Standard Library loaded.');
    };

    // Execute both chains in parallel
    Promise.all([loadBlocklyChain(), loadSkulptChain()])
      .then(() => {
        const duration = (performance.now() - startTime).toFixed(2);
        log('system', `All systems ready in ${duration}ms.`);
        setLibsLoaded(true);
      }).catch(err => {
        console.error("Failed to load dependencies", err);
        log('system', `CRITICAL ERROR: ${err.message}`);
        if(onError) onError("System Error: Failed to load execution engine.");
      });
  }, []);

  // 2. Initialize Blockly Workspace
  useEffect(() => {
    if (libsLoaded && containerRef.current && !workspaceRef.current && viewMode === 'blocks') {
      
      const CyberTheme = window.Blockly.Theme.defineTheme('cyber', {
        base: window.Blockly.Themes.Classic,
        componentStyles: {
          workspaceBackgroundColour: '#0a0c14', 
          toolboxBackgroundColour: '#0f1220', 
          toolboxForegroundColour: '#b9c0cf',
          flyoutBackgroundColour: '#0f1220',
          flyoutOpacity: 0.95,
          scrollbarColour: '#6bf3ff',
          scrollbarOpacity: 0.2,
          insertionMarkerColour: '#6bf3ff',
          insertionMarkerOpacity: 0.5,
        },
        fontStyle: {
          family: 'JetBrains Mono, monospace',
          weight: 'bold',
          size: 12
        },
        blockStyles: {
          "logic_blocks": { "colourPrimary": "#3b82f6", "colourSecondary": "#2563eb", "colourTertiary": "#1d4ed8" }, 
          "loop_blocks": { "colourPrimary": "#10b981", "colourSecondary": "#059669", "colourTertiary": "#047857" }, 
          "math_blocks": { "colourPrimary": "#8b5cf6", "colourSecondary": "#7c3aed", "colourTertiary": "#6d28d9" }, 
          "text_blocks": { "colourPrimary": "#f59e0b", "colourSecondary": "#d97706", "colourTertiary": "#b45309" }, 
          "list_blocks": { "colourPrimary": "#ec4899", "colourSecondary": "#db2777", "colourTertiary": "#be185d" }, 
          "variable_blocks": { "colourPrimary": "#f43f5e", "colourSecondary": "#e11d48", "colourTertiary": "#be123c" }, 
          "procedure_blocks": { "colourPrimary": "#06b6d4", "colourSecondary": "#0891b2", "colourTertiary": "#0e7490" } 
        }
      });

      const style = document.createElement('style');
      style.id = 'cyber-blockly-styles';
      style.innerHTML = `
        .blocklySvg { background-color: transparent !important; outline: none; }
        .blocklyMainBackground { stroke: none !important; fill: none !important; }
        .blocklyToolboxDiv { background-color: #0f1220 !important; border-right: 1px solid rgba(107, 243, 255, 0.15); box-shadow: 5px 0 15px rgba(0,0,0,0.5); }
        .blocklyTreeRow { height: 44px !important; line-height: 44px !important; margin-bottom: 2px; border-left: 3px solid transparent; transition: all 0.2s ease; padding-left: 12px !important; }
        .blocklyTreeRow:not(.blocklyTreeSelected):hover { background-color: rgba(107, 243, 255, 0.05) !important; border-left: 3px solid rgba(107, 243, 255, 0.3); }
        .blocklyTreeSelected .blocklyTreeRow { background-color: rgba(107, 243, 255, 0.1) !important; border-left: 3px solid #6bf3ff !important; box-shadow: inset 15px 0 20px -10px rgba(107, 243, 255, 0.15); }
        .blocklyTreeLabel { font-family: 'Orbitron', sans-serif !important; color: #94a3b8 !important; font-size: 11px !important; font-weight: 600 !important; text-transform: uppercase; letter-spacing: 1.5px; }
        .blocklyTreeSelected .blocklyTreeLabel { color: #6bf3ff !important; text-shadow: 0 0 8px rgba(107, 243, 255, 0.6); }
        .blocklyTreeIcon { visibility: hidden; width: 0 !important; }
        .blocklyFlyoutBackground { fill: #0a0c14 !important; fill-opacity: 0.98 !important; stroke: #6bf3ff; stroke-width: 1px; stroke-opacity: 0.3; }
        .blocklyScrollbarHandle { fill: #6bf3ff !important; fill-opacity: 0.2; stroke: #6bf3ff; stroke-width: 1; rx: 2; }
        .blocklyScrollbarHandle:hover { fill-opacity: 0.5 !important; }
        .cm-s-cyber { background: transparent; color: #e2e8f0; }
      `;
      if (!document.getElementById('cyber-blockly-styles')) {
        document.head.appendChild(style);
      }

      const toolboxXML = `
        <xml>
          <category name="Logic" colour="#3b82f6">
            <block type="controls_if"></block>
            <block type="logic_compare"></block>
            <block type="logic_operation"></block>
            <block type="logic_negate"></block>
            <block type="logic_boolean"></block>
          </category>
          <category name="Loops" colour="#10b981">
            <block type="controls_repeat_ext">
              <value name="TIMES"><shadow type="math_number"><field name="NUM">10</field></shadow></value>
            </block>
            <block type="controls_whileUntil"></block>
            <block type="controls_for">
              <value name="FROM"><shadow type="math_number"><field name="NUM">1</field></shadow></value>
              <value name="TO"><shadow type="math_number"><field name="NUM">10</field></shadow></value>
              <value name="BY"><shadow type="math_number"><field name="NUM">1</field></shadow></value>
            </block>
            <block type="controls_flow_statements"></block>
          </category>
          <category name="Math" colour="#8b5cf6">
            <block type="math_number"><field name="NUM">123</field></block>
            <block type="math_arithmetic"></block>
            <block type="math_single"></block>
            <block type="math_random_int"></block>
          </category>
          <category name="Text" colour="#f59e0b">
            <block type="text"></block>
            <block type="text_join"></block>
            <block type="text_print"></block>
            <block type="text_prompt_ext">
               <value name="TEXT"><shadow type="text"><field name="TEXT">Prompt:</field></shadow></value>
            </block>
          </category>
          <category name="Lists" colour="#ec4899">
            <block type="lists_create_with"></block>
            <block type="lists_getIndex"></block>
            <block type="lists_length"></block>
          </category>
          <category name="Variables" colour="#f43f5e" custom="VARIABLE"></category>
          <category name="Functions" colour="#06b6d4" custom="PROCEDURE"></category>
        </xml>
      `;

      workspaceRef.current = window.Blockly.inject(containerRef.current, {
        toolbox: toolboxXML,
        scrollbars: true,
        trashcan: true,
        move: { scrollbars: true, drag: true, wheel: true },
        theme: CyberTheme,
        renderer: 'zelos'
      });

      // Toggle Logic
      const toolbox = workspaceRef.current.getToolbox();
      let toolboxDiv = null;
      if (toolbox) {
        if (typeof toolbox.getDiv === 'function') toolboxDiv = toolbox.getDiv();
        else if (typeof toolbox.getHtmlDiv === 'function') toolboxDiv = toolbox.getHtmlDiv();
      }

      if (toolboxDiv) {
        toolboxDiv.addEventListener('click', (e: MouseEvent) => {
          const target = e.target as HTMLElement;
          const row = target.closest('.blocklyTreeRow');
          if (row) {
            const selectedItem = toolbox.getSelectedItem();
            if (selectedItem) {
               const contentContainer = row.closest('[role="treeitem"]');
               const labelSpan = row.querySelector('.blocklyTreeLabel');
               const categoryId = contentContainer?.getAttribute('aria-label') || labelSpan?.textContent || 'unknown';
               
               if (window.lastClickedCategory === categoryId && workspaceRef.current.getFlyout().isVisible()) {
                 workspaceRef.current.getFlyout().hide();
                 toolbox.clearSelection();
                 window.lastClickedCategory = null;
               } else {
                 window.lastClickedCategory = categoryId;
               }
            }
          }
        });
      }

      workspaceRef.current.addChangeListener(() => {
        const generatedCode = window.Blockly.Python.workspaceToCode(workspaceRef.current);
        setCode(generatedCode);
        if(onCodeChange) onCodeChange(generatedCode);
      });
      window.dispatchEvent(new Event('resize'));
    }
  }, [libsLoaded, viewMode]);

  // 3. Expose Methods to Parent (Run, Reset)
  useImperativeHandle(ref, () => ({
    run: () => {
      if (!window.Sk) {
        log('system', 'Error: Engine not loaded.');
        if(onError) onError("Python engine not loaded.");
        return;
      }

      log('system', 'Configuring Skulpt sandbox...');
      window.Sk.configure({
        output: (text: string) => { if(onOutput) onOutput(text); },
        inputfun: (promptText: string) => {
          return new Promise((resolve) => {
            log('system', `Waiting for user input: "${promptText}"`);
            const output = prompt(promptText || "Input required:");
            resolve(output || "");
          });
        },
        read: (x: string) => {
          if (window.Sk.builtinFiles === undefined || window.Sk.builtinFiles["files"][x] === undefined)
            throw "File not found: '" + x + "'";
          return window.Sk.builtinFiles["files"][x];
        },
        __future__: window.Sk.python3
      });

      const prog = viewMode === 'blocks' 
        ? window.Blockly.Python.workspaceToCode(workspaceRef.current) 
        : code;

      if(onOutput) onOutput(">> Running...\n");
      log('system', 'Execution started.');
      const startExec = performance.now();

      window.Sk.misceval.asyncToPromise(() => {
        return window.Sk.importMainWithBody("<stdin>", false, prog, true);
      }).then(
        () => { 
          const execTime = (performance.now() - startExec).toFixed(2);
          log('system', `Execution finished in ${execTime}ms.`);
          if(onOutput) onOutput(`\n>> Finished (${execTime}ms).`); 
        },
        (err: any) => { 
           log('system', `Runtime Error: ${err.toString()}`);
           if(onError) onError(err.toString()); 
        }
      );
    },
    getCode: () => code,
    reset: () => {
      if (workspaceRef.current) workspaceRef.current.clear();
      setCode('');
      log('system', 'Workspace reset.');
    }
  }));

  useEffect(() => {
    if (workspaceRef.current) {
      window.Blockly.svgResize(workspaceRef.current);
    }
  }, [viewMode]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value);
    if(onCodeChange) onCodeChange(e.target.value);
  };

  if (!libsLoaded) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-cyan-500/50 animate-pulse font-mono tracking-widest text-sm bg-[#0a0c14]">
        <div className="mb-2">[ INITIALIZING KERNEL ]</div>
        <div className="w-32 h-1 bg-cyan-900 rounded-full overflow-hidden">
           <div className="h-full bg-cyan-500 animate-[width_1s_ease-in-out_infinite] w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative group">
      <div 
        ref={containerRef} 
        className={`w-full h-full absolute inset-0 transition-opacity duration-300 ${viewMode === 'blocks' ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`} 
      />

      <div className={`w-full h-full absolute inset-0 bg-[#0a0c14] flex flex-row transition-opacity duration-300 ${viewMode === 'text' ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}>
        <div className="w-12 h-full bg-[#0f1220]/80 border-r border-white/5 pt-4 text-right pr-3 select-none">
          {code.split('\n').map((_, i) => (
             <div key={i} className="text-xs font-mono text-slate-600 leading-6">{i+1}</div>
          ))}
        </div>
        
        <div className="flex-1 relative">
           <textarea
             ref={editorRef}
             value={code}
             onChange={handleTextChange}
             className="w-full h-full bg-transparent text-slate-300 font-mono text-sm p-4 resize-none focus:outline-none leading-6 z-10 relative custom-scrollbar"
             spellCheck={false}
           />
           <div className="absolute inset-0 pointer-events-none p-4 font-mono text-sm leading-6 z-0 whitespace-pre-wrap overflow-hidden text-transparent">
             {code.split('\n').map((line, i) => (
               <div key={i}>
                 {line.replace(/(import|from|def|return|if|else|for|while|in|print)/g, '___$1___')}
               </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
});

BlockPyWrapper.displayName = 'BlockPyWrapper';