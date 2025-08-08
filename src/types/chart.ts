export interface ChartButton {
  id: string;
  name: string;
  color: string;
  linkedItem: string; // Can be a range ID or 'label-only' or 'exit'
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'normal' | 'label' | 'exit';
  isFontAdaptive?: boolean;
  fontSize?: number;
  fontColor?: string;
  showLegend?: boolean;
  showRandomizer?: boolean;
  legendOverrides?: Record<string, string>;
  legendIsMultiLine?: boolean;
  linkButtons?: Array<{
    enabled: boolean;
    text: string;
    position: 'left' | 'center' | 'right';
    targetRangeId: string;
  }>;
  // Title properties
  showTitle?: boolean;
  titleText?: string;
  titleFontSize?: number;
  titleAlignment?: 'left' | 'center';
}

export interface StoredChart {
  id: string;
  name:string;
  buttons: ChartButton[];
  canvasWidth: number;
  canvasHeight: number;
  rangeAccessStats?: Record<string, number>; // New field for range access statistics
}
