import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import React, { useState, useEffect, useRef } from 'react';
import { useIsMobile } from "@/hooks/use-mobile";
import { ActionButton } from "@/contexts/RangeContext";
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
  if (actionId === 'fold') {
    return '#6b7280'; // Muted gray for Fold
  }
  const button = buttons.find(b => b.id === actionId);
  if (button && button.type === 'simple') {
    return button.color;
  }
  // Fallback for weighted buttons or if not found (should not happen in weighted context)
  return '#ffffff'; 
};

export const PokerMatrix = ({ selectedHands, onHandSelect, activeAction, actionButtons, readOnly = false, isBackgroundMode = false, sizeVariant = 'default' }: PokerMatrixProps) => {
  const isMobile = useIsMobile();
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'select' | 'deselect' | null>(null);
  const lastHandSelectedDuringDrag = useRef<string | null>(null);
  const touchStarted = useRef(false);
  const hasDragged = useRef(false); // To distinguish a tap from a drag

  // If in background mode, disable dragging and force readOnly
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
    
    hasDragged.current = false; // Reset for each new interaction
    lastHandSelectedDuringDrag.current = hand;
    setIsDragging(true);

    const currentHandAction = selectedHands[hand];
    const mode = currentHandAction === activeAction ? 'deselect' : 'select';
    setDragMode(mode);

    // Immediately select/deselect the initial hand
    onHandSelect(hand, mode);
  };

  const handleTouchStart = (hand: string) => {
    touchStarted.current = true;
    handlePointerDown(hand);
  };

  const handleMouseDown = (hand: string) => {
    if (touchStarted.current) {
      return;
    }
    handlePointerDown(hand);
  };

  const handlePointerEnter = (hand: string) => {
    if (readOnly || isBackgroundMode || !isDragging || !dragMode) return;
    
    // Only select if the hand is different from the last one processed during this drag
    if (lastHandSelectedDuringDrag.current !== hand) {
        hasDragged.current = true; // Confirm a drag has occurred
        onHandSelect(hand, dragMode);
        lastHandSelectedDuringDrag.current = hand;
    }
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || isBackgroundMode) return;
    event.preventDefault(); // Prevent scrolling while dragging
    
    const touch = event.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);

    if (element instanceof HTMLElement && element.dataset.hand) {
      const hand = element.dataset.hand;
      handlePointerEnter(hand);
    }
  };

  const handleClick = (hand: string) => {
    if (readOnly || isBackgroundMode) return;

    // If no drag occurred, this is a tap.
    // The initial selection for a drag is handled in handlePointerDown,
    // so we only need to act here if it was a pure click/tap.
    if (!hasDragged.current) {
        // If it was a pure tap, and handlePointerDown already selected it,
        // we need to ensure it's not double-processed or toggled incorrectly.
        // The current logic in handlePointerDown already performs the toggle.
        // So, for a pure click, we don't need to do anything here as handlePointerDown
        // already handled the selection.
        // This `handleClick` will only be triggered if the user clicks and releases
        // without any `mousemove` or `touchmove` events that would set `hasDragged.current = true`.
        // Since `handlePointerDown` already toggles the state, this `handleClick`
        // should effectively do nothing for a pure tap, as the state is already set.
        // However, if `handlePointerDown` only *starts* the drag and `onHandSelect`
        // is meant to be called only once per interaction (either tap or drag),
        // then the current `handleClick` logic is correct for a tap.
        // Given the change to `handlePointerDown` to immediately select,
        // this `handleClick` might become redundant for simple taps.
        // Let's keep it as is for now, as `onHandSelect` is idempotent for toggling.
        // If `onHandSelect` is called twice for a single tap, it will just toggle back.
        // The fix is to ensure `handlePointerDown` makes the initial selection.
        // The `handleClick` is primarily for cases where `onHandSelect` wasn't called by `handlePointerDown`
        // or if it needs to re-evaluate the state after a very quick tap.
        // With the new `handlePointerDown` logic, a pure tap will call `onHandSelect` once.
        // If `handleClick` is also called, it will call `onHandSelect` again, effectively undoing the first action.
        // Therefore, we should prevent `handleClick` from acting if `handlePointerDown` already did.
        // The `hasDragged.current` check is key here. If `hasDragged.current` is false, it means
        // no drag occurred. `handlePointerDown` already made the initial selection.
        // So, for a pure tap, we should *not* call `onHandSelect` again in `handleClick`.
        // The `handleClick` should only be relevant if `handlePointerDown` *didn't* make the selection,
        // which is no longer the case.
        // So, we can remove the `onHandSelect` call from `handleClick` entirely.
        // The `handlePointerDown` will handle the initial selection for both taps and drags.
        // `handlePointerEnter` will handle subsequent selections during a drag.
        // `handleClick` is then only for the "click" event, which is redundant if `onPointerDown` already handled it.
        // Let's remove the `onHandSelect` call from `handleClick`.
    }
  };

  const getHandStyle = (hand: string) => {
    const actionId = selectedHands[hand];
    if (!actionId) return {};

    const action = actionButtons.find(b => b.id === actionId);
    if (!action) return {};

    if (action.type === 'simple') {
      return { backgroundColor: action.color, color: 'white' };
    }

    if (action.type === 'weighted') {
      const color1 = getActionColor(action.action1Id, actionButtons);
      const color2 = getActionColor(action.action2Id, actionButtons);
      const weight1 = action.weight;
      
      return {
        background: `linear-gradient(to right, ${color1} ${weight1}%, ${color2} ${weight1}%)`,
        color: 'white',
        border: 'none' // Remove border for gradient buttons for a cleaner look
      };
    }

    return {};
  };

  const getHandColorClass = (hand: string) => {
    const actionId = selectedHands[hand];
    if (!actionId) {
      return 'bg-muted/50 text-muted-foreground hover:bg-muted/70';
    }
    // If an action is assigned, we let getHandStyle handle the colors
    // and return an empty class string to avoid conflicts.
    return '';
  };

  // Adjust parentContainerClasses based on isBackgroundMode and sizeVariant
  const parentContainerClasses = cn(
    "space-y-4",
    isBackgroundMode 
      ? "w-full h-full flex items-center justify-center" 
      : isMobile 
        ? "w-full !px-0" 
        : "w-full"
  );
  
  // Adjust gridClasses for background mode to ensure it scales within its parent
  const gridClasses = cn(
    "grid grid-cols-13 aspect-square w-full select-none rounded-lg",
    isBackgroundMode ? "gap-0.5" : (isMobile ? "gap-0.5 sm:gap-1" : "gap-1"),
    isBackgroundMode ? "max-w-full max-h-full" : ""
  );
  
  const buttonClasses = cn(
    "w-full h-full aspect-square font-mono border transition-all duration-200",
    "hover:ring-2 hover:ring-ring",
    "rounded-md",
    isMobile ? "text-xs p-0" : "text-sm p-0.5"
  );

  const matrixContent = (
    <div
      className={gridClasses}
      onTouchMove={handleTouchMove}
    >
      {HANDS.map((row, rowIndex) => 
        row.map((hand, colIndex) => (
          <Button
            key={`${rowIndex}-${colIndex}`}
            data-hand={hand}
            variant="outline"
            size="sm"
            className={cn(
              buttonClasses,
              getHandColorClass(hand)
            )}
            style={getHandStyle(hand)}
            onClick={() => handleClick(hand)}
            onMouseDown={() => handleMouseDown(hand)}
            onMouseEnter={() => handlePointerEnter(hand)}
            onTouchStart={() => handleTouchStart(hand)}
            // The disabled attribute is removed to prevent dimming
          >
            {hand}
          </Button>
        ))
      )}
    </div>
  );

  return (
    <div className={parentContainerClasses}>
      {matrixContent}
    </div>
  );
};

// Helper to get the number of combinations for a given hand type
export const getCombinations = (hand: string): number => {
  if (hand.length === 2 && hand[0] === hand[1]) { // Pair, e.g., 'AA'
    return 6;
  }
  if (hand.endsWith('s')) { // Suited, e.g., 'AKs'
    return 4;
  }
  if (hand.endsWith('o')) { // Offsuit, e.g., 'AKo'
    return 12;
  }
  return 0; // Should not happen for valid poker hands
};

// Calculate total possible combinations (1326)
export const TOTAL_POKER_COMBINATIONS = HANDS.flat().reduce((sum, hand) => sum + getCombinations(hand), 0);
