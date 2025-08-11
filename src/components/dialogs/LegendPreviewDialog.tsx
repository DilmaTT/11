import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PokerMatrix } from "@/components/PokerMatrix";
import { StoredRange, Folder } from '@/types/range';
import { ActionButton as ActionButtonType } from "@/contexts/RangeContext";
import { ChartButton } from '@/types/chart';
import { useIsMobile } from '@/hooks/use-mobile';

// Helper function to get the color for a simple action
const getActionColor = (actionId: string, allButtons: ActionButtonType[]): string => {
  if (actionId === 'fold') return '#6b7280';
  const button = allButtons.find(b => b.id === actionId);
  if (button && button.type === 'simple') {
    return button.color;
  }
  return '#ffffff'; // Fallback color
};

// Helper function to get the style for any action button (simple or weighted)
const getActionButtonStyle = (button: ActionButtonType, allButtons: ActionButtonType[]) => {
  if (button.type === 'simple') {
    return { backgroundColor: button.color };
  }
  if (button.type === 'weighted') {
    const color1 = getActionColor(button.action1Id, allButtons);
    const color2 = getActionColor(button.action2Id, allButtons);
    return {
      background: `linear-gradient(to right, ${color1} ${button.weight}%, ${color2} ${button.weight}%)`,
    };
  }
  return {};
};

type LinkButtonConfig = NonNullable<ChartButton['linkButtons']>[0];
export type TitleConfig = {
  showTitle: boolean;
  titleText: string;
  titleFontSize: number;
  titleAlignment: 'left' | 'center';
};

interface LegendPreviewDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  linkedRange: StoredRange | null | undefined;
  actionButtons: ActionButtonType[];
  editingButton: ChartButton | null;
  onSave: (newConfig: { 
    overrides: Record<string, string>, 
    linkButtonsConfig?: ChartButton['linkButtons'],
    titleConfig?: TitleConfig,
    legendIsMultiLine?: boolean;
  }) => void;
  folders: Folder[];
}

const LinkButtonEditor = ({
  config,
  onConfigChange,
  folders,
  buttonIndex
}: {
  config: LinkButtonConfig;
  onConfigChange: (newConfig: LinkButtonConfig) => void;
  folders: Folder[];
  buttonIndex: number;
}) => {
  const [selectedFolderId, setSelectedFolderId] = useState('');

  useEffect(() => {
    if (config.targetRangeId) {
      const folder = folders.find(f => f.ranges.some(r => r.id === config.targetRangeId));
      setSelectedFolderId(folder?.id || '');
    } else if (folders.length > 0) {
      setSelectedFolderId(folders[0].id);
    }
  }, [config.targetRangeId, folders]);

  const rangesInSelectedFolder = useMemo(() => {
    const folder = folders.find(f => f.id === selectedFolderId);
    return folder ? folder.ranges : [];
  }, [selectedFolderId, folders]);

  const handleFolderChange = (folderId: string) => {
    setSelectedFolderId(folderId);
    const firstRangeId = folders.find(f => f.id === folderId)?.ranges[0]?.id || '';
    onConfigChange({ ...config, targetRangeId: firstRangeId });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor={`link-button-text-${buttonIndex}`}>Текст на кнопке</Label>
        <Input
          id={`link-button-text-${buttonIndex}`}
          value={config.text}
          onChange={(e) => onConfigChange({ ...config, text: e.target.value })}
          placeholder="Напр. vs 3-bet"
        />
      </div>
      {buttonIndex === 0 && (
        <div>
          <Label htmlFor="link-button-position">Расположение группы кнопок</Label>
          <Select
            value={config.position}
            onValueChange={(value: 'left' | 'center' | 'right') => onConfigChange({ ...config, position: value })}
          >
            <SelectTrigger id="link-button-position">
              <SelectValue placeholder="Выберите расположение" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Слева</SelectItem>
              <SelectItem value="center">По центру</SelectItem>
              <SelectItem value="right">Справа</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      <div>
        <Label>Целевой ренж</Label>
        <div className="flex gap-2">
          <Select value={selectedFolderId} onValueChange={handleFolderChange}>
            <SelectTrigger><SelectValue placeholder="Выберите папку" /></SelectTrigger>
            <SelectContent>
              {folders.map(folder => (
                <SelectItem key={folder.id} value={folder.id}>{folder.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={config.targetRangeId}
            onValueChange={(rangeId) => onConfigChange({ ...config, targetRangeId: rangeId })}
            disabled={!selectedFolderId}
          >
            <SelectTrigger><SelectValue placeholder="Выберите ренж" /></SelectTrigger>
            <SelectContent>
              {rangesInSelectedFolder.map(range => (
                <SelectItem key={range.id} value={range.id}>{range.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export const LegendPreviewDialog = ({
  isOpen,
  onOpenChange,
  linkedRange,
  actionButtons,
  editingButton,
  onSave,
  folders,
}: LegendPreviewDialogProps) => {
  const [tempLegendOverrides, setTempLegendOverrides] = useState<Record<string, string>>({});
  const [linkButtonConfigs, setLinkButtonConfigs] = useState<LinkButtonConfig[]>([]);
  const [titleConfig, setTitleConfig] = useState<TitleConfig>({
    showTitle: false,
    titleText: '',
    titleFontSize: 20,
    titleAlignment: 'center',
  });
  const [legendIsMultiLine, setLegendIsMultiLine] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isOpen) {
      setTempLegendOverrides(editingButton?.legendOverrides || {});
      
      const initialLinkConfigs = editingButton?.linkButtons || [];
      const filledLinkConfigs: LinkButtonConfig[] = Array(6).fill(null).map((_, index) => ({
        ...(initialLinkConfigs[index] || { enabled: false, text: '', position: 'center', targetRangeId: '' })
      }));
      setLinkButtonConfigs(filledLinkConfigs);

      setTitleConfig({
        showTitle: linkedRange?.showTitle || false,
        titleText: linkedRange?.titleText || linkedRange?.name || '',
        titleFontSize: linkedRange?.titleFontSize || 20,
        titleAlignment: linkedRange?.titleAlignment || 'center',
      });

      setLegendIsMultiLine(editingButton?.legendIsMultiLine ?? true);
    }
  }, [isOpen, editingButton, linkedRange]);

  const handleSave = () => {
    const cleanedOverrides: Record<string, string> = {};
    for (const key in tempLegendOverrides) {
      if (tempLegendOverrides[key] && tempLegendOverrides[key].trim() !== '') {
        cleanedOverrides[key] = tempLegendOverrides[key].trim();
      }
    }
    onSave({ 
      overrides: cleanedOverrides, 
      linkButtonsConfig: linkButtonConfigs,
      titleConfig,
      legendIsMultiLine,
    });
    onOpenChange(false);
  };

  const handleLinkButtonConfigChange = (index: number, newConfig: LinkButtonConfig) => {
    const updatedConfigs = [...linkButtonConfigs];
    updatedConfigs[index] = newConfig;
    
    if (index === 0) {
      const newPosition = newConfig.position;
      for (let i = 1; i < updatedConfigs.length; i++) {
        updatedConfigs[i] = { ...updatedConfigs[i], position: newPosition };
      }
    }
    setLinkButtonConfigs(updatedConfigs);
  };

  const actionsInPreviewedRange = useMemo(() => {
    if (!linkedRange) return [];
    const usedActionIds = new Set(Object.values(linkedRange.hands));
    return actionButtons.filter(action => usedActionIds.has(action.id));
  }, [linkedRange, actionButtons]);

  const positionClass = useMemo(() => {
    const alignment = linkButtonConfigs[0]?.position || 'center';
    return {
      left: 'justify-start',
      center: 'justify-center',
      right: 'justify-end',
    }[alignment];
  }, [linkButtonConfigs]);

  const enabledButtons = useMemo(() => {
    return linkButtonConfigs.filter(b => b.enabled && b.text.trim() !== '');
  }, [linkButtonConfigs]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl sm:max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
        mobileFullscreen={isMobile}
      >
        <DialogHeader>
          <DialogTitle>Предпросмотр и редактирование</DialogTitle>
        </DialogHeader>
        {linkedRange && (
          <div>
            <PokerMatrix
              selectedHands={linkedRange.hands}
              onHandSelect={() => {}}
              activeAction=""
              actionButtons={actionButtons}
              readOnly={true}
              isBackgroundMode={false}
              sizeVariant="editorPreview"
            />
            <div className="mt-4 space-y-3">
              <h4 className="font-semibold">Редактировать названия в легенде:</h4>
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="legend-multiline"
                  checked={legendIsMultiLine}
                  onCheckedChange={(checked) => setLegendIsMultiLine(!!checked)}
                />
                <Label htmlFor="legend-multiline">С новой строки</Label>
              </div>
              {actionsInPreviewedRange.map(action => (
                <div key={action.id} className="grid grid-cols-[auto_1fr] items-center gap-4">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <div className="w-4 h-4 rounded-sm border flex-shrink-0" style={getActionButtonStyle(action, actionButtons)} />
                    <Label htmlFor={`legend-override-${action.id}`}>{action.name}:</Label>
                  </div>
                  <Input
                    id={`legend-override-${action.id}`}
                    value={tempLegendOverrides[action.id] || ''}
                    onChange={(e) => setTempLegendOverrides(prev => ({ ...prev, [action.id]: e.target.value }))}
                    placeholder={`По умолчанию: ${action.name}`}
                  />
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t">
              <h4 className="font-semibold mb-3">Заголовок над матрицей</h4>
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox
                  id="show-title"
                  checked={titleConfig.showTitle}
                  onCheckedChange={(checked) => setTitleConfig(prev => ({ ...prev, showTitle: !!checked }))}
                />
                <Label htmlFor="show-title">Показывать заголовок</Label>
              </div>
              {titleConfig.showTitle && (
                <div className="space-y-4 pl-6">
                  <div>
                    <Label htmlFor="title-text">Текст заголовка</Label>
                    <Input
                      id="title-text"
                      value={titleConfig.titleText}
                      onChange={(e) => setTitleConfig(prev => ({ ...prev, titleText: e.target.value }))}
                      placeholder="Напр. Open Raise BTN"
                    />
                  </div>
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <Label htmlFor="title-font-size">Размер шрифта (px)</Label>
                      <Input
                        id="title-font-size"
                        type="number"
                        value={titleConfig.titleFontSize}
                        onChange={(e) => setTitleConfig(prev => ({ ...prev, titleFontSize: Number(e.target.value) || 20 }))}
                      />
                    </div>
                    <div>
                      <Label>Выравнивание</Label>
                      <RadioGroup
                        value={titleConfig.titleAlignment}
                        onValueChange={(value: 'left' | 'center') => setTitleConfig(prev => ({ ...prev, titleAlignment: value }))}
                        className="flex gap-4 mt-2"
                      >
                        <div className="flex items-center space-x-2"><RadioGroupItem value="left" id="align-left" /><Label htmlFor="align-left">Слева</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="center" id="align-center" /><Label htmlFor="align-center">По центру</Label></div>
                      </RadioGroup>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t">
              <h4 className="font-semibold mb-3">Кнопки-ссылки на другой ренж</h4>
              
              {enabledButtons.length > 0 && (
                <div className="space-y-2 mb-6">
                  <Label>Предпросмотр кнопок</Label>
                  <div className={`p-4 border rounded-lg bg-muted/40 flex ${positionClass}`}>
                    <div className="grid grid-cols-3 gap-2">
                      {enabledButtons.map((btn, i) => (
                        <Button key={i} variant="outline" size="sm" className="pointer-events-none">
                          {btn.text}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <Label>Настройки кнопок</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-2">
                {linkButtonConfigs.map((config, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center space-x-2 mb-4">
                      <Checkbox
                        id={`enable-link-button-${index}`}
                        checked={config.enabled}
                        onCheckedChange={(checked) => handleLinkButtonConfigChange(index, { ...config, enabled: !!checked })}
                      />
                      <Label htmlFor={`enable-link-button-${index}`} className="font-semibold">Кнопка-ссылка #{index + 1}</Label>
                    </div>
                    {config.enabled && (
                      <LinkButtonEditor
                        config={config}
                        onConfigChange={(newConfig) => handleLinkButtonConfigChange(index, newConfig)}
                        folders={folders}
                        buttonIndex={index}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
          <Button onClick={handleSave}>Сохранить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
