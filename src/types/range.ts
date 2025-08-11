/**
 * Represents a single hand range with its configuration.
 */
export interface StoredRange {
  id: string;
  name: string;
  hands: Record<string, string>; // Key: hand (e.g., 'AKs'), Value: actionId
  // Title properties are now part of the range
  showTitle?: boolean;
  titleText?: string;
  titleFontSize?: number;
  titleAlignment?: 'left' | 'center';
}

/**
 * Represents a folder containing multiple ranges.
 * This is consistent with the Folder interface in RangeContext.
 */
export interface Folder {
  id: string;
  name: string;
  ranges: StoredRange[];
}
