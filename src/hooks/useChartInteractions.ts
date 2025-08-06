import { useState, useCallback, useEffect, RefObject } from 'react';
import { ChartButton } from '@/types/chart';

const MIN_BUTTON_DIMENSION = 5;

interface UseChartInteractionsProps {
  buttons: ChartButton[];
  setButtons: React.Dispatch<React.SetStateAction<ChartButton[]>>;
  canvasRef: RefObject<HTMLDivElement>;
  isMoveMode: boolean;
}

export const useChartInteractions = ({ buttons, setButtons, canvasRef, isMoveMode }: UseChartInteractionsProps) => {
  const [activeButtonId, setActiveButtonId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);

  // Clear selection when move mode is toggled off
  useEffect(() => {
    if (!isMoveMode) {
      setActiveButtonId(null);
    }
  }, [isMoveMode]);

  // Handle deselection by clicking on the canvas background
  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    const handleCanvasMouseDown = (e: MouseEvent) => {
      if (e.target === canvasEl) {
        setActiveButtonId(null);
      }
    };

    canvasEl.addEventListener('mousedown', handleCanvasMouseDown);
    return () => {
      canvasEl.removeEventListener('mousedown', handleCanvasMouseDown);
    };
  }, [canvasRef]);

  const getResizeDirection = useCallback((e: React.MouseEvent | React.TouchEvent, button: ChartButton) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const coords = (e as React.TouchEvent).touches?.[0] || (e as React.MouseEvent);
    const x = coords.clientX - rect.left;
    const y = coords.clientY - rect.top;
    const tolerance = 8; // Pixels from edge to detect resize

    let direction = null;
    if (x < tolerance && y < tolerance) direction = 'nw';
    else if (x > rect.width - tolerance && y < tolerance) direction = 'ne';
    else if (x < tolerance && y > rect.height - tolerance) direction = 'sw';
    else if (x > rect.width - tolerance && y > rect.height - tolerance) direction = 'se';
    else if (x < tolerance) direction = 'w';
    else if (x > rect.width - tolerance) direction = 'e';
    else if (y < tolerance) direction = 'n';
    else if (y > rect.height - tolerance) direction = 's';
    return direction;
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent, button: ChartButton) => {
    if ((e.target as HTMLElement).closest('.settings-icon')) {
      return;
    }
    e.stopPropagation();
    setActiveButtonId(button.id);

    const direction = getResizeDirection(e, button);
    if (!isMoveMode && direction) {
      setIsResizing(true);
      setResizeDirection(direction);
    } else {
      setIsDragging(true);
    }

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, [getResizeDirection, isMoveMode]);

  const handleTouchStart = useCallback((e: React.TouchEvent, button: ChartButton) => {
    if ((e.target as HTMLElement).closest('.settings-icon')) {
      return;
    }
    e.stopPropagation();
    setActiveButtonId(button.id);

    const direction = getResizeDirection(e, button);
    if (!isMoveMode && direction) {
      setIsResizing(true);
      setResizeDirection(direction);
    } else {
      setIsDragging(true);
    }

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const touch = e.touches[0];
    setDragOffset({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    });
  }, [getResizeDirection, isMoveMode]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!activeButtonId || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const currentButton = buttons.find(b => b.id === activeButtonId);
    if (!currentButton) return;

    if (isDragging) {
      let newX = e.clientX - dragOffset.x - canvasRect.left;
      let newY = e.clientY - dragOffset.y - canvasRect.top;

      newX = Math.max(0, Math.min(newX, canvasRect.width - currentButton.width));
      newY = Math.max(0, Math.min(newY, canvasRect.height - currentButton.height));

      setButtons(prev =>
        prev.map(btn =>
          btn.id === activeButtonId ? { ...btn, x: newX, y: newY } : btn
        )
      );
    } else if (isResizing && resizeDirection) {
      let newWidth = currentButton.width;
      let newHeight = currentButton.height;
      let newX = currentButton.x;
      let newY = currentButton.y;

      switch (resizeDirection) {
        case 'e':
          newWidth = Math.max(MIN_BUTTON_DIMENSION, e.clientX - (currentButton.x + canvasRect.left));
          break;
        case 's':
          newHeight = Math.max(MIN_BUTTON_DIMENSION, e.clientY - (currentButton.y + canvasRect.top));
          break;
        case 'w':
          const diffX = e.clientX - (currentButton.x + canvasRect.left);
          newWidth = Math.max(MIN_BUTTON_DIMENSION, currentButton.width - diffX);
          newX = currentButton.x + diffX;
          break;
        case 'n':
          const diffY = e.clientY - (currentButton.y + canvasRect.top);
          newHeight = Math.max(MIN_BUTTON_DIMENSION, currentButton.height - diffY);
          newY = currentButton.y + diffY;
          break;
        case 'se':
          newWidth = Math.max(MIN_BUTTON_DIMENSION, e.clientX - (currentButton.x + canvasRect.left));
          newHeight = Math.max(MIN_BUTTON_DIMENSION, e.clientY - (currentButton.y + canvasRect.top));
          break;
        case 'sw':
          const diffX_sw = e.clientX - (currentButton.x + canvasRect.left);
          newWidth = Math.max(MIN_BUTTON_DIMENSION, currentButton.width - diffX_sw);
          newX = currentButton.x + diffX_sw;
          newHeight = Math.max(MIN_BUTTON_DIMENSION, e.clientY - (currentButton.y + canvasRect.top));
          break;
        case 'ne':
          newWidth = Math.max(MIN_BUTTON_DIMENSION, e.clientX - (currentButton.x + canvasRect.left));
          const diffY_ne = e.clientY - (currentButton.y + canvasRect.top);
          newHeight = Math.max(MIN_BUTTON_DIMENSION, currentButton.height - diffY_ne);
          newY = currentButton.y + diffY_ne;
          break;
        case 'nw':
          const diffX_nw = e.clientX - (currentButton.x + canvasRect.left);
          newWidth = Math.max(MIN_BUTTON_DIMENSION, currentButton.width - diffX_nw);
          newX = currentButton.x + diffX_nw;
          const diffY_nw = e.clientY - (currentButton.y + canvasRect.top);
          newHeight = Math.max(MIN_BUTTON_DIMENSION, currentButton.height - diffY_nw);
          newY = currentButton.y + diffY_nw;
          break;
      }

      newX = Math.max(0, Math.min(newX, canvasRect.width - newWidth));
      newY = Math.max(0, Math.min(newY, canvasRect.height - newHeight));
      newWidth = Math.min(newWidth, canvasRect.width - newX);
      newHeight = Math.min(newHeight, canvasRect.height - newY);

      setButtons(prev =>
        prev.map(btn =>
          btn.id === activeButtonId ? { ...btn, x: newX, y: newY, width: newWidth, height: newHeight } : btn
        )
      );
    }
  }, [activeButtonId, isDragging, isResizing, dragOffset, resizeDirection, buttons, setButtons, canvasRef]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!activeButtonId || !canvasRef.current) return;
    e.preventDefault();

    const touch = e.touches[0];
    if (!touch) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const currentButton = buttons.find(b => b.id === activeButtonId);
    if (!currentButton) return;

    if (isDragging) {
      let newX = touch.clientX - dragOffset.x - canvasRect.left;
      let newY = touch.clientY - dragOffset.y - canvasRect.top;

      newX = Math.max(0, Math.min(newX, canvasRect.width - currentButton.width));
      newY = Math.max(0, Math.min(newY, canvasRect.height - currentButton.height));

      setButtons(prev =>
        prev.map(btn =>
          btn.id === activeButtonId ? { ...btn, x: newX, y: newY } : btn
        )
      );
    } else if (isResizing && resizeDirection) {
        let newWidth = currentButton.width;
        let newHeight = currentButton.height;
        let newX = currentButton.x;
        let newY = currentButton.y;
  
        switch (resizeDirection) {
          case 'e':
            newWidth = Math.max(MIN_BUTTON_DIMENSION, touch.clientX - (currentButton.x + canvasRect.left));
            break;
          case 's':
            newHeight = Math.max(MIN_BUTTON_DIMENSION, touch.clientY - (currentButton.y + canvasRect.top));
            break;
          case 'w':
            const diffX = touch.clientX - (currentButton.x + canvasRect.left);
            newWidth = Math.max(MIN_BUTTON_DIMENSION, currentButton.width - diffX);
            newX = currentButton.x + diffX;
            break;
          case 'n':
            const diffY = touch.clientY - (currentButton.y + canvasRect.top);
            newHeight = Math.max(MIN_BUTTON_DIMENSION, currentButton.height - diffY);
            newY = currentButton.y + diffY;
            break;
          case 'se':
            newWidth = Math.max(MIN_BUTTON_DIMENSION, touch.clientX - (currentButton.x + canvasRect.left));
            newHeight = Math.max(MIN_BUTTON_DIMENSION, touch.clientY - (currentButton.y + canvasRect.top));
            break;
          case 'sw':
            const diffX_sw = touch.clientX - (currentButton.x + canvasRect.left);
            newWidth = Math.max(MIN_BUTTON_DIMENSION, currentButton.width - diffX_sw);
            newX = currentButton.x + diffX_sw;
            newHeight = Math.max(MIN_BUTTON_DIMENSION, touch.clientY - (currentButton.y + canvasRect.top));
            break;
          case 'ne':
            newWidth = Math.max(MIN_BUTTON_DIMENSION, touch.clientX - (currentButton.x + canvasRect.left));
            const diffY_ne = touch.clientY - (currentButton.y + canvasRect.top);
            newHeight = Math.max(MIN_BUTTON_DIMENSION, currentButton.height - diffY_ne);
            newY = currentButton.y + diffY_ne;
            break;
          case 'nw':
            const diffX_nw = touch.clientX - (currentButton.x + canvasRect.left);
            newWidth = Math.max(MIN_BUTTON_DIMENSION, currentButton.width - diffX_nw);
            newX = currentButton.x + diffX_nw;
            const diffY_nw = touch.clientY - (currentButton.y + canvasRect.top);
            newHeight = Math.max(MIN_BUTTON_DIMENSION, currentButton.height - diffY_nw);
            newY = currentButton.y + diffY_nw;
            break;
        }
  
        newX = Math.max(0, Math.min(newX, canvasRect.width - newWidth));
        newY = Math.max(0, Math.min(newY, canvasRect.height - newHeight));
        newWidth = Math.min(newWidth, canvasRect.width - newX);
        newHeight = Math.min(newHeight, canvasRect.height - newY);
  
        setButtons(prev =>
          prev.map(btn =>
            btn.id === activeButtonId ? { ...btn, x: newX, y: newY, width: newWidth, height: newHeight } : btn
          )
        );
    }
  }, [activeButtonId, isDragging, isResizing, dragOffset, resizeDirection, buttons, setButtons, canvasRef]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeDirection(null);
    // In move mode, the selection persists after mouse up.
    if (!isMoveMode) {
      setActiveButtonId(null);
    }
  }, [isMoveMode]);

  const handleButtonMouseMove = useCallback((e: React.MouseEvent, button: ChartButton) => {
    if (isDragging || isResizing) return;

    if (isMoveMode) {
      (e.currentTarget as HTMLElement).style.cursor = 'grab';
      return;
    }

    const direction = getResizeDirection(e, button);
    if (direction) {
      (e.currentTarget as HTMLElement).style.cursor = `${direction}-resize`;
    } else {
      (e.currentTarget as HTMLElement).style.cursor = 'grab';
    }
  }, [isDragging, isResizing, getResizeDirection, isMoveMode]);

  const handleButtonMouseLeave = useCallback((e: React.MouseEvent) => {
    if (isDragging || isResizing) return;
    (e.currentTarget as HTMLElement).style.cursor = 'default';
  }, [isDragging, isResizing]);

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp, handleTouchMove]);

  return {
    activeButtonId,
    handleMouseDown,
    handleTouchStart,
    handleButtonMouseMove,
    handleButtonMouseLeave,
  };
};
