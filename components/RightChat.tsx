import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Mic, 
  Bot, 
  MoreHorizontal,
  Lightbulb,
  Sparkles
} from 'lucide-react';
import { ChatMessage } from '../types';
import { HudCard } from './UI';
import { useTerminal } from '../context/TerminalContext';

export const RightChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, sender: 'bot', text: "Greetings, Cadet. Ready to optimize your code?", timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Terminal Context to push "Thinking" logs
  const { log, toggleTerminal, showAI } = useTerminal();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const simulateThinking = async () => {
    if (!showAI) toggleTerminal('ai');

    const steps = [
      "Analyzing user query vector...",
      "Querying Knowledge Graph (Code_Patterns_v4)...",
      "Context retrieved: 'Python Loops & Indentation'",
      "Formulating pedagogical response...",
      "Sanitizing output..."
    ];

    for (const step of steps) {
      log('ai', step);
      await new Promise(r => setTimeout(r, 200 + Math.random() * 300));
    }
  };

  const handleSend = async (text: string = input) => {
    if (!text.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now(),
      sender: 'user',
      text: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setIsTyping(true);
    
    await simulateThinking();

    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: "I've analyzed your logic. The loop range seems correct, but verify the indentation on line 4.",
        timestamp: new Date()
      }]);
      setIsTyping(false);
      log('ai', "Response delivered.");
    }, 500);
  };

  const QuickPrompt = ({ text }: { text: string }) => (
    <button 
      onClick={() => handleSend(text)}
      className="text-xs bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 text-[var(--accent-primary)] px-3 py-1.5 rounded-full hover:bg-[var(--accent-primary)]/20 transition-colors whitespace-nowrap"
    >
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
         
         {/* Simulated 3D/Holographic Avatar */}
         <div className="relative z-10 w-48 h-48 flex items-center justify-center">
            {/* Hologram Rings */}
            <div className={`absolute inset-0 border-2 border-[var(--accent-primary)] opacity-30 rounded-full animate-[spin_10s_linear_infinite]`}></div>
            <div className={`absolute inset-4 border border-[var(--accent-secondary)] opacity-30 rounded-full animate-[spin_15s_linear_infinite_reverse]`}></div>
            
            {/* The Avatar Image */}
            <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-[var(--border-color)] shadow-[0_0_30px_rgba(var(--accent-primary),0.3)] relative">
               <img src="https://picsum.photos/300/300?grayscale" className="w-full h-full object-cover mix-blend-luminosity opacity-80" alt="AI Avatar" />
               <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-app)] to-transparent mix-blend-overlay"></div>
               
               {isTyping && (
                 <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-8 h-4 flex items-center justify-center gap-1">
                   <div className="w-1 h-1 bg-[var(--accent-primary)] rounded-full animate-bounce"></div>
                   <div className="w-1 h-1 bg-[var(--accent-primary)] rounded-full animate-bounce delay-100"></div>
                   <div className="w-1 h-1 bg-[var(--accent-primary)] rounded-full animate-bounce delay-200"></div>
                 </div>
               )}
            </div>
            
            {/* Status Indicator */}
            <div className="absolute bottom-0 bg-[var(--bg-panel)]/80 backdrop-blur border border-[var(--border-color)] px-3 py-1 rounded-full text-[10px] text-[var(--accent-primary)] tracking-widest font-bold uppercase">
              System Online
            </div>
         </div>
      </div>

      {/* Quick Actions / Prompts */}
      <div className="p-3 flex gap-2 overflow-x-auto custom-scrollbar border-b border-[var(--border-color)] bg-[var(--bg-surface)]">
        <QuickPrompt text="Hint please" />
        <QuickPrompt text="Debug this" />
        <QuickPrompt text="Explain loop" />
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
              {msg.text}
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
             <span>Processing...</span>
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
            placeholder="Ask AI Tutor..."
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