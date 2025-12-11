import React, { useEffect, useImperativeHandle, forwardRef, useState } from 'react';

export interface Live2DAvatarRef {
  speak: (text: string) => void;
  stop: () => void;
  setMood: (mood: 'neutral' | 'happy' | 'thinking' | 'error') => void;
}

interface AvatarProps {
  modelPath?: string; // Kept for interface compatibility
}

export const Live2DAvatar = forwardRef<Live2DAvatarRef, AvatarProps>((props, ref) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [mood, setMood] = useState<'neutral' | 'happy' | 'thinking' | 'error'>('neutral');
  
  // Eye tracking state (-1 to 1)
  const [look, setLook] = useState({ x: 0, y: 0 });
  const [blink, setBlink] = useState(false);

  // 1. Mouse Tracking Logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        const { innerWidth, innerHeight } = window;
        const x = (e.clientX - innerWidth / 2) / (innerWidth / 2);
        const y = (e.clientY - innerHeight / 2) / (innerHeight / 2);
        // Clamp values to keep eyes within sockets
        setLook({
            x: Math.max(-1, Math.min(1, x)),
            y: Math.max(-1, Math.min(1, y))
        });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // 2. Random Blinking Logic
  useEffect(() => {
    const blinkLoop = () => {
        setBlink(true);
        setTimeout(() => setBlink(false), 150);
        // Schedule next blink randomly between 2s and 5s
        setTimeout(blinkLoop, Math.random() * 3000 + 2000);
    };
    const timer = setTimeout(blinkLoop, 2000);
    return () => clearTimeout(timer);
  }, []);

  // 3. Expose Methods to Parent
  useImperativeHandle(ref, () => ({
    speak: (text: string) => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      
      // Try to find a good robotic or clear voice
      const preferred = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha'));
      if (preferred) utterance.voice = preferred;
      
      utterance.pitch = 1.1; // Slightly higher pitch for "helper bot" feel
      utterance.rate = 1.1;
      
      utterance.onstart = () => {
          setIsSpeaking(true);
          setMood('happy');
      };
      utterance.onend = () => {
          setIsSpeaking(false);
          setMood('neutral');
      };
      utterance.onerror = () => {
          setIsSpeaking(false);
          setMood('error');
      };
      
      window.speechSynthesis.speak(utterance);
    },
    stop: () => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        setMood('neutral');
    },
    setMood: (m) => setMood(m)
  }));

  // Visual Properties
  const getPrimaryColor = () => {
      switch(mood) {
          case 'error': return '#ef4444'; // Red
          case 'thinking': return '#f59e0b'; // Amber
          case 'happy': return '#6bf3ff'; // Cyan
          default: return '#6bf3ff'; // Cyan
      }
  };
  
  const primaryColor = getPrimaryColor();
  const eyeOffsetX = look.x * 8; // Max pixels to move
  const eyeOffsetY = look.y * 6;

  return (
    <div className="w-full h-full flex items-center justify-center relative select-none pointer-events-none overflow-visible">
       {/* Floating Animation Container */}
       <div className="w-48 h-48 relative animate-float">
          {/* Background Glow */}
          <div 
             className="absolute inset-0 blur-3xl rounded-full opacity-30 transition-colors duration-500"
             style={{ backgroundColor: primaryColor }}
          ></div>

          <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl">
             <defs>
               <linearGradient id="faceGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                 <stop offset="0%" stopColor="#1e293b" />
                 <stop offset="100%" stopColor="#0f172a" />
               </linearGradient>
               <filter id="glow">
                  <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                  <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                  </feMerge>
               </filter>
             </defs>

             {/* HEAD: Main Shape */}
             <path 
                d="M40,100 C40,40 160,40 160,100 C160,150 130,180 100,185 C70,180 40,150 40,100 Z" 
                fill="url(#faceGrad)" 
                stroke={primaryColor} 
                strokeWidth="2"
                className="transition-all duration-500"
                filter="url(#glow)"
             />
             
             {/* HEAD: Ears / Antennae */}
             <rect x="25" y="85" width="12" height="25" rx="4" fill={primaryColor} opacity="0.8" />
             <rect x="163" y="85" width="12" height="25" rx="4" fill={primaryColor} opacity="0.8" />

             {/* FACE: Visor Area */}
             <ellipse cx="100" cy="105" rx="55" ry="45" fill="#000000" opacity="0.5" />

             {/* EYES GROUP (Follows Mouse) */}
             <g transform={`translate(${eyeOffsetX}, ${eyeOffsetY})`} className="transition-transform duration-75 ease-out">
                {/* Left Eye */}
                <g transform="translate(70, 95)">
                    {blink ? (
                        <line x1="-15" y1="0" x2="15" y2="0" stroke={primaryColor} strokeWidth="4" strokeLinecap="round" />
                    ) : (
                        mood === 'happy' ? (
                            <path d="M-15,0 Q0,-10 15,0" stroke={primaryColor} strokeWidth="4" fill="none" strokeLinecap="round" />
                        ) : (
                            <ellipse rx="14" ry="14" fill={primaryColor} filter="url(#glow)" opacity="0.9" />
                        )
                    )}
                    {/* Pupil (only visible in neutral/thinking) */}
                    {!blink && mood !== 'happy' && (
                         <circle cx="0" cy="0" r="6" fill="#fff" opacity="0.9" />
                    )}
                </g>
                
                {/* Right Eye */}
                <g transform="translate(130, 95)">
                    {blink ? (
                         <line x1="-15" y1="0" x2="15" y2="0" stroke={primaryColor} strokeWidth="4" strokeLinecap="round" />
                    ) : (
                        mood === 'happy' ? (
                            <path d="M-15,0 Q0,-10 15,0" stroke={primaryColor} strokeWidth="4" fill="none" strokeLinecap="round" />
                        ) : (
                            <ellipse rx="14" ry="14" fill={primaryColor} filter="url(#glow)" opacity="0.9" />
                        )
                    )}
                    {!blink && mood !== 'happy' && (
                         <circle cx="0" cy="0" r="6" fill="#fff" opacity="0.9" />
                    )}
                </g>
             </g>

             {/* MOOD INDICATOR / FOREHEAD */}
             {mood === 'thinking' && (
                 <circle cx="100" cy="60" r="5" fill={primaryColor} className="animate-ping" opacity="0.8" />
             )}

             {/* MOUTH */}
             <g transform="translate(100, 140)">
                {isSpeaking ? (
                   // Digital Waveform Mouth
                   <g>
                     <rect x="-25" y="-2" width="50" height="4" fill={primaryColor} rx="2" opacity="0.8">
                        <animate attributeName="height" values="4;16;4;22;4" dur="0.15s" repeatCount="indefinite" />
                        <animate attributeName="y" values="-2;-8;-2;-11;-2" dur="0.15s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.8;1;0.8" dur="0.15s" repeatCount="indefinite" />
                     </rect>
                   </g>
                ) : (
                   mood === 'happy' ? (
                       <path d="M-20,-5 Q0,10 20,-5" stroke={primaryColor} strokeWidth="3" fill="none" strokeLinecap="round" />
                   ) : mood === 'error' ? (
                       <path d="M-20,5 Q0,-5 20,5" stroke={primaryColor} strokeWidth="3" fill="none" strokeLinecap="round" />
                   ) : (
                       <rect x="-15" y="-2" width="30" height="4" fill={primaryColor} rx="2" opacity="0.4" />
                   )
                )}
             </g>
          </svg>
       </div>
    </div>
  );
});

Live2DAvatar.displayName = 'Live2DAvatar';
