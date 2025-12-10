import React from 'react';

interface HudCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  noPadding?: boolean;
  className?: string;
  glow?: boolean;
  title?: string;
}

export const HudCard: React.FC<HudCardProps> = ({ 
  children, 
  noPadding = false, 
  className = '', 
  glow = false,
  title,
  ...props 
}) => {
  return (
    <div 
      className={`
        relative overflow-hidden rounded-xl border border-white/10 bg-[#0f1220]/60 backdrop-blur-md
        transition-all duration-300
        ${glow ? 'shadow-[0_0_15px_rgba(107,243,255,0.1)] border-cyan-400/30' : ''}
        ${className}
      `}
      {...props}
    >
      {/* Decorative Corner Notches */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-400/50 rounded-tl-sm" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-400/50 rounded-tr-sm" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-400/50 rounded-bl-sm" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-400/50 rounded-br-sm" />

      {/* Header Line */}
      {title && (
        <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between bg-white/5">
          <span className="text-xs font-bold tracking-[0.2em] text-cyan-400 uppercase hud-font">
            {title}
          </span>
          <div className="h-1 w-8 bg-cyan-500/20 rounded-full" />
        </div>
      )}

      <div className={`${noPadding ? '' : 'p-4'}`}>
        {children}
      </div>
    </div>
  );
};

interface HudButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  icon?: React.ReactNode;
}

export const HudButton: React.FC<HudButtonProps> = ({ 
  children, 
  variant = 'primary', 
  icon,
  className = '',
  ...props 
}) => {
  const baseStyles = "relative px-4 py-2 text-sm font-medium tracking-wide uppercase transition-all duration-200 flex items-center justify-center gap-2 group overflow-hidden clip-path-slant";
  
  const variants = {
    primary: "bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 hover:border-cyan-400 hover:shadow-[0_0_10px_rgba(107,243,255,0.2)]",
    secondary: "bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 hover:border-white/30",
    danger: "bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 border border-pink-500/50 hover:border-pink-400",
    ghost: "bg-transparent text-slate-400 hover:text-white hover:bg-white/5 border-none",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
      {...props}
    >
      {/* Background glitch effect on hover */}
      <div className="absolute inset-0 translate-y-full group-hover:translate-y-0 bg-gradient-to-t from-white/10 to-transparent transition-transform duration-300" />
      
      {icon && <span className="relative z-10 w-4 h-4">{icon}</span>}
      <span className="relative z-10 hud-font">{children}</span>
    </button>
  );
};

export const GlitchText: React.FC<{ text: string, className?: string }> = ({ text, className = '' }) => (
  <span className={`relative inline-block group cursor-default ${className}`}>
    <span className="relative z-10 group-hover:opacity-0 transition-opacity duration-100">{text}</span>
    <span className="absolute top-0 left-0 -z-10 opacity-0 group-hover:opacity-100 text-cyan-400 translate-x-[2px] animate-pulse">{text}</span>
    <span className="absolute top-0 left-0 -z-10 opacity-0 group-hover:opacity-100 text-pink-500 -translate-x-[2px] animate-bounce">{text}</span>
  </span>
);

export const Badge: React.FC<{ label: string; color?: string }> = ({ label, color = 'bg-cyan-500' }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${color} bg-opacity-10 text-cyan-300 border border-cyan-500/30`}>
    {label}
  </span>
);
