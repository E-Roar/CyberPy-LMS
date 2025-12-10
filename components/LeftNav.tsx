import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Folder, 
  Trophy, 
  Settings, 
  ChevronDown, 
  ChevronRight,
  Zap,
  Shield
} from 'lucide-react';
import { AppSection } from '../types';

interface NavProps {
  activeSection: AppSection;
  onSectionChange: (section: AppSection) => void;
  mobile?: boolean;
}

export const LeftNav: React.FC<NavProps> = ({ activeSection, onSectionChange, mobile }) => {
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    'courses': true,
    'admin': false
  });

  const toggleMenu = (key: string) => {
    setOpenMenus(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const NavItem = ({ 
    icon: Icon, 
    label, 
    section, 
    active 
  }: { 
    icon: any, 
    label: string, 
    section?: AppSection,
    active?: boolean 
  }) => (
    <button
      onClick={() => section && onSectionChange(section)}
      className={`
        w-full flex items-center gap-3 px-4 py-3 text-sm transition-all border-l-2
        ${active 
          ? 'border-cyan-400 bg-cyan-400/10 text-cyan-300 shadow-[inset_10px_0_20px_-10px_rgba(107,243,255,0.2)]' 
          : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'}
      `}
    >
      <Icon size={18} className={active ? 'text-cyan-400 drop-shadow-[0_0_5px_rgba(107,243,255,0.8)]' : ''} />
      <span className="tracking-wide">{label}</span>
    </button>
  );

  return (
    <nav className={`h-full flex flex-col bg-[#0f1220]/95 backdrop-blur-xl border-r border-white/10 ${mobile ? 'w-full' : 'w-full'}`}>
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mr-3 shadow-lg shadow-cyan-500/20">
          <Zap size={18} className="text-white" fill="white" />
        </div>
        <div>
          <h1 className="hud-font font-bold text-lg tracking-wider text-white">CYBER<span className="text-cyan-400">PY</span></h1>
          <p className="text-[10px] text-slate-500 tracking-widest uppercase">LMS // V.2.0.4</p>
        </div>
      </div>

      {/* Scrollable Menu */}
      <div className="flex-1 overflow-y-auto py-4 space-y-1 custom-scrollbar">
        <div className="px-4 py-2 text-xs font-bold text-slate-600 uppercase tracking-widest">Main Modules</div>
        
        <NavItem 
          icon={LayoutDashboard} 
          label="Dashboard" 
          section={AppSection.DASHBOARD}
          active={activeSection === AppSection.DASHBOARD}
        />

        {/* Accordion: Courses */}
        <div>
          <button 
            onClick={() => toggleMenu('courses')}
            className="w-full flex items-center justify-between px-4 py-3 text-sm text-slate-400 hover:text-slate-200 hover:bg-white/5"
          >
            <div className="flex items-center gap-3">
              <BookOpen size={18} />
              <span className="tracking-wide">Courses</span>
            </div>
            {openMenus['courses'] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          
          {openMenus['courses'] && (
            <div className="bg-[#0a0c14] border-y border-white/5">
              <div className="pl-12 py-2 text-sm text-slate-500 hover:text-cyan-400 cursor-pointer border-l border-white/5 ml-6">Python Basics 101</div>
              <div className="pl-12 py-2 text-sm text-slate-500 hover:text-cyan-400 cursor-pointer border-l border-white/5 ml-6">Data Structures</div>
              <div className="pl-12 py-2 text-sm text-cyan-400 cursor-pointer border-l border-cyan-400 ml-6 bg-cyan-900/10">Algorithmic Art</div>
            </div>
          )}
        </div>

        <NavItem 
          icon={Folder} 
          label="Files" 
          section={AppSection.FILES}
          active={activeSection === AppSection.FILES}
        />
        
        <NavItem 
          icon={Trophy} 
          label="Gamification" 
          section={AppSection.GAMIFICATION}
          active={activeSection === AppSection.GAMIFICATION}
        />

        <div className="mt-6 px-4 py-2 text-xs font-bold text-slate-600 uppercase tracking-widest">System</div>

        <NavItem 
          icon={Shield} 
          label="Admin Console" 
          section={AppSection.ADMIN}
          active={activeSection === AppSection.ADMIN}
        />
        
        <NavItem 
          icon={Settings} 
          label="Settings" 
          section={AppSection.ADMIN} // Placeholder
        />
      </div>

      {/* User Mini Profile */}
      <div className="p-4 border-t border-white/10 bg-black/20">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img 
              src="https://picsum.photos/100/100" 
              alt="User" 
              className="w-10 h-10 rounded-md border border-white/20"
            />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-[#0f1220]" />
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="text-sm font-medium text-white truncate">Cadet Alex</div>
            <div className="text-xs text-cyan-400">Lvl 12 • 4,500 XP</div>
          </div>
        </div>
      </div>
    </nav>
  );
};