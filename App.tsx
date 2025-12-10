import React, { useState, useEffect } from 'react';
import { LeftNav } from './components/LeftNav';
import { CenterIDE } from './components/CenterIDE';
import { RightChat } from './components/RightChat';
import { AppSection } from './types';
import { Menu, MessageSquare } from 'lucide-react';

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<AppSection>(AppSection.DASHBOARD);
  
  // Mobile UI States
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="w-full h-screen bg-[#0f1220] text-white overflow-hidden flex relative">
      
      {/* 
        DESKTOP LAYOUT: 3 Columns Grid
        MOBILE LAYOUT: Stacked, with drawers
      */}

      {/* Left Column: Navigation */}
      <div 
        className={`
          fixed inset-y-0 left-0 z-40 w-[280px] bg-[#0f1220] transition-transform duration-300 lg:translate-x-0 lg:static lg:block
          ${mobileNavOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
        `}
      >
        <LeftNav 
          activeSection={activeSection} 
          onSectionChange={(section) => {
            setActiveSection(section);
            setMobileNavOpen(false);
          }}
          mobile={isMobile}
        />
        {/* Mobile Close Handle Overlay */}
        {mobileNavOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-[-1] lg:hidden backdrop-blur-sm"
            onClick={() => setMobileNavOpen(false)}
          />
        )}
      </div>

      {/* Center Column: IDE / Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative z-0">
        
        {/* Mobile Header (Only visible on mobile) */}
        <div className="lg:hidden h-14 bg-[#0f1220]/90 backdrop-blur border-b border-white/10 flex items-center justify-between px-4 z-50">
          <button onClick={() => setMobileNavOpen(true)} className="text-white p-2">
            <Menu />
          </button>
          <span className="font-bold hud-font text-cyan-400 tracking-widest">CYBERPY</span>
          <button onClick={() => setMobileChatOpen(true)} className="text-white p-2">
            <MessageSquare />
          </button>
        </div>

        <CenterIDE />
      </div>

      {/* Right Column: Chatbot */}
      <div 
        className={`
          fixed inset-y-0 right-0 z-40 w-[320px] bg-[#0f1220] transition-transform duration-300 lg:translate-x-0 lg:static lg:block border-l border-white/10
          ${mobileChatOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full'}
        `}
      >
        <RightChat />
        {/* Mobile Close Handle Overlay */}
        {mobileChatOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-[-1] lg:hidden backdrop-blur-sm"
            onClick={() => setMobileChatOpen(false)}
          />
        )}
      </div>

      {/* Mobile Sticky Toggles (Optional alternative to header) */}
      {/* 
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex gap-4">
        <button className="bg-black/50 backdrop-blur border border-white/20 p-3 rounded-full shadow-lg">
          <Home size={20} />
        </button>
      </div> 
      */}

    </div>
  );
};

export default App;
