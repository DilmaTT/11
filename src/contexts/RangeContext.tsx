import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface SimpleActionButton {
  type: 'simple';
  id: string;
  name: string;
  color: string;
}

export interface WeightedActionButton {
  type: 'weighted';
  id:string;
  name: string;
  action1Id: string;
  action2Id:string;
  weight: number; // 0-100 for action1
}

export type ActionButton = SimpleActionButton | WeightedActionButton;

export interface Range {
  id: string;
  name: string;
  hands: Record<string, string>;
  // Title properties are now part of the range
  showTitle?: boolean;
  titleText?: string;
  titleFontSize?: number;
  titleAlignment?: 'left' | 'center';
}

export interface Folder {
  id: string;
  name: string;
  ranges: Range[];
}

export interface EditorSettings {
  cellBackgroundColor: {
    type: 'default' | 'white' | 'custom';
    customColor: string;
  };
  matrixBackgroundColor: {
    type: 'dark' | 'white' | 'custom';
    customColor: string;
  };
  cellBorderRadius: 'none' | 'sm' | 'md' | 'lg';
  cellSpacing: 'none' | 'sm' | 'md' | 'lg';
  font: {
    size: 's' | 'm' | 'l' | 'xl' | 'custom';
    customSize: string;
    color: 'auto' | 'white' | 'black';
    weight: 'normal' | 'bold';
    inactiveFontTransparent: boolean; // New property for 50% transparency
  };
}

const defaultEditorSettings: EditorSettings = {
  cellBackgroundColor: {
    type: 'default',
    customColor: '#374151',
  },
  matrixBackgroundColor: {
    type: 'dark',
    customColor: '#111827',
  },
  cellBorderRadius: 'md',
  cellSpacing: 'md',
  font: {
    size: 'm',
    customSize: '14px',
    color: 'white',
    weight: 'normal',
    inactiveFontTransparent: false, // Default to false
  },
};

interface RangeContextType {
  folders: Folder[];
  actionButtons: ActionButton[];
  editorSettings: EditorSettings;
  setFolders: React.Dispatch<React.SetStateAction<Folder[]>>;
  setActionButtons: React.Dispatch<React.SetStateAction<ActionButton[]>>;
  setEditorSettings: React.Dispatch<React.SetStateAction<EditorSettings>>;
  foldColor: string;
}

const RangeContext = createContext<RangeContextType | undefined>(undefined);

export const useRangeContext = () => {
  const context = useContext(RangeContext);
  if (!context) {
    throw new Error('useRangeContext must be used within a RangeProvider');
  }
  return context;
};

export const RangeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [folders, setFolders] = useState<Folder[]>(() => {
    const saved = localStorage.getItem('poker-ranges-folders');
    return saved ? JSON.parse(saved) : [{
      id: '1',
      name: 'Folder',
      ranges: [
        {
          id: '1',
          name: 'Range',
          hands: {}
        }
      ]
    }];
  });
  
  const [actionButtons, setActionButtons] = useState<ActionButton[]>(() => {
    const saved = localStorage.getItem('poker-ranges-actions');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((btn: any) => btn.type ? btn : { ...btn, type: 'simple' });
    }
    return [{ type: 'simple', id: 'raise', name: 'Raise', color: '#8b5cf6' }];
  });

  const [editorSettings, setEditorSettings] = useState<EditorSettings>(() => {
    try {
      const saved = localStorage.getItem('poker-editor-settings');
      const parsed = saved ? JSON.parse(saved) : defaultEditorSettings;
      
      const settings = { ...defaultEditorSettings, ...parsed };
      settings.cellBackgroundColor = { ...defaultEditorSettings.cellBackgroundColor, ...parsed.cellBackgroundColor };
      settings.matrixBackgroundColor = { ...defaultEditorSettings.matrixBackgroundColor, ...parsed.matrixBackgroundColor };
      settings.font = { ...defaultEditorSettings.font, ...parsed.font };

      if (!['s', 'm', 'l', 'xl', 'custom'].includes(settings.font.size)) {
        settings.font.size = defaultEditorSettings.font.size;
      }
      if (settings.font.size === 'custom' && !settings.font.customSize) {
        settings.font.customSize = defaultEditorSettings.font.customSize;
      }
      if (!['normal', 'bold'].includes(settings.font.weight)) {
        settings.font.weight = defaultEditorSettings.font.weight;
      }
      // Ensure inactiveFontTransparent is set, default to false if not present
      if (typeof settings.font.inactiveFontTransparent === 'undefined') {
        settings.font.inactiveFontTransparent = defaultEditorSettings.font.inactiveFontTransparent;
      }

      return settings;
    } catch {
      return defaultEditorSettings;
    }
  });

  const [foldColor, setFoldColor] = useState<string>('#6b7280');

  useEffect(() => {
    localStorage.setItem('poker-ranges-folders', JSON.stringify(folders));
  }, [folders]);

  useEffect(() => {
    localStorage.setItem('poker-ranges-actions', JSON.stringify(actionButtons));
  }, [actionButtons]);

  useEffect(() => {
    localStorage.setItem('poker-editor-settings', JSON.stringify(editorSettings));
  }, [editorSettings]);

  useEffect(() => {
    const matrixBgType = editorSettings.matrixBackgroundColor.type;
    const cellBgType = editorSettings.cellBackgroundColor.type;

    let newColor = '#6b7280'; // Default fallback

    if (matrixBgType === 'dark' && cellBgType === 'default') {
      newColor = '#161b26';
    } else if (matrixBgType === 'white' && cellBgType === 'default') {
      newColor = '#8f949d';
    } else if (matrixBgType === 'white' && cellBgType === 'white') {
      newColor = '#ffffff';
    }

    setFoldColor(newColor);
  }, [editorSettings]);

  return (
    <RangeContext.Provider value={{ folders, actionButtons, editorSettings, setFolders, setActionButtons, setEditorSettings, foldColor }}>
      {children}
    </RangeContext.Provider>
  );
};
