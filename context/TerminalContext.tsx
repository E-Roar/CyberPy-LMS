import React, { createContext, useContext, useState, useCallback } from 'react';

export type LogType = 'user' | 'system' | 'ai';

interface TerminalContextType {
  userLogs: string[];
  systemLogs: string[];
  aiLogs: string[];
  log: (type: LogType, message: string) => void;
  clear: (type: LogType) => void;
  // Visibility states
  showUser: boolean;
  showSystem: boolean;
  showAI: boolean;
  toggleTerminal: (type: LogType) => void;
}

const TerminalContext = createContext<TerminalContextType | undefined>(undefined);

export const TerminalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userLogs, setUserLogs] = useState<string[]>(["> CyberPy Kernel Ready."]);
  const [systemLogs, setSystemLogs] = useState<string[]>(["> System initialized.", "> Waiting for engine..."]);
  const [aiLogs, setAiLogs] = useState<string[]>(["> Neural Link established.", "> Awaiting query..."]);

  // Default: User Open, others Collapsed
  const [showUser, setShowUser] = useState(true);
  const [showSystem, setShowSystem] = useState(false);
  const [showAI, setShowAI] = useState(false);

  const log = useCallback((type: LogType, message: string) => {
    // Split multiline messages
    const lines = message.split('\n').filter(line => line.length > 0);
    
    switch (type) {
      case 'user':
        setUserLogs(prev => [...prev, ...lines]);
        break;
      case 'system':
        setSystemLogs(prev => {
           // Keep system logs cleaner, max 50 lines
           const newLogs = [...prev, ...lines];
           return newLogs.slice(-50);
        });
        break;
      case 'ai':
        setAiLogs(prev => [...prev, ...lines]);
        break;
    }
  }, []);

  const clear = useCallback((type: LogType) => {
    switch (type) {
      case 'user': setUserLogs(["> Console cleared."]); break;
      case 'system': setSystemLogs(["> System log cleared."]); break;
      case 'ai': setAiLogs(["> Memory buffer flushed."]); break;
    }
  }, []);

  const toggleTerminal = useCallback((type: LogType) => {
    switch (type) {
      case 'user': setShowUser(prev => !prev); break;
      case 'system': setShowSystem(prev => !prev); break;
      case 'ai': setShowAI(prev => !prev); break;
    }
  }, []);

  return (
    <TerminalContext.Provider value={{ 
      userLogs, systemLogs, aiLogs, log, clear,
      showUser, showSystem, showAI, toggleTerminal
    }}>
      {children}
    </TerminalContext.Provider>
  );
};

export const useTerminal = () => {
  const context = useContext(TerminalContext);
  if (context === undefined) {
    throw new Error('useTerminal must be used within a TerminalProvider');
  }
  return context;
};