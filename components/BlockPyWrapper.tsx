import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { useTerminal } from '../context/TerminalContext';
import { useTheme } from '../context/ThemeContext';
import { useEditorContext } from '../context/EditorContext';

// Global type augmentations
declare global {
  interface Window {
    Blockly: any;
    Sk: any;
    lastClickedCategory?: string | null;
    __loadedScripts?: Set<string>;
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
  onOutput?: (output: string) => void;
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
  const { theme } = useTheme(); 
  const { setCode: setGlobalCode, setLastError } = useEditorContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const workspaceRef = useRef<any>(null);
  
  const [libsLoaded, setLibsLoaded] = useState(false);
  const [code, setCode] = useState(initialCode);

  // Sync initial code to context
  useEffect(() => {
    setGlobalCode(initialCode);
  }, []);

  // 1. Optimized Parallel Loading with Deduping & Error Suppression
  useEffect(() => {
    // Suppress specific Blockly HMR error
    const handleGlobalError = (event: ErrorEvent) => {
      if (event.message?.includes('Extension "contextMenu_variableDynamicSetterGetter" is already registered')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        console.warn("[BlockPy] Suppressed duplicate Blockly extension error (safe to ignore).");
        return true;
      }
    };
    window.addEventListener('error', handleGlobalError);

    // If libraries are already fully loaded and available in global scope
    if (window.Blockly && window.Sk && window.Blockly.Blocks) {
      setLibsLoaded(true);
      return () => window.removeEventListener('error', handleGlobalError);
    }

    const loadScript = (src: string, id: string) => {
      // Initialize global script registry if not present
      if (!window.__loadedScripts) window.__loadedScripts = new Set();
      
      return new Promise<void>((resolve, reject) => {
        // 1. Check Global Registry (Memory)
        if (window.__loadedScripts?.has(src)) {
            const globalKey = `__promise_script_${src}`;
            if ((window as any)[globalKey]) {
                (window as any)[globalKey].then(resolve, reject);
            } else {
                resolve();
            }
            return;
        }

        // 2. Check DOM by ID or SRC (Source of Truth)
        if (document.getElementById(id) || document.querySelector(`script[src="${src}"]`)) {
          window.__loadedScripts?.add(src); // Sync registry
          const globalKey = `__promise_script_${src}`;
          if ((window as any)[globalKey]) {
            (window as any)[globalKey].then(resolve, reject);
            return;
          }
          resolve();
          return;
        }

        // 3. Load Script
        window.__loadedScripts?.add(src);

        const s = document.createElement('script');
        s.src = src;
        s.id = id;
        s.async = true;
        s.crossOrigin = "anonymous";
        
        const promise = new Promise<void>((res, rej) => {
          s.onload = () => res();
          s.onerror = () => rej(new Error(`Failed to load ${src}`));
        });

        (window as any)[`__promise_script_${src}`] = promise;

        document.body.appendChild(s);
        promise.then(resolve, reject);
      });
    };

    log('system', 'Initiating resource fetch...');
    const startTime = performance.now();

    const loadBlocklyChain = async () => {
        // Double-check existence inside async flow to prevent race conditions
        if (window.Blockly && window.Blockly.Blocks) {
             return; 
        }

        try {
          await loadScript('https://unpkg.com/blockly/blockly.min.js', 'script-blockly-core');
          await Promise.all([
            loadScript('https://unpkg.com/blockly/python_compressed.js', 'script-blockly-python'),
            loadScript('https://unpkg.com/blockly/blocks_compressed.js', 'script-blockly-blocks'),
            loadScript('https://unpkg.com/blockly/msg/en.js', 'script-blockly-lang'),
          ]);
          log('system', 'Blockly Core & Deps loaded.');
        } catch (e) {
          console.error("Blockly Load Error:", e);
          throw e;
        }
    };

    const loadSkulptChain = async () => {
        if (window.Sk) return;

        await loadScript('https://skulpt.org/js/skulpt.min.js', 'script-skulpt-core');
        await loadScript('https://skulpt.org/js/skulpt-stdlib.js', 'script-skulpt-stdlib');
        log('system', 'Skulpt Engine loaded.');
    };

    Promise.all([loadBlocklyChain(), loadSkulptChain()])
      .then(() => {
        const duration = (performance.now() - startTime).toFixed(2);
        log('system', `Systems ready in ${duration}ms.`);
        setLibsLoaded(true);
      }).catch(err => {
        console.error("Failed to load dependencies", err);
        // Even if load failed, check if objects exist (maybe partial load or cached)
        if (window.Blockly && window.Sk) {
             setLibsLoaded(true);
        } else {
             log('system', `CRITICAL ERROR: ${err.message}`);
             if(onError) onError("System Error: Failed to load execution engine.");
        }
      });
      
      return () => window.removeEventListener('error', handleGlobalError);
  }, []);

  // 2. Initialize Blockly and Handle Theme Changes
  useEffect(() => {
    if (libsLoaded && containerRef.current && window.Blockly) {
      
      // -- A. DEFINE THEMES (Canvas/SVG Colors) --
      const themeColors = {
        cyber: {
          workspace: '#0a0c14',
          flyout: '#0f1220',
          blocks: {
            logic: { primary: "#3b82f6", secondary: "#2563eb", tertiary: "#1d4ed8" },
            loop: { primary: "#10b981", secondary: "#059669", tertiary: "#047857" },
            math: { primary: "#8b5cf6", secondary: "#7c3aed", tertiary: "#6d28d9" },
            text: { primary: "#f59e0b", secondary: "#d97706", tertiary: "#b45309" },
            list: { primary: "#ec4899", secondary: "#db2777", tertiary: "#be185d" },
            variable: { primary: "#f43f5e", secondary: "#e11d48", tertiary: "#be123c" },
            procedure: { primary: "#06b6d4", secondary: "#0891b2", tertiary: "#0e7490" }
          }
        },
        solaris: {
          workspace: '#fdf6e3',
          flyout: '#eee8d5',
          blocks: {
            logic: { primary: "#268bd2", secondary: "#2075c7", tertiary: "#1b60ad" },
            loop: { primary: "#859900", secondary: "#718200", tertiary: "#5d6b00" },
            math: { primary: "#6c71c4", secondary: "#6166b0", tertiary: "#565a9c" },
            text: { primary: "#b58900", secondary: "#a17a00", tertiary: "#8d6b00" },
            list: { primary: "#d33682", secondary: "#c12e75", tertiary: "#af2668" },
            variable: { primary: "#dc322f", secondary: "#cb2926", tertiary: "#ba201d" },
            procedure: { primary: "#2aa198", secondary: "#258f86", tertiary: "#207d74" }
          }
        }
      };

      const currentPalette = theme === 'cyber' ? themeColors.cyber : themeColors.solaris;
      const themeName = `app-theme-${theme}`;

      // Always define/overwrite the theme to ensure it matches current state
      window.Blockly.Theme.defineTheme(themeName, {
        base: window.Blockly.Themes.Classic,
        componentStyles: {
          workspaceBackgroundColour: currentPalette.workspace,
          toolboxBackgroundColour: currentPalette.flyout,
          toolboxForegroundColour: theme === 'cyber' ? '#b9c0cf' : '#586e75',
          flyoutBackgroundColour: currentPalette.flyout,
          flyoutOpacity: 0.95,
          scrollbarColour: theme === 'cyber' ? '#6bf3ff' : '#cb4b16',
          scrollbarOpacity: 0.2,
          insertionMarkerColour: theme === 'cyber' ? '#6bf3ff' : '#cb4b16',
          insertionMarkerOpacity: 0.5,
        },
        fontStyle: {
          family: 'JetBrains Mono, monospace',
          weight: 'bold',
          size: 12
        },
        blockStyles: {
          "logic_blocks": { "colourPrimary": currentPalette.blocks.logic.primary, "colourSecondary": currentPalette.blocks.logic.secondary, "colourTertiary": currentPalette.blocks.logic.tertiary },
          "loop_blocks": { "colourPrimary": currentPalette.blocks.loop.primary, "colourSecondary": currentPalette.blocks.loop.secondary, "colourTertiary": currentPalette.blocks.loop.tertiary },
          "math_blocks": { "colourPrimary": currentPalette.blocks.math.primary, "colourSecondary": currentPalette.blocks.math.secondary, "colourTertiary": currentPalette.blocks.math.tertiary },
          "text_blocks": { "colourPrimary": currentPalette.blocks.text.primary, "colourSecondary": currentPalette.blocks.text.secondary, "colourTertiary": currentPalette.blocks.text.tertiary },
          "list_blocks": { "colourPrimary": currentPalette.blocks.list.primary, "colourSecondary": currentPalette.blocks.list.secondary, "colourTertiary": currentPalette.blocks.list.tertiary },
          "variable_blocks": { "colourPrimary": currentPalette.blocks.variable.primary, "colourSecondary": currentPalette.blocks.variable.secondary, "colourTertiary": currentPalette.blocks.variable.tertiary },
          "procedure_blocks": { "colourPrimary": currentPalette.blocks.procedure.primary, "colourSecondary": currentPalette.blocks.procedure.secondary, "colourTertiary": currentPalette.blocks.procedure.tertiary }
        }
      });

      // -- B. INJECT UI STYLES (DOM/CSS Transitions) --
      const styleId = 'blockly-dynamic-styles';
      let styleEl = document.getElementById(styleId);
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }

      styleEl.innerHTML = `
        .blocklySvg { 
          background-color: transparent !important; 
          outline: none; 
          transition: background-color 0.3s ease-in-out;
        }
        
        .blocklyMainBackground { 
          stroke: none !important; 
          fill: none !important; 
        }
        
        /* TOOLBOX */
        .blocklyToolboxDiv { 
          background-color: var(--bg-panel) !important; 
          border-right: 1px solid var(--border-color); 
          box-shadow: 5px 0 15px rgba(0,0,0,0.1); 
          transition: background-color 0.3s ease, border-color 0.3s ease;
        }
        
        .blocklyTreeRow { 
          height: 44px !important; 
          line-height: 44px !important; 
          margin-bottom: 2px; 
          border-left: 3px solid transparent; 
          padding-left: 12px !important; 
          transition: all 0.2s ease-in-out !important;
        }
        
        .blocklyTreeRow:not(.blocklyTreeSelected):hover { 
          background-color: var(--border-color) !important; 
          border-left: 3px solid var(--accent-primary); 
          opacity: 0.8;
        }
        
        .blocklyTreeSelected .blocklyTreeRow { 
          background-color: var(--bg-surface) !important; 
          border-left: 3px solid var(--accent-primary) !important; 
        }
        
        .blocklyTreeLabel { 
          font-family: 'Orbitron', sans-serif !important; 
          color: var(--fg-secondary) !important; 
          font-size: 11px !important; 
          font-weight: 600 !important; 
          text-transform: uppercase; 
          letter-spacing: 1.5px; 
          transition: color 0.3s ease;
        }
        
        .blocklyTreeSelected .blocklyTreeLabel { 
          color: var(--accent-primary) !important; 
          text-shadow: 0 0 8px rgba(107, 243, 255, 0.2); 
        }
        
        .blocklyTreeIcon { visibility: hidden; width: 0 !important; }
        
        /* FLYOUT */
        .blocklyFlyoutBackground { 
          fill: var(--bg-panel) !important; 
          fill-opacity: 0.98 !important; 
          stroke: var(--accent-primary); 
          stroke-width: 1px; 
          stroke-opacity: 0.3; 
          transition: fill 0.3s ease, stroke 0.3s ease;
        }

        .blocklyScrollbarHandle {
          fill: var(--accent-primary) !important;
          fill-opacity: 0.3 !important;
          transition: fill 0.3s ease;
        }
        
        /* SCROLLBARS */
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
      `;

      // -- C. INITIALIZE OR UPDATE WORKSPACE --
      if (!workspaceRef.current && viewMode === 'blocks') {
        const toolboxXML = `
          <xml>
            <category name="Logic" colour="${currentPalette.blocks.logic.primary}">
              <block type="controls_if"></block>
              <block type="logic_compare"></block>
              <block type="logic_operation"></block>
              <block type="logic_negate"></block>
              <block type="logic_boolean"></block>
            </category>
            <category name="Loops" colour="${currentPalette.blocks.loop.primary}">
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
            <category name="Math" colour="${currentPalette.blocks.math.primary}">
              <block type="math_number"><field name="NUM">123</field></block>
              <block type="math_arithmetic"></block>
              <block type="math_single"></block>
              <block type="math_random_int"></block>
            </category>
            <category name="Text" colour="${currentPalette.blocks.text.primary}">
              <block type="text"></block>
              <block type="text_join"></block>
              <block type="text_print"></block>
              <block type="text_prompt_ext">
                <value name="TEXT"><shadow type="text"><field name="TEXT">Prompt:</field></shadow></value>
              </block>
            </category>
            <category name="Lists" colour="${currentPalette.blocks.list.primary}">
              <block type="lists_create_with"></block>
              <block type="lists_getIndex"></block>
              <block type="lists_length"></block>
            </category>
            <category name="Variables" colour="${currentPalette.blocks.variable.primary}" custom="VARIABLE"></category>
            <category name="Functions" colour="${currentPalette.blocks.procedure.primary}" custom="PROCEDURE"></category>
          </xml>
        `;

        workspaceRef.current = window.Blockly.inject(containerRef.current, {
          toolbox: toolboxXML,
          scrollbars: true,
          trashcan: true,
          move: { scrollbars: true, drag: true, wheel: true },
          theme: themeName,
          renderer: 'zelos'
        });

        // Initialize listeners...
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
          setGlobalCode(generatedCode); // Sync to global context
          if(onCodeChange) onCodeChange(generatedCode);
        });
      } else if (workspaceRef.current) {
        // Just update the theme if workspace exists
        const themeObj = window.Blockly.registry.getObject(window.Blockly.registry.Type.THEME, themeName);
        if (themeObj) {
            workspaceRef.current.setTheme(themeObj);
        }
      }

      window.dispatchEvent(new Event('resize'));
    }
  }, [libsLoaded, viewMode, theme]);

  // 3. Expose Methods
  useImperativeHandle(ref, () => ({
    run: () => {
      // Clear previous errors on new run
      setLastError(null);

      if (!window.Sk) {
        if(onError) onError("Python engine not loaded.");
        return;
      }

      window.Sk.configure({
        output: (text: string) => { if(onOutput) onOutput(text); },
        inputfun: (promptText: string) => {
          return new Promise((resolve) => {
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
           const errorMsg = err.toString();
           log('system', `Runtime Error: ${errorMsg}`);
           setLastError(errorMsg); // Sync error to global context
           if(onError) onError(errorMsg); 
        }
      );
    },
    getCode: () => code,
    reset: () => {
      if (workspaceRef.current) workspaceRef.current.clear();
      setCode('');
      setGlobalCode('');
      setLastError(null);
      log('system', 'Workspace reset.');
    }
  }));

  useEffect(() => {
    if (workspaceRef.current) {
      window.Blockly.svgResize(workspaceRef.current);
    }
  }, [viewMode]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setCode(val);
    setGlobalCode(val); // Sync to global context
    if(onCodeChange) onCodeChange(val);
  };

  if (!libsLoaded) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-[var(--accent-primary)] animate-pulse font-mono tracking-widest text-sm bg-[var(--bg-panel)]">
        <div className="mb-2">[ INITIALIZING KERNEL ]</div>
        <div className="w-32 h-1 bg-[var(--fg-secondary)] rounded-full overflow-hidden">
           <div className="h-full bg-[var(--accent-primary)] animate-[width_1s_ease-in-out_infinite] w-1/2"></div>
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

      <div className={`w-full h-full absolute inset-0 bg-[var(--bg-panel)] flex flex-row transition-opacity duration-300 ${viewMode === 'text' ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}>
        <div className="w-12 h-full bg-[var(--bg-surface)] border-r border-[var(--border-color)] pt-4 text-right pr-3 select-none">
          {code.split('\n').map((_, i) => (
             <div key={i} className="text-xs font-mono text-[var(--fg-secondary)] leading-6">{i+1}</div>
          ))}
        </div>
        
        <div className="flex-1 relative">
           <textarea
             ref={editorRef}
             value={code}
             onChange={handleTextChange}
             className="w-full h-full bg-transparent text-[var(--fg-primary)] font-mono text-sm p-4 resize-none focus:outline-none leading-6 z-10 relative custom-scrollbar"
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
