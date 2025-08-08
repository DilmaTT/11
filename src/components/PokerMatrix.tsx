import { Button } from "@/components/ui/button";
import { cn, isColorDark } from "@/lib/utils";
import React, { useState, useEffect, useRef } from 'react';
import { useIsMobile } from "@/hooks/use-mobile";
import { useRangeContext, ActionButton, EditorSettings } from "@/contexts/RangeContext";
import { HANDS } from "@/lib/poker-utils";

interface PokerMatrixProps {
  selectedHands: Record<string, string>;
  onHandSelect: (hand: string, mode: 'select' | 'deselect') => void;
  activeAction: string;
  actionButtons: ActionButton[];
  readOnly?: boolean;
  isBackgroundMode?: boolean;
  sizeVariant?: 'default' | 'editorPreview';
}

const getActionColor = (actionId: string, buttons: ActionButton[]): string => {
  if (actionId === 'fold') return '#6b7280';
  const button = buttons.find(b => b.id === actionId);
  if (button && button.type === 'simple') return button.color;
  return '#ffffff'; 
};

const getBorderRadiusClass = (radius: EditorSettings['cellBorderRadius']) => ({
  'none': 'rounded-none', 'sm': 'rounded-sm', 'md': 'rounded-md', 'lg': 'rounded-lg'
}[radius] || 'rounded-md');

const getCellSpacingClass = (spacing: EditorSettings['cellSpacing']) => ({
  'none': 'gap-0',
  'sm': 'gap-px sm:gap-0.5',
  'md': 'gap-0.5 sm:gap-1',
  'lg': 'gap-1 sm:gap-1.5'
}[spacing] || 'gap-0.5 sm:gap-1');

const getFontSizeClass = (size: EditorSettings['font']['size']) => {
  switch (size) {
    case 's': return 'text-xs';
    case 'm': return 'text-sm';
    case 'l': return 'text-base';
    case 'xl': return 'text-lg';
    default: return ''; // For 'custom'
  }
};

const getFontWeightClass = (weight: EditorSettings['font']['weight']) => ({
  'normal': 'font-normal',
  'bold': 'font-bold',
}[weight] || 'font-normal');

export const PokerMatrix = ({ selectedHands, onHandSelect, activeAction, actionButtons, readOnly = false, isBackgroundMode = false }: PokerMatrixProps) => {
  const isMobile = useIsMobile();
  const { editorSettings } = useRangeContext();
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'select' | 'deselect' | null>(null);
  const lastHandSelectedDuringDrag = useRef<string | null>(null);
  const touchStarted = useRef(false);
  const hasDragged = useRef(false);

  useEffect(() => {
    if (isBackgroundMode) {
      setIsDragging(false);
      setDragMode(null);
    }
  }, [isBackgroundMode]);

  useEffect(() => {
    const enhancedDragEnd = () => {
      setIsDragging(false);
      setDragMode(null);
      touchStarted.current = false;
    };
    window.addEventListener('mouseup', enhancedDragEnd);
    window.addEventListener('touchend', enhancedDragEnd);
    window.addEventListener('touchcancel', enhancedDragEnd);
    return () => {
      window.removeEventListener('mouseup', enhancedDragEnd);
      window.removeEventListener('touchend', enhancedDragEnd);
      window.removeEventListener('touchcancel', enhancedDragEnd);
    };
  }, []);

  const handlePointerDown = (hand: string) => {
    if (readOnly || isBackgroundMode) return;
    hasDragged.current = false;
    lastHandSelectedDuringDrag.current = hand;
    setIsDragging(true);
    const currentHandAction = selectedHands[hand];
    const mode = currentHandAction === activeAction ? 'deselect' : 'select';
    setDragMode(mode);
    onHandSelect(hand, mode);
  };

  const handleTouchStart = (hand: string) => {
    touchStarted.current = true;
    handlePointerDown(hand);
  };

  const handleMouseDown = (hand: string) => {
    if (touchStarted.current) return;
    handlePointerDown(hand);
  };

  const handlePointerEnter = (hand: string) => {
    if (readOnly || isBackgroundMode || !isDragging || !dragMode) return;
    if (lastHandSelectedDuringDrag.current !== hand) {
      hasDragged.current = true;
      onHandSelect(hand, dragMode);
      lastHandSelectedDuringDrag.current = hand;
    }
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || isBackgroundMode) return;
    event.preventDefault();
    const touch = event.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (element instanceof HTMLElement && element.dataset.hand) {
      handlePointerEnter(element.dataset.hand);
    }
  };

  const getHandStyle = (hand: string): React.CSSProperties => {
    const { font, cellBackgroundColor } = editorSettings;
    const actionId = selectedHands[hand];
    const style: React.CSSProperties = {};

    if (font.size === 'custom' && font.customSize) {
      style.fontSize = font.customSize;
    }

    let finalBgColor: string | null = null;
    let isWeighted = false;

    if (actionId) {
      const action = actionButtons.find(b => b.id === actionId);
      if (action) {
        if (action.type === 'simple') {
          finalBgColor = action.color;
          style.backgroundColor = finalBgColor;
        } else if (action.type === 'weighted') {
          isWeighted = true;
          const color1 = getActionColor(action.action1Id, actionButtons);
          const color2 = getActionColor(action.action2Id, actionButtons);
          style.background = `linear-gradient(to right, ${color1} ${action.weight}%, ${color2} ${action.weight}%)`;
        }
      }
    } else {
      if (cellBackgroundColor.type === 'white') {
        finalBgColor = '#ffffff';
        style.backgroundColor = finalBgColor;
      } else if (cellBackgroundColor.type === 'custom') {
        finalBgColor = cellBackgroundColor.customColor;
        style.backgroundColor = finalBgColor;
      }
    }

    if (font.color === 'white') {
      style.color = 'white';
    } else if (font.color === 'black') {
      style.color = 'black';
    } else {
      if (isWeighted) {
        style.color = 'white';
      } else if (finalBgColor) {
        style.color = isColorDark(finalBgColor) ? 'white' : 'black';
      }
    }

    return style;
  };

  const getHandColorClass = (hand: string) => {
    if (selectedHands[hand]) return '';
    const { font, cellBackgroundColor } = editorSettings;
    if (cellBackgroundColor.type === 'default') {
      let classes = 'bg-muted/50 hover:bg-muted/70';
      if (font.color === 'auto') {
        classes += ' text-muted-foreground';
      }
      return classes;
    }
    return '';
  };

  const getMatrixBackgroundStyle = (): React.CSSProperties => {
    const { matrixBackgroundColor } = editorSettings;
    if (matrixBackgroundColor?.type === 'custom' && matrixBackgroundColor.customColor) {
      return { backgroundColor: matrixBackgroundColor.customColor };
    }
    return {};
  };

  const getMatrixBackgroundClass = () => {
    const { matrixBackgroundColor } = editorSettings;
    if (!matrixBackgroundColor) return 'bg-background';
    switch (matrixBackgroundColor.type) {
      case 'white': return 'bg-white';
      case 'dark': return 'bg-background';
      case 'custom': return '';
      default: return 'bg-background';
    }
  };

  const parentContainerClasses = cn(
    "space-y-4 rounded-lg",
    isMobile ? "px-[1%] py-[1%]" : "p-4",
    isBackgroundMode ? "w-full h-full flex items-center justify-center" : "w-full",
    getMatrixBackgroundClass()
  );
  
  const gridClasses = cn(
    "grid grid-cols-13 aspect-square w-full select-none rounded-lg",
    isBackgroundMode ? "gap-0.5" : getCellSpacingClass(editorSettings.cellSpacing)
  );
  
  const buttonClasses = cn(
    "w-full h-full aspect-square font-mono border transition-all duration-200",
    "hover:ring-2 hover:ring-ring",
    getBorderRadiusClass(editorSettings.cellBorderRadius),
    getFontSizeClass(editorSettings.font.size),
    getFontWeightClass(editorSettings.font.weight),
    isMobile ? "p-0" : "p-0.5"
  );

  return (
    <div className={parentContainerClasses} style={getMatrixBackgroundStyle()}>
      <div className={gridClasses} onTouchMove={handleTouchMove}>
        {HANDS.map((row, rowIndex) => 
          row.map((hand, colIndex) => (
            <Button
              key={`${rowIndex}-${colIndex}`}
              data-hand={hand}
              variant="outline"
              size="sm"
              className={cn(buttonClasses, getHandColorClass(hand))}
              style={getHandStyle(hand)}
              onMouseDown={() => handleMouseDown(hand)}
              onMouseEnter={() => handlePointerEnter(hand)}
              onTouchStart={() => handleTouchStart(hand)}
              onClick={() => { if (readOnly || isBackgroundMode || hasDragged.current) return; }}
            >
              {hand}
            </Button>
          ))
        )}
      </div>
    </div>
  );
};

export const getCombinations = (hand: string): number => {
  if (hand.length === 2 && hand[0] === hand[1]) return 6;
  if (hand.endsWith('s')) return 4;
  if (hand.endsWith('o')) return 12;
  return 0;
};

export const TOTAL_POKER_COMBINATIONS = HANDS.flat().reduce((sum, hand) => sum + getCombinations(hand), 0);
