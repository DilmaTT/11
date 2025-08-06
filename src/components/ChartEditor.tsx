import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRangeContext } from "@/contexts/RangeContext";
import { StoredChart, ChartButton } from "@/types/chart";
import { useChartInteractions } from "@/hooks/useChartInteractions";
import { ChartCanvas } from "./ChartCanvas";
import { ChartControls } from "./ChartControls";
import { ButtonSettingsDialog } from "./dialogs/ButtonSettingsDialog";
import { LegendPreviewDialog } from "./dialogs/LegendPreviewDialog";

interface ChartEditorProps {
  isMobileMode?: boolean;
  chart: StoredChart;
  onBackToCharts: () => void;
  onSaveChart: (updatedChart: StoredChart) => void;
}

export const ChartEditor = ({ isMobileMode = false, chart, onBackToCharts, onSaveChart }: ChartEditorProps) => {
  const { folders, actionButtons } = useRangeContext();
  const allRanges = folders.flatMap(folder => folder.ranges);

  const [chartName, setChartName] = useState(chart.name);
  const [buttons, setButtons] = useState<ChartButton[]>(chart.buttons);
  const [canvasWidth, setCanvasWidth] = useState(chart.canvasWidth || 800);
  const [canvasHeight, setCanvasHeight] = useState(chart.canvasHeight || 500);
  const [isButtonModalOpen, setIsButtonModalOpen] = useState(false);
  const [editingButton, setEditingButton] = useState<ChartButton | null>(null);
  const [isLegendPreviewOpen, setIsLegendPreview] = useState(false);
  const [isMoveMode, setIsMoveMode] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);

  const MIN_CANVAS_DIMENSION = 100;
  const MIN_BUTTON_DIMENSION = 5;

  const {
    activeButtonId,
    handleMouseDown,
    handleTouchStart,
    handleButtonMouseMove,
    handleButtonMouseLeave,
  } = useChartInteractions({ buttons, setButtons, canvasRef, isMoveMode });

  useEffect(() => {
    setChartName(chart.name);
    setButtons(chart.buttons);
    setCanvasWidth(chart.canvasWidth || 800);
    setCanvasHeight(chart.canvasHeight || 500);
  }, [chart]);

  useEffect(() => {
    setButtons(prevButtons => {
      let changed = false;
      const updatedButtons = prevButtons.map(button => {
        let newX = button.x;
        let newY = button.y;
        let newWidth = button.width;
        let newHeight = button.height;

        newWidth = Math.max(MIN_BUTTON_DIMENSION, newWidth);
        newHeight = Math.max(MIN_BUTTON_DIMENSION, newHeight);

        newX = Math.max(0, Math.min(newX, canvasWidth - newWidth));
        newY = Math.max(0, Math.min(newY, canvasHeight - newHeight));

        newWidth = Math.min(newWidth, canvasWidth - newX);
        newHeight = Math.min(newHeight, canvasHeight - newY);

        if (newX !== button.x || newY !== button.y || newWidth !== button.width || newHeight !== button.height) {
          changed = true;
          return { ...button, x: newX, y: newY, width: newWidth, height: newHeight };
        }
        return button;
      });

      if (changed) {
        return updatedButtons;
      }
      return prevButtons;
    });
  }, [canvasWidth, canvasHeight]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isMoveMode || !activeButtonId) return;

      const selectedButton = buttons.find(b => b.id === activeButtonId);
      if (!selectedButton) return;

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }

      let dx = 0;
      let dy = 0;
      const step = e.shiftKey ? 10 : 1;

      switch (e.key) {
        case 'ArrowUp': dy = -step; break;
        case 'ArrowDown': dy = step; break;
        case 'ArrowLeft': dx = -step; break;
        case 'ArrowRight': dx = step; break;
        default: return;
      }

      setButtons(prevButtons =>
        prevButtons.map(btn => {
          if (btn.id === activeButtonId) {
            const newX = Math.max(0, Math.min(btn.x + dx, canvasWidth - btn.width));
            const newY = Math.max(0, Math.min(btn.y + dy, canvasHeight - btn.height));
            return { ...btn, x: newX, y: newY };
          }
          return btn;
        })
      );
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMoveMode, activeButtonId, buttons, setButtons, canvasWidth, canvasHeight]);

  const handleAddButton = () => {
    const newButton: ChartButton = {
      id: String(Date.now()),
      name: "new",
      color: "#60A5FA",
      linkedItem: allRanges.length > 0 ? allRanges[0].id : "label-only",
      x: 50,
      y: 50,
      width: 120,
      height: 40,
      type: allRanges.length > 0 ? 'normal' : 'label',
      isFontAdaptive: true,
      fontSize: 16,
      fontColor: 'white',
      showLegend: true,
      showRandomizer: false,
      legendOverrides: {},
      linkButtons: [
        { enabled: false, text: '', position: 'center', targetRangeId: '' },
        { enabled: false, text: '', position: 'center', targetRangeId: '' }
      ]
    };
    setButtons((prev) => [...prev, newButton]);
    setEditingButton(newButton);
    setIsButtonModalOpen(true);
  };

  const handleSettingsClick = (e: React.MouseEvent, button: ChartButton) => {
    e.stopPropagation();
    setEditingButton(button);
    setIsButtonModalOpen(true);
  };

  const handleSaveButtonProperties = () => {
    if (editingButton) {
      setButtons((prev) =>
        prev.map((btn) => (btn.id === editingButton.id ? editingButton : btn))
      );
      setIsButtonModalOpen(false);
      setEditingButton(null);
    }
  };

  const handleCancelButtonProperties = () => {
    if (editingButton && !chart.buttons.some(b => b.id === editingButton.id)) {
        setButtons(prevButtons => prevButtons.filter(b => b.id !== editingButton.id));
    }
    setIsButtonModalOpen(false);
    setEditingButton(null);
  };

  const duplicateCurrentButton = () => {
    if (editingButton) {
      const GAP = 0.1;
      let newX: number;
      let newY: number;

      // Proposed horizontal position
      const horizontalX = editingButton.x + editingButton.width + GAP;
      
      // Check if horizontal placement is possible
      if (horizontalX + editingButton.width <= canvasWidth) {
        newX = horizontalX;
        newY = editingButton.y;
      } else {
        // Proposed vertical position
        const verticalY = editingButton.y + editingButton.height + GAP;
        
        // Check if vertical placement is possible
        if (verticalY + editingButton.height <= canvasHeight) {
          newX = editingButton.x;
          newY = verticalY;
        } else {
          // Fallback: place slightly offset from original, ensuring it's in bounds
          newX = Math.min(editingButton.x + 10, canvasWidth - editingButton.width);
          newY = Math.min(editingButton.y + 10, canvasHeight - editingButton.height);
        }
      }

      // Final boundary check to be safe
      newX = Math.max(0, newX);
      newY = Math.max(0, newY);

      const newButton: ChartButton = {
        ...editingButton,
        id: String(Date.now()), // New unique ID
        x: newX,
        y: newY,
      };
      setButtons((prev) => [...prev, newButton]);
      setIsButtonModalOpen(false);
      setEditingButton(null);
    }
  };

  const handleDeleteButton = () => {
    if (editingButton) {
      setButtons(prev => prev.filter(btn => btn.id !== editingButton.id));
      setIsButtonModalOpen(false);
      setEditingButton(null);
    }
  };

  const handleBackButtonClick = () => {
    const updatedChart: StoredChart = {
      ...chart,
      name: chartName,
      buttons: buttons,
      canvasWidth: canvasWidth,
      canvasHeight: canvasHeight,
    };
    onSaveChart(updatedChart);
    onBackToCharts();
  };

  const handleDimensionChange = (value: string, dimension: 'width' | 'height') => {
    const setter = dimension === 'width' ? setCanvasWidth : setCanvasHeight;
    setter(parseInt(value, 10));
  };

  const handleDimensionBlur = (currentValue: number, dimension: 'width' | 'height') => {
    const setter = dimension === 'width' ? setCanvasWidth : setCanvasHeight;
    if (isNaN(currentValue) || currentValue < MIN_CANVAS_DIMENSION) {
      setter(MIN_CANVAS_DIMENSION);
    }
  };

  const handleMaximizeCanvas = () => {
    if (!isMobileMode) {
      setCanvasWidth(Math.round(window.innerWidth * 0.97));
      setCanvasHeight(Math.round(window.innerHeight * 0.91));
    } else {
      setCanvasWidth(window.innerWidth);
      setCanvasHeight(window.innerHeight);
    }
  };

  const handleOpenLegendPreview = () => {
    if (editingButton) {
      setIsLegendPreview(true); 
    }
  };

  const handleSaveLegendAndLinkConfig = (newConfig: { overrides: Record<string, string>, linkButtonsConfig?: ChartButton['linkButtons'] }) => {
    setEditingButton(prev => {
      if (!prev) return null;
      return { 
        ...prev, 
        legendOverrides: newConfig.overrides,
        linkButtons: newConfig.linkButtonsConfig
      };
    });
    setIsLegendPreview(false); 
  };

  const toggleMoveMode = () => {
    setIsMoveMode(prev => !prev);
  };

  const linkedRangeForPreview = editingButton?.linkedItem ? allRanges.find(r => r.id === editingButton.linkedItem) : null;

  return (
    <div className={cn(
      "p-6",
      isMobileMode ? "flex-1 overflow-y-auto" : "min-h-screen"
    )}>
      <div className={cn(
        "mx-auto",
        isMobileMode ? "w-full" : ""
      )}>
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleBackButtonClick} title="Назад к чартам">
              <ArrowLeft className="h-6 w-6 text-foreground" />
            </Button>
            <h1 className="text-3xl font-bold text-foreground">{chartName}</h1>
          </div>
        </div>

        <ChartControls
          isMobileMode={isMobileMode || false}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          onAddButton={handleAddButton}
          onMaximizeCanvas={handleMaximizeCanvas}
          onDimensionChange={handleDimensionChange}
          onDimensionBlur={handleDimensionBlur}
          isMoveMode={isMoveMode}
          onToggleMoveMode={toggleMoveMode}
        />
        
        <ChartCanvas
          canvasRef={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          buttons={buttons}
          activeButtonId={activeButtonId}
          onButtonMouseDown={handleMouseDown}
          onButtonTouchStart={handleTouchStart}
          onButtonMouseMove={handleButtonMouseMove}
          onButtonMouseLeave={handleButtonMouseLeave}
          onSettingsClick={handleSettingsClick}
        />

        <ButtonSettingsDialog
          isOpen={isButtonModalOpen}
          onOpenChange={setIsButtonModalOpen}
          isMobileMode={isMobileMode || false}
          editingButton={editingButton}
          setEditingButton={setEditingButton}
          onSave={handleSaveButtonProperties}
          onCancel={handleCancelButtonProperties}
          onDuplicate={duplicateCurrentButton}
          onDelete={handleDeleteButton}
          allRanges={allRanges}
          folders={folders} 
          onOpenLegendPreview={handleOpenLegendPreview}
        />

        <LegendPreviewDialog
          isOpen={isLegendPreviewOpen}
          onOpenChange={setIsLegendPreview} 
          linkedRange={linkedRangeForPreview}
          actionButtons={actionButtons}
          editingButton={editingButton}
          onSave={handleSaveLegendAndLinkConfig}
          folders={folders}
        />
      </div>
    </div>
  );
};
