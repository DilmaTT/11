import { StoredRange } from './range';

export interface ChartButton {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  fontColor?: string;
  fontSize?: number;
  isFontAdaptive?: boolean;
  type: 'button' | 'label' | 'exit';
  linkedItem?: string; // rangeId for 'button' type

  // Legend/Display options that are specific to the button's context
  showRandomizer?: boolean;
  showLegend?: boolean;
  legendIsMultiLine?: boolean;
  legendOverrides?: Record<string, string>;
  linkButtons?: {
    enabled: boolean;
    text: string;
    position: 'left' | 'center' | 'right';
    targetRangeId: string;
  }[];

  // Title properties have been moved to the Range/StoredRange interface
}

export interface StoredChart {
  id: string;
  name: string;
  buttons: ChartButton[];
  canvasWidth: number;
  canvasHeight: number;
}
