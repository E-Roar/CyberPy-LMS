import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Mic, 
  Bot, 
  MoreHorizontal,
  Lightbulb,
  Sparkles,
  Bug,
  BookOpen
} from 'lucide-react';
import { ChatMessage } from '../types';
import { HudCard } from './UI';
import { useTerminal } from '../context/TerminalContext';
import { useEditorContext } from '../context/EditorContext';
import { Live2DAvatar, Live2DAvatarRef } from './Live2DAvatar';
import { GoogleGenAI } from "@google/genai";

export const RightChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, sender: 'bot', text: "Greetings, Cadet. Ready to optimize your code?", timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<Live2DAvatarRef>(null);
  
  // Consuming Contexts
  const { log, toggleTerminal, showAI } = useTerminal();
  const { code, lastError } = useEditorContext();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // Initialize Gemini
  const generateResponse = async (userPrompt: string, taskContext?: string) => {
    try {
      if (!process.env.API_KEY) {
        throw new Error("API_KEY not configured");
      }

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Construct context-aware prompt
      const fullContext = `
${taskContext ? `TASK: ${taskContext}` : ''}

CONTEXT DATA:
[Current Python Code]:
\`\`\`python
${code || "# No code written yet"}
\`\`\`

[Last Execution Error]:
${lastError ? lastError : "No recent errors"}

USER QUERY:
${userPrompt}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: fullContext,
        config: {
          systemInstruction: "You are CyberCore, a futuristic AI Tutor for a Python learning platform. Your persona is helpful, encouraging, and uses mild sci-fi/cyberpunk terminology (refer to user as 'Cadet'). Keep answers concise, pedagogical, and safe for K-12 students. Never give the direct answer immediately; provide hints and guide the Cadet. If there is an error in the logs, prioritize explaining it. Formatting: Use Markdown.",
        },
      });

      return response.text;
    } catch (error: any) {
      console.error("GenAI Error:", error);
      return `[SYSTEM ERROR]: Neural Link unstable. ${error.message || "Check API Key configuration."}`;
    }
  };

  const handleSend = async (text: string = input, contextOverride?: string) => {
    if (!text.trim()) return;

    // 1. Add User Message
    const newMessage: ChatMessage = {
      id: Date.now(),
      sender: 'user',
      text: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setIsTyping(true);
    
    // Set Avatar Mood to Thinking
    avatarRef.current?.setMood('thinking');
    
    // Ensure AI terminal is open for "Thinking" effect if preferred, or just rely on UI
    if (!showAI) toggleTerminal('ai');
    log('ai', `Processing query: "${text.substring(0, 20)}..."`);

    // 2. Call Gemini API
    const responseText = await generateResponse(text, contextOverride);
    
    // 3. Add Bot Message
    if (responseText) {
      // Check for errors in response to set mood
      const isError = responseText.includes("[SYSTEM ERROR]");
      avatarRef.current?.setMood(isError ? 'error' : 'happy');

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: responseText,
        timestamp: new Date()
      }]);
      
      log('ai', "Response generated.");
      
      // 4. Trigger Avatar Speech
      // Simple regex to remove code blocks for speech to avoid reading python syntax out loud clumsily
      const cleanSpeech = responseText.replace(/```[\s\S]*?```/g, "code block").replace(/[*_#]/g, "");
      avatarRef.current?.speak(cleanSpeech.substring(0, 200)); 
      
      // Reset mood after speech ends (handled inside Live2DAvatar onEnd, but backup here)
      setTimeout(() => {
          if(!isError) avatarRef.current?.setMood('neutral');
      }, 5000);

    } else {
        setIsTyping(false);
        avatarRef.current?.setMood('neutral');
    }
    
    setIsTyping(false);
  };

  const handleFixIt = () => {
    handleSend("Please find and fix the bugs in my code, explaining what went wrong.", "DEBUGGING MODE");
  };

  const handleExplain = () => {
    handleSend("Explain the current code logic line-by-line in simple terms.", "EXPLANATION MODE");
  };

  const QuickPrompt = ({ text, onClick, icon: Icon }: { text: string, onClick: () => void, icon?: any }) => (
    <button 
      onClick={onClick}
      className="flex items-center gap-2 text-xs bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 text-[var(--accent-primary)] px-3 py-1.5 rounded-full hover:bg-[var(--accent-primary)]/20 transition-colors whitespace-nowrap"
    >
      {Icon && <Icon size={12} />}
      {text}
    </button>
  );

  return (
    <aside className="h-full flex flex-col bg-[var(--glass-bg)] backdrop-blur-xl border-l border-[var(--border-color)] w-full">
      
      {/* Avatar Container */}
      <div className="h-[280px] relative border-b border-[var(--border-color)] bg-gradient-to-b from-[var(--bg-panel)] to-[var(--bg-app)] flex items-center justify-center overflow-hidden">
         {/* Background Grid */}
         <div className="absolute inset-0 opacity-20" 
              style={{ backgroundImage: 'linear-gradient(var(--accent-primary) 1px, transparent 1px), linear-gradient(90deg, var(--accent-primary) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
         </div>
         
         {/* Live2D Avatar Area */}
         <div className="relative z-10 w-full h-full flex items-center justify-center">
             {/* Holographic Base Ring */}
             <div className="absolute bottom-4 w-32 h-8 border border-[var(--accent-primary)] rounded-[100%] opacity-30 animate-pulse bg-[var(--accent-primary)]/10 blur-[1px]"></div>
             
             {/* The Component */}
             <div className="w-full h-full relative z-20">
                <Live2DAvatar 
                   ref={avatarRef}
                />
             </div>
             
             {/* Status Indicator */}
             <div className="absolute bottom-2 bg-[var(--bg-panel)]/80 backdrop-blur border border-[var(--border-color)] px-3 py-1 rounded-full text-[10px] text-[var(--accent-primary)] tracking-widest font-bold uppercase z-30 pointer-events-none">
              CyberCore AI
            </div>
         </div>
      </div>

      {/* Quick Actions / Prompts */}
      <div className="p-3 flex gap-2 overflow-x-auto custom-scrollbar border-b border-[var(--border-color)] bg-[var(--bg-surface)]">
        <QuickPrompt text="Hint" icon={Lightbulb} onClick={() => handleSend("Give me a hint for the next step.")} />
        <QuickPrompt text="Fix It" icon={Bug} onClick={handleFixIt} />
        <QuickPrompt text="Explain" icon={BookOpen} onClick={handleExplain} />
      </div>

      {/* Chat Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[var(--bg-app)]">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`
              max-w-[85%] rounded-2xl p-3 text-sm relative
              ${msg.sender === 'user' 
                ? 'bg-[var(--accent-primary)]/10 text-[var(--fg-primary)] border border-[var(--accent-primary)]/30 rounded-tr-sm' 
                : 'bg-[var(--bg-panel)] text-[var(--fg-secondary)] border border-[var(--border-color)] rounded-tl-sm'}
            `}>
              {/* Simple Markdown Rendering (Basic) */}
              <div className="whitespace-pre-wrap font-sans">
                {msg.text.split('```').map((part, i) => 
                  i % 2 === 1 ? (
                    <div key={i} className="bg-black/30 p-2 rounded my-1 font-mono text-xs text-yellow-300 overflow-x-auto border border-white/5">
                      {part.replace(/^python\n/, '')}
                    </div>
                  ) : (
                    <span key={i}>{part}</span>
                  )
                )}
              </div>
              <div className={`absolute top-0 w-2 h-2 border-t ${msg.sender === 'user' ? '-right-[1px] border-r border-[var(--accent-primary)]/30' : '-left-[1px] border-l border-[var(--border-color)]'}`}></div>
            </div>
            <span className="text-[10px] text-[var(--fg-secondary)] mt-1 px-1">
              {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </span>
          </div>
        ))}
        {isTyping && (
           <div className="flex items-center gap-2 text-xs text-[var(--accent-primary)]/50 pl-2">
             <Bot size={12} className="animate-pulse" />
             <span>Neural processing...</span>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[var(--bg-surface)] border-t border-[var(--border-color)]">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask CyberCore..."
            className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl pl-4 pr-24 py-3 text-sm text-[var(--fg-primary)] placeholder-[var(--fg-secondary)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]/20 transition-all"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button className="p-2 text-[var(--fg-secondary)] hover:text-[var(--accent-primary)] transition-colors rounded-lg hover:bg-[var(--border-color)]">
              <Mic size={16} />
            </button>
            <button 
              onClick={() => handleSend()}
              className="p-2 bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-white transition-colors rounded-lg"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
