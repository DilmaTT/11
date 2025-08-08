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
import { syncDataToSupabase } from "@/lib/data-manager";

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
  const [isCreatingNewButton, setIsCreatingNewButton] = useState(false);
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
      legendIsMultiLine: true,
      showRandomizer: false,
      legendOverrides: {},
      linkButtons: [
        { enabled: false, text: '', position: 'center', targetRangeId: '' },
        { enabled: false, text: '', position: 'center', targetRangeId: '' }
      ],
      showTitle: false,
      titleText: '',
      titleFontSize: 20,
      titleAlignment: 'center',
    };
    setButtons((prev) => [...prev, newButton]);
    setEditingButton(newButton);
    setIsCreatingNewButton(true);
    setIsButtonModalOpen(true);
  };

  const handleSettingsClick = (e: React.MouseEvent, button: ChartButton) => {
    e.stopPropagation();
    setEditingButton(button);
    setIsCreatingNewButton(false);
    setIsButtonModalOpen(true);
  };

  const handleSaveButtonProperties = () => {
    if (editingButton) {
      setButtons((prev) =>
        prev.map((btn) => (btn.id === editingButton.id ? editingButton : btn))
      );
      setIsButtonModalOpen(false);
      setEditingButton(null);
      setIsCreatingNewButton(false);
    }
  };

  const handleCancelButtonProperties = () => {
    if (editingButton && !chart.buttons.some(b => b.id === editingButton.id)) {
        setButtons(prevButtons => prevButtons.filter(b => b.id !== editingButton.id));
    }
    setIsButtonModalOpen(false);
    setEditingButton(null);
    setIsCreatingNewButton(false);
  };

  const duplicateCurrentButton = () => {
    if (editingButton) {
      const GAP = 10;
      let newX: number;
      let newY: number;

      const horizontalX = editingButton.x + editingButton.width + GAP;
      if (horizontalX + editingButton.width <= canvasWidth) {
        newX = horizontalX;
        newY = editingButton.y;
      } else {
        const verticalY = editingButton.y + editingButton.height + GAP;
        if (verticalY + editingButton.height <= canvasHeight) {
          newX = editingButton.x;
          newY = verticalY;
        } else {
          newX = Math.min(editingButton.x + GAP, canvasWidth - editingButton.width);
          newY = Math.min(editingButton.y + GAP, canvasHeight - editingButton.height);
        }
      }

      newX = Math.max(0, newX);
      newY = Math.max(0, newY);

      const newButton: ChartButton = {
        ...editingButton,
        id: String(Date.now()),
        x: newX,
        y: newY,
      };
      setButtons((prev) => [...prev, newButton]);
      setIsButtonModalOpen(false);
      setEditingButton(null);
      setIsCreatingNewButton(false);
    }
  };

  const handleDeleteButton = () => {
    if (editingButton) {
      setButtons(prev => prev.filter(btn => btn.id !== editingButton.id));
      setIsButtonModalOpen(false);
      setEditingButton(null);
      setIsCreatingNewButton(false);
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
    console.log("[ChartEditor] Chart saved, triggering background sync.");
    syncDataToSupabase(false);
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

  const handleSaveLegendAndLinkConfig = (newConfig: { 
    overrides: Record<string, string>, 
    linkButtonsConfig?: ChartButton['linkButtons'],
    titleConfig?: {
      showTitle: boolean;
      titleText: string;
      titleFontSize: number;
      titleAlignment: 'left' | 'center';
    },
    legendIsMultiLine?: boolean;
  }) => {
    setEditingButton(prev => {
      if (!prev) return null;
      return { 
        ...prev, 
        legendOverrides: newConfig.overrides,
        linkButtons: newConfig.linkButtonsConfig,
        legendIsMultiLine: newConfig.legendIsMultiLine,
        ...(newConfig.titleConfig && {
          showTitle: newConfig.titleConfig.showTitle,
          titleText: newConfig.titleConfig.titleText,
          titleFontSize: newConfig.titleConfig.titleFontSize,
          titleAlignment: newConfig.titleConfig.titleAlignment,
        })
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
          isCreatingNewButton={isCreatingNewButton}
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
