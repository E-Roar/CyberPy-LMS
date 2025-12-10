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
  Shield,
  Sun,
  Moon,
  LogOut,
  LogIn,
  FileCode,
  FileText,
  FileJson
} from 'lucide-react';
import { AppSection } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

interface NavProps {
  activeSection: AppSection;
  onSectionChange: (section: AppSection) => void;
  mobile?: boolean;
}

export const LeftNav: React.FC<NavProps> = ({ activeSection, onSectionChange, mobile }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, profile, isAdmin, signOut, signInWithGithub, loading } = useAuth();
  
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    'courses': true,
    'files': false,
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
          ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] shadow-[inset_10px_0_20px_-10px_rgba(var(--accent-primary),0.2)]' 
          : 'border-transparent text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] hover:bg-[var(--border-color)]'}
      `}
    >
      <Icon size={18} className={active ? 'text-[var(--accent-primary)]' : ''} />
      <span className="tracking-wide">{label}</span>
    </button>
  );

  return (
    <nav className={`h-full flex flex-col bg-[var(--glass-bg)] backdrop-blur-xl border-r border-[var(--border-color)] ${mobile ? 'w-full' : 'w-full'}`}>
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-[var(--border-color)] justify-between">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent-primary)] to-blue-600 flex items-center justify-center mr-3 shadow-lg shadow-cyan-500/20">
            <Zap size={18} className="text-white" fill="white" />
          </div>
          <div>
            <h1 className="hud-font font-bold text-lg tracking-wider text-[var(--fg-primary)]">CYBER<span className="text-[var(--accent-primary)]">PY</span></h1>
            <p className="text-[10px] text-[var(--fg-secondary)] tracking-widest uppercase">LMS // V.2.0.4</p>
          </div>
        </div>
        
        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-[var(--border-color)] text-[var(--fg-secondary)] hover:text-[var(--accent-primary)] transition-colors"
          title={`Switch to ${theme === 'cyber' ? 'Solaris' : 'Cyber'} mode`}
        >
          {theme === 'cyber' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {/* Scrollable Menu */}
      <div className="flex-1 overflow-y-auto py-4 space-y-1 custom-scrollbar">
        <div className="px-4 py-2 text-xs font-bold text-[var(--fg-secondary)] uppercase tracking-widest">Main Modules</div>
        
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
            className="w-full flex items-center justify-between px-4 py-3 text-sm text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] hover:bg-[var(--border-color)]"
          >
            <div className="flex items-center gap-3">
              <BookOpen size={18} />
              <span className="tracking-wide">Courses</span>
            </div>
            {openMenus['courses'] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          
          {openMenus['courses'] && (
            <div className="bg-[var(--bg-panel)] border-y border-[var(--border-color)]">
              <div className="pl-12 py-2 text-sm text-[var(--fg-secondary)] hover:text-[var(--accent-primary)] cursor-pointer border-l border-[var(--border-color)] ml-6">Python Basics 101</div>
              <div className="pl-12 py-2 text-sm text-[var(--fg-secondary)] hover:text-[var(--accent-primary)] cursor-pointer border-l border-[var(--border-color)] ml-6">Data Structures</div>
              <div className="pl-12 py-2 text-sm text-[var(--accent-primary)] cursor-pointer border-l border-[var(--accent-primary)] ml-6 bg-[var(--accent-primary)]/10">Algorithmic Art</div>
            </div>
          )}
        </div>

        {/* Accordion: Project Files */}
        <div>
          <button 
            onClick={() => {
              toggleMenu('files');
              // Automatically switch to files section when opening, if desired
              if (!openMenus['files']) onSectionChange(AppSection.FILES);
            }}
            className={`
              w-full flex items-center justify-between px-4 py-3 text-sm transition-all border-l-2
              ${activeSection === AppSection.FILES 
                ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5 text-[var(--accent-primary)]' 
                : 'border-transparent text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] hover:bg-[var(--border-color)]'}
            `}
          >
            <div className="flex items-center gap-3">
              <Folder size={18} className={activeSection === AppSection.FILES ? 'text-[var(--accent-primary)]' : ''} />
              <span className="tracking-wide">Project Files</span>
            </div>
            {openMenus['files'] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          
          {openMenus['files'] && (
            <div className="bg-[var(--bg-panel)] border-y border-[var(--border-color)] font-mono text-xs animate-in slide-in-from-top-2 duration-200">
               <div className="px-4 py-2 text-[var(--fg-secondary)] hover:bg-[var(--bg-surface)] cursor-pointer flex items-center gap-2 group">
                   <ChevronDown size={12} className="text-[var(--fg-secondary)] group-hover:text-white" />
                   <Folder size={14} className="text-amber-500 group-hover:text-amber-400" />
                   <span className="group-hover:text-white transition-colors">cyberpy_src</span>
               </div>
               
               <div className="border-l border-[var(--border-color)] ml-6 my-1 pl-1">
                   {[
                     { name: 'main.py', icon: FileCode, color: 'text-cyan-400' },
                     { name: 'utils.py', icon: FileCode, color: 'text-cyan-400' },
                     { name: 'styles.css', icon: FileCode, color: 'text-pink-400' },
                     { name: 'data.json', icon: FileJson, color: 'text-yellow-400' },
                     { name: 'README.md', icon: FileText, color: 'text-emerald-400' },
                   ].map((file, i) => (
                     <div key={i} className="pl-4 py-1.5 text-[var(--fg-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--bg-surface)] cursor-pointer flex items-center gap-2 group transition-colors">
                         <file.icon size={14} className={`${file.color} opacity-80 group-hover:opacity-100`} />
                         <span>{file.name}</span>
                     </div>
                   ))}
               </div>
            </div>
          )}
        </div>
        
        <NavItem 
          icon={Trophy} 
          label="Gamification" 
          section={AppSection.GAMIFICATION}
          active={activeSection === AppSection.GAMIFICATION}
        />

        {/* Admin Section - Only show if Admin */}
        {isAdmin && (
          <>
            <div className="mt-6 px-4 py-2 text-xs font-bold text-[var(--fg-secondary)] uppercase tracking-widest">System</div>

            <NavItem 
              icon={Shield} 
              label="Admin Console" 
              section={AppSection.ADMIN}
              active={activeSection === AppSection.ADMIN}
            />
          </>
        )}
        
        <NavItem 
          icon={Settings} 
          label="Settings" 
          section={AppSection.ADMIN} // Placeholder
        />
      </div>

      {/* User Mini Profile */}
      <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-panel)]/50">
        {loading ? (
          <div className="flex items-center gap-3 animate-pulse">
            <div className="w-10 h-10 rounded-md bg-[var(--border-color)]" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 bg-[var(--border-color)] rounded" />
              <div className="h-2 w-16 bg-[var(--border-color)] rounded" />
            </div>
          </div>
        ) : user && profile ? (
          <div className="flex items-center gap-3">
            <div className="relative group">
              <img 
                src={profile.avatar_url || user.user_metadata.avatar_url || "https://picsum.photos/100/100"} 
                alt="User" 
                className="w-10 h-10 rounded-md border border-[var(--border-color)] object-cover"
              />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-[var(--bg-app)]" />
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-sm font-medium text-[var(--fg-primary)] truncate">
                {profile.full_name || profile.username || user.email?.split('@')[0]}
              </div>
              <div className="text-xs text-[var(--accent-primary)]">
                Lvl {profile.level} • {profile.xp} XP
              </div>
            </div>
            <button 
              onClick={signOut}
              className="p-1.5 text-[var(--fg-secondary)] hover:text-pink-500 transition-colors"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
             <button 
               onClick={signInWithGithub}
               className="w-full py-2 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded text-sm text-[var(--fg-primary)] hover:bg-[var(--border-color)] transition-colors flex items-center justify-center gap-2"
             >
               <LogIn size={14} />
               <span>Login with GitHub</span>
             </button>
             <div className="text-[10px] text-center text-[var(--fg-secondary)]">
               Guest Mode Active
             </div>
          </div>
        )}
      </div>
    </nav>
  );
};