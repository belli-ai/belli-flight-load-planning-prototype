/**
 * Color utilities for cargo visualization
 */

// Color palette for cargo visualization
export const CARGO_COLORS = [
  "#3d63da", // ANA Navy Blue
  "#3b82f6", // blue-500
  "#22c55e", // green-500
  "#a855f7", // purple-500
  "#ec4899", // pink-500
  "#14b8a6", // teal-500
  "#f59e0b", // amber-500
  "#6366f1", // indigo-500
];

/**
 * Get a consistent color for an AWB number.
 * Uses a simple hash to map AWB numbers to colors.
 */
export function getColorForAwb(awbNumber: string): string {
  // Use a simple hash to consistently map AWB numbers to colors
  // This works for both mock and real database AWB numbers
  let hash = 0;
  for (let i = 0; i < awbNumber.length; i++) {
    const char = awbNumber.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  const index = Math.abs(hash) % CARGO_COLORS.length;
  return CARGO_COLORS[index];
}

