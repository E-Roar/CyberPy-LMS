import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';

// Global type augmentations for the external libraries we are loading
declare global {
  interface Window {
    Blockly: any;
    Sk: any;
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
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const workspaceRef = useRef<any>(null);
  
  const [libsLoaded, setLibsLoaded] = useState(false);
  const [code, setCode] = useState(initialCode);

  // 1. Load External Libraries (Blockly & Skulpt) from CDN
  useEffect(() => {
    if (window.Blockly && window.Sk) {
      setLibsLoaded(true);
      return;
    }

    const loadScript = (src: string) => {
      return new Promise<void>((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.body.appendChild(s);
      });
    };

    // Load Core First, then dependencies sequentially to avoid race conditions
    loadScript('https://unpkg.com/blockly/blockly.min.js')
      .then(() => {
        // Load Blockly dependencies (can be parallel as they depend on core)
        return Promise.all([
          loadScript('https://unpkg.com/blockly/python_compressed.js'), // Generator
          loadScript('https://unpkg.com/blockly/blocks_compressed.js'), // Blocks
          loadScript('https://unpkg.com/blockly/msg/en.js'), // Messages
        ]);
      })
      .then(() => {
        // Load Skulpt Core
        return loadScript('https://skulpt.org/js/skulpt.min.js');
      })
      .then(() => {
        // Load Skulpt StdLib (must wait for Skulpt Core)
        return loadScript('https://skulpt.org/js/skulpt-stdlib.js');
      })
      .then(() => {
        setLibsLoaded(true);
      }).catch(err => {
        console.error("Failed to load BlockPy dependencies", err);
        if(onError) onError("System Error: Failed to load execution engine.");
      });
    
    // Inject Custom HUD CSS for Blockly
    const style = document.createElement('style');
    style.innerHTML = `
      .blocklySvg {
        background-color: transparent !important;
        outline: none;
      }
      .blocklyToolboxDiv {
        background-color: rgba(15, 18, 32, 0.85) !important;
        backdrop-filter: blur(10px);
        border-right: 1px solid rgba(255,255,255,0.1);
      }
      .blocklyFlyoutBackground {
        fill: rgba(15, 18, 32, 0.95) !important;
        fill-opacity: 1 !important;
      }
      .blocklyTreeLabel {
        font-family: 'Orbitron', sans-serif !important;
        color: #6bf3ff !important;
        font-size: 12px !important;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      .blocklyTreeRow:hover {
        background-color: rgba(107, 243, 255, 0.1) !important;
      }
      .blocklyTreeSelected .blocklyTreeRow {
        background-color: rgba(107, 243, 255, 0.2) !important;
        border-left: 3px solid #6bf3ff;
      }
      .blocklyMainBackground {
        stroke: none !important; 
      }
      .blocklyScrollbarHandle {
        fill: rgba(107, 243, 255, 0.3) !important;
        rx: 4;
      }
      .blocklyPath {
        stroke-width: 1px !important;
        stroke: rgba(0,0,0,0.2) !important;
      }
      /* Text Mode Styling */
      .cm-s-cyber {
        background: transparent;
        color: #e2e8f0;
      }
    `;
    document.head.appendChild(style);
  }, []);

  // 2. Initialize Blockly Workspace
  useEffect(() => {
    if (libsLoaded && containerRef.current && !workspaceRef.current && viewMode === 'blocks') {
      const toolboxXML = `
        <xml>
          <category name="Logic" colour="%{BKY_LOGIC_HUE}">
            <block type="controls_if"></block>
            <block type="logic_compare"></block>
            <block type="logic_operation"></block>
            <block type="logic_negate"></block>
            <block type="logic_boolean"></block>
            <block type="logic_null"></block>
            <block type="logic_ternary"></block>
          </category>
          <category name="Loops" colour="%{BKY_LOOPS_HUE}">
            <block type="controls_repeat_ext">
              <value name="TIMES">
                <shadow type="math_number">
                  <field name="NUM">10</field>
                </shadow>
              </value>
            </block>
            <block type="controls_whileUntil"></block>
            <block type="controls_for">
              <value name="FROM">
                <shadow type="math_number">
                  <field name="NUM">1</field>
                </shadow>
              </value>
              <value name="TO">
                <shadow type="math_number">
                  <field name="NUM">10</field>
                </shadow>
              </value>
              <value name="BY">
                <shadow type="math_number">
                  <field name="NUM">1</field>
                </shadow>
              </value>
            </block>
            <block type="controls_forEach"></block>
            <block type="controls_flow_statements"></block>
          </category>
          <category name="Math" colour="%{BKY_MATH_HUE}">
            <block type="math_number">
              <field name="NUM">123</field>
            </block>
            <block type="math_arithmetic">
              <value name="A">
                <shadow type="math_number">
                  <field name="NUM">1</field>
                </shadow>
              </value>
              <value name="B">
                <shadow type="math_number">
                  <field name="NUM">1</field>
                </shadow>
              </value>
            </block>
            <block type="math_single">
              <value name="NUM">
                <shadow type="math_number">
                  <field name="NUM">9</field>
                </shadow>
              </value>
            </block>
            <block type="math_trig">
              <value name="NUM">
                <shadow type="math_number">
                  <field name="NUM">45</field>
                </shadow>
              </value>
            </block>
            <block type="math_constant"></block>
            <block type="math_number_property">
              <value name="NUMBER_TO_CHECK">
                <shadow type="math_number">
                  <field name="NUM">0</field>
                </shadow>
              </value>
            </block>
            <block type="math_round">
              <value name="NUM">
                <shadow type="math_number">
                  <field name="NUM">3.1</field>
                </shadow>
              </value>
            </block>
            <block type="math_on_list"></block>
            <block type="math_modulo">
              <value name="DIVIDEND">
                <shadow type="math_number">
                  <field name="NUM">64</field>
                </shadow>
              </value>
              <value name="DIVISOR">
                <shadow type="math_number">
                  <field name="NUM">10</field>
                </shadow>
              </value>
            </block>
            <block type="math_constrain">
              <value name="VALUE">
                <shadow type="math_number">
                  <field name="NUM">50</field>
                </shadow>
              </value>
              <value name="LOW">
                <shadow type="math_number">
                  <field name="NUM">1</field>
                </shadow>
              </value>
              <value name="HIGH">
                <shadow type="math_number">
                  <field name="NUM">100</field>
                </shadow>
              </value>
            </block>
            <block type="math_random_int">
              <value name="FROM">
                <shadow type="math_number">
                  <field name="NUM">1</field>
                </shadow>
              </value>
              <value name="TO">
                <shadow type="math_number">
                  <field name="NUM">100</field>
                </shadow>
              </value>
            </block>
            <block type="math_random_float"></block>
          </category>
          <category name="Text" colour="%{BKY_TEXTS_HUE}">
            <block type="text"></block>
            <block type="text_join"></block>
            <block type="text_append">
              <value name="TEXT">
                <shadow type="text"></shadow>
              </value>
            </block>
            <block type="text_length">
              <value name="VALUE">
                <shadow type="text">
                  <field name="TEXT">abc</field>
                </shadow>
              </value>
            </block>
            <block type="text_isEmpty">
              <value name="VALUE">
                <shadow type="text">
                  <field name="TEXT"></field>
                </shadow>
              </value>
            </block>
            <block type="text_indexOf">
              <value name="VALUE">
                <shadow type="block_type"></shadow>
              </value>
              <value name="FIND">
                <shadow type="text">
                  <field name="TEXT">abc</field>
                </shadow>
              </value>
            </block>
            <block type="text_charAt">
              <value name="VALUE">
                <shadow type="block_type"></shadow>
              </value>
            </block>
            <block type="text_getSubstring">
              <value name="STRING">
                <shadow type="block_type"></shadow>
              </value>
            </block>
            <block type="text_changeCase">
              <value name="TEXT">
                <shadow type="text">
                  <field name="TEXT">abc</field>
                </shadow>
              </value>
            </block>
            <block type="text_trim">
              <value name="TEXT">
                <shadow type="text">
                  <field name="TEXT">abc</field>
                </shadow>
              </value>
            </block>
            <block type="text_print">
              <value name="TEXT">
                <shadow type="text">
                  <field name="TEXT">abc</field>
                </shadow>
              </value>
            </block>
            <block type="text_prompt_ext">
              <value name="TEXT">
                <shadow type="text">
                  <field name="TEXT">abc</field>
                </shadow>
              </value>
            </block>
          </category>
          <category name="Lists" colour="%{BKY_LISTS_HUE}">
            <block type="lists_create_with">
              <mutation items="0"></mutation>
            </block>
            <block type="lists_create_with"></block>
            <block type="lists_repeat">
              <value name="NUM">
                <shadow type="math_number">
                  <field name="NUM">5</field>
                </shadow>
              </value>
            </block>
            <block type="lists_length"></block>
            <block type="lists_isEmpty"></block>
            <block type="lists_indexOf">
              <value name="VALUE">
                <shadow type="block_type"></shadow>
              </value>
            </block>
            <block type="lists_getIndex">
              <value name="VALUE">
                <shadow type="block_type"></shadow>
              </value>
            </block>
            <block type="lists_setIndex">
              <value name="LIST">
                <shadow type="block_type"></shadow>
              </value>
            </block>
            <block type="lists_getSublist">
              <value name="LIST">
                <shadow type="block_type"></shadow>
              </value>
            </block>
            <block type="lists_split">
              <value name="DELIM">
                <shadow type="text">
                  <field name="TEXT">,</field>
                </shadow>
              </value>
            </block>
            <block type="lists_sort"></block>
          </category>
          <category name="Colour" colour="%{BKY_COLOUR_HUE}">
            <block type="colour_picker"></block>
            <block type="colour_random"></block>
            <block type="colour_rgb">
              <value name="RED">
                <shadow type="math_number">
                  <field name="NUM">100</field>
                </shadow>
              </value>
              <value name="GREEN">
                <shadow type="math_number">
                  <field name="NUM">50</field>
                </shadow>
              </value>
              <value name="BLUE">
                <shadow type="math_number">
                  <field name="NUM">0</field>
                </shadow>
              </value>
            </block>
            <block type="colour_blend">
              <value name="COLOUR1">
                <shadow type="colour_picker">
                  <field name="COLOUR">#ff0000</field>
                </shadow>
              </value>
              <value name="COLOUR2">
                <shadow type="colour_picker">
                  <field name="COLOUR">#3333ff</field>
                </shadow>
              </value>
              <value name="RATIO">
                <shadow type="math_number">
                  <field name="NUM">0.5</field>
                </shadow>
              </value>
            </block>
          </category>
          <sep></sep>
          <category name="Variables" colour="%{BKY_VARIABLES_HUE}" custom="VARIABLE"></category>
          <category name="Functions" colour="%{BKY_PROCEDURES_HUE}" custom="PROCEDURE"></category>
        </xml>
      `;

      workspaceRef.current = window.Blockly.inject(containerRef.current, {
        toolbox: toolboxXML,
        scrollbars: true,
        trashcan: true,
        move: {
          scrollbars: true,
          drag: true,
          wheel: true,
        },
        theme: window.Blockly.Themes?.Dark || undefined,
        renderer: 'zelos' // Modern renderer
      });

      // Add listener to update code
      workspaceRef.current.addChangeListener(() => {
        const generatedCode = window.Blockly.Python.workspaceToCode(workspaceRef.current);
        setCode(generatedCode);
        if(onCodeChange) onCodeChange(generatedCode);
      });
      
      // Force initial resize
      window.dispatchEvent(new Event('resize'));
    }
  }, [libsLoaded, viewMode]);

  // 3. Expose Methods to Parent (Run, Reset)
  useImperativeHandle(ref, () => ({
    run: () => {
      if (!window.Sk) {
        if(onError) onError("Python engine not loaded.");
        return;
      }

      // Configure Skulpt output
      window.Sk.configure({
        output: (text: string) => {
          if(onOutput) onOutput(text);
        },
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

      // Run Async Promise
      window.Sk.misceval.asyncToPromise(() => {
        return window.Sk.importMainWithBody("<stdin>", false, prog, true);
      }).then(
        () => { if(onOutput) onOutput("\n>> Execution finished."); },
        (err: any) => { if(onError) onError(err.toString()); }
      );
    },
    getCode: () => code,
    reset: () => {
      if (workspaceRef.current) {
        workspaceRef.current.clear();
      }
      setCode('');
    }
  }));

  // Handle resizing of Blockly when visibility changes
  useEffect(() => {
    if (workspaceRef.current) {
      window.Blockly.svgResize(workspaceRef.current);
    }
  }, [viewMode]);

  // Manual Text Editing Handler
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value);
    if(onCodeChange) onCodeChange(e.target.value);
  };

  if (!libsLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center text-cyan-500/50 animate-pulse">
        Initializing CyberPy Runtime...
      </div>
    );
  }

  return (
    <div className="w-full h-full relative group">
      {/* View Mode: Blocks */}
      <div 
        ref={containerRef} 
        className={`w-full h-full absolute inset-0 transition-opacity duration-300 ${viewMode === 'blocks' ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`} 
      />

      {/* View Mode: Text (Manual Editor) */}
      <div className={`w-full h-full absolute inset-0 bg-[#0a0c14] flex flex-row transition-opacity duration-300 ${viewMode === 'text' ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}>
        {/* Gutter */}
        <div className="w-12 h-full bg-[#0f1220]/80 border-r border-white/5 pt-4 text-right pr-3 select-none">
          {code.split('\n').map((_, i) => (
             <div key={i} className="text-xs font-mono text-slate-600 leading-6">{i+1}</div>
          ))}
        </div>
        
        {/* Editor Area */}
        <div className="flex-1 relative">
           <textarea
             ref={editorRef}
             value={code}
             onChange={handleTextChange}
             className="w-full h-full bg-transparent text-slate-300 font-mono text-sm p-4 resize-none focus:outline-none leading-6 z-10 relative custom-scrollbar"
             spellCheck={false}
           />
           {/* Syntax Highlight Overlay (Simple regex based) */}
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