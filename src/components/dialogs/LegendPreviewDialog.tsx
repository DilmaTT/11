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
import { PokerMatrix } from "@/components/PokerMatrix";
import { StoredRange } from '@/types/range';
import { ActionButton as ActionButtonType } from "@/contexts/RangeContext";

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

interface LegendPreviewDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  linkedRange: StoredRange | null | undefined;
  actionButtons: ActionButtonType[];
  initialOverrides: Record<string, string>;
  onSave: (newOverrides: Record<string, string>) => void;
}

export const LegendPreviewDialog = ({
  isOpen,
  onOpenChange,
  linkedRange,
  actionButtons,
  initialOverrides,
  onSave,
}: LegendPreviewDialogProps) => {
  const [tempLegendOverrides, setTempLegendOverrides] = useState<Record<string, string>>(initialOverrides);

  useEffect(() => {
    if (isOpen) {
      setTempLegendOverrides(initialOverrides);
    }
  }, [isOpen, initialOverrides]);

  const handleSave = () => {
    const cleanedOverrides: Record<string, string> = {};
    for (const key in tempLegendOverrides) {
      if (tempLegendOverrides[key] && tempLegendOverrides[key].trim() !== '') {
        cleanedOverrides[key] = tempLegendOverrides[key].trim();
      }
    }
    onSave(cleanedOverrides);
  };

  const actionsInPreviewedRange = useMemo(() => {
    if (!linkedRange) return [];
    const usedActionIds = new Set(Object.values(linkedRange.hands));
    return actionButtons.filter(action => usedActionIds.has(action.id));
  }, [linkedRange, actionButtons]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl sm:max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Предпросмотр и редактирование легенды</DialogTitle>
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
              <h4 className="font-semibold">Редактировать названия:</h4>
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
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
          <Button onClick={handleSave}>Сохранить легенду</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
