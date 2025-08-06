import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Expand, Move } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ChartControlsProps {
  isMobileMode: boolean;
  canvasWidth: number;
  canvasHeight: number;
  onAddButton: () => void;
  onMaximizeCanvas: () => void;
  onDimensionChange: (value: string, dimension: 'width' | 'height') => void;
  onDimensionBlur: (currentValue: number, dimension: 'width' | 'height') => void;
  isMoveMode: boolean;
  onToggleMoveMode: () => void;
}

export const ChartControls = ({
  isMobileMode,
  canvasWidth,
  canvasHeight,
  onAddButton,
  onMaximizeCanvas,
  onDimensionChange,
  onDimensionBlur,
  isMoveMode,
  onToggleMoveMode,
}: ChartControlsProps) => {
  return (
    <div className={cn(
      "flex flex-col",
      isMobileMode ? "p-4 mb-2 gap-2" : "mb-6 gap-4"
    )}>
      <div className={cn(
        "flex items-center",
        isMobileMode ? "gap-2" : "gap-4"
      )}>
        <Button onClick={onAddButton} className="flex items-center gap-2 h-7">
          <Plus className="h-4 w-4" />
        Создать кнопку
        </Button>
        <Button variant="ghost" size="icon" onClick={onMaximizeCanvas} title="Развернуть на весь экран">
          <Expand className="h-5 w-5" />
        </Button>
        <Button
          variant={isMoveMode ? "secondary" : "ghost"}
          size="icon"
          onClick={onToggleMoveMode}
          title="Режим перемещения (отключает изменение размера)"
        >
          <Move className="h-5 w-5" />
        </Button>
      </div>
      
      <div className={cn(
        "flex items-center gap-1 flex-wrap",
        isMobileMode ? "grid grid-cols-[auto_1fr] gap-x-1 gap-y-1 w-full" : ""
      )}>
        <Label htmlFor="canvasWidth" className={cn(
          "text-right",
          isMobileMode && "text-left"
        )}>
          Ширина
        </Label>
        <Input
          id="canvasWidth"
          type="number"
          value={isNaN(canvasWidth) ? '' : canvasWidth}
          onChange={(e) => onDimensionChange(e.target.value, 'width')}
          onBlur={() => onDimensionBlur(canvasWidth, 'width')}
          className="w-20 h-7"
          min="100"
          maxLength={4}
        />
        <Label htmlFor="canvasHeight" className={cn(
          "text-right",
          isMobileMode && "text-left"
        )}>
          Высота
        </Label>
        <Input
          id="canvasHeight"
          type="number"
          value={isNaN(canvasHeight) ? '' : canvasHeight}
          onChange={(e) => onDimensionChange(e.target.value, 'height')}
          onBlur={() => onDimensionBlur(canvasHeight, 'height')}
          className="w-20 h-7"
          min="100"
          maxLength={4}
        />
      </div>
    </div>
  );
};
