import type { CanvasPoint } from "../types";

export function screenToCanvas(
  clientX: number,
  clientY: number,
  pan: CanvasPoint,
  zoom: number
): CanvasPoint {
  const safeZoom = zoom === 0 ? 1 : zoom;

  return {
    x: (clientX - pan.x) / safeZoom,
    y: (clientY - pan.y) / safeZoom,
  };
}
