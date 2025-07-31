/**
 * Represents a single hand range with its configuration.
 */
export interface StoredRange {
  id: string;
  name: string;
  hands: Record<string, string>; // Key: hand (e.g., 'AKs'), Value: actionId
}
