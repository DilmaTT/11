/**
 * Represents a single button element on the chart canvas.
 */
export interface ChartButton {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  linkedItem: string; // ID of the linked Range, or a special value like 'label-only'
  type: 'normal' | 'label' | 'exit';
  isFontAdaptive: boolean;
  fontSize: number;
  fontColor: 'white' | 'black';
  showLegend: boolean;
  showRandomizer?: boolean;
  legendOverrides: Record<string, string>; // Key: actionId, Value: new name
  linkButtons?: Array<{
    enabled: boolean;
    text: string;
    position: 'left' | 'center' | 'right'; // Position now applies to the button group
    targetRangeId: string;
  }>;
}

/**
 * Represents a complete chart configuration, including its buttons and canvas dimensions.
 * This is the object that gets stored in localStorage.
 */
export interface StoredChart {
  id: string;
  name:string;
  buttons: ChartButton[];
  canvasWidth: number;
  canvasHeight: number;
}
