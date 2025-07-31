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
  legendOverrides: Record<string, string>; // Key: actionId, Value: new name
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
