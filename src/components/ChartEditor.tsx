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

  const canvasRef = useRef<HTMLDivElement>(null);

  const MIN_CANVAS_DIMENSION = 100;
  const MIN_BUTTON_DIMENSION = 5;

  const {
    activeButtonId,
    handleMouseDown,
    handleTouchStart,
    handleButtonMouseMove,
    handleButtonMouseLeave,
  } = useChartInteractions({ buttons, setButtons, canvasRef });

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
      showLegend: false,
      legendOverrides: {},
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
      const newButton: ChartButton = {
        ...editingButton,
        id: String(Date.now()), // New unique ID
        x: editingButton.x + 10, // Offset by 10px right
        y: editingButton.y + 10, // Offset by 10px down
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

  const handleSaveLegendOverrides = (newOverrides: Record<string, string>) => {
    setEditingButton(prev => {
      if (!prev) return null;
      return { ...prev, legendOverrides: newOverrides };
    });
    setIsLegendPreview(false); 
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
          initialOverrides={editingButton?.legendOverrides || {}}
          onSave={handleSaveLegendOverrides}
        />
      </div>
    </div>
  );
};
