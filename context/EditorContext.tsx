import React, { createContext, useContext, useState } from 'react';

interface EditorContextType {
  code: string;
  setCode: (code: string) => void;
  lastError: string | null;
  setLastError: (error: string | null) => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [code, setCode] = useState<string>("");
  const [lastError, setLastError] = useState<string | null>(null);

  return (
    <EditorContext.Provider value={{ code, setCode, lastError, setLastError }}>
      {children}
    </EditorContext.Provider>
  );
};

export const useEditorContext = () => {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error('useEditorContext must be used within an EditorProvider');
  }
  return context;
};
